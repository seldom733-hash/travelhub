"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";

/* ── Types ── */
type TabId = "ceo" | "users" | "funnel" | "search" | "services" | "partners" | "finance" | "technical" | "marketing" | "moderation" | "users_mgmt" | "audit";

interface CeoData {
  today: { sales: number; bookings: number; commission: number; newUsers: number; newPartners: number; cancellations: number };
  totals: { gmv: number; platformRevenue: number; bookings: number; users: number; partners: number; avgCheck: number; avgCommission: number; cancellations: number; services: number };
  trends: { weekBookings: number; weekRevenue: number; monthBookings: number; monthRevenue: number };
  bookingsByDay: { date: string; count: number; revenue: number }[];
}

interface UserData {
  dau: number; wau: number; mau: number; total: number;
  byRole: { role: string; count: number }[];
  newByDay: { date: string; count: number }[];
  repeatPurchases: { once: number; twice: number; threePlus: number };
}

interface FunnelStep { step: string; count: number; rate?: number }
interface FunnelData { steps: FunnelStep[] }

interface SearchData {
  topQueries: { query: string; count: number; avgResults: number }[];
  emptySearches: { query: string; count: number }[];
  byDay: { date: string; count: number }[];
}

interface ServiceTypeData {
  type: string; count: number; avgPrice: number; avgRating: string;
  totalBookings: number; completedBookings: number; revenue: number;
  commission: number; topViewed: { id: string; title: string; views: number }[];
  conversion: string;
}

interface PartnerData {
  total: number;
  topByRevenue: { id: string; firstName: string; lastName: string; companyName: string | null; partnerType: string | null; revenue: number; completedBookings: number; avgRating: string; services: number; reviews: number }[];
  topByBookings: any[];
  topByRating: any[];
}

interface FinanceData {
  gmv: number; platformRevenue: number; refunds: number; pendingPayments: number;
  revenueByType: { type: string; revenue: number; fees: number; count: number }[];
  revenueByDay: { date: string; revenue: number; fees: number }[];
}

interface TechData {
  totalViews: number; todayViews: number; avgDuration: number;
  devices: { device: string; count: number }[];
  topPages: { path: string; count: number; avgDuration: number }[];
}

interface MarketingData {
  totals: { cost: number; revenue: number; profit: number; roi: number; cac: number; totalVisits: number; totalBookings: number; convRate: number };
  channels: { channel: string; visits: number; registrations: number; bookings: number; revenue: number; cost: number; cac: number; roi: number; convRate: number }[];
  campaigns: { name: string; channel: string; visits: number; bookings: number; revenue: number; cost: number; cac: number; roi: number }[];
  utmSources: { source: string; visits: number; bookings: number; revenue: number }[];
  eventsByDay: { date: string; visits: number; bookings: number; revenue: number }[];
}

interface ExtendedAnalytics {
  ceo?: CeoData; users?: UserData; funnel?: FunnelData; search?: SearchData;
  services?: ServiceTypeData[]; partners?: PartnerData;
  finance?: FinanceData; technical?: TechData; marketing?: MarketingData;
}

// TYPE_LABELS moved to i18n: t(`adminDashboard.typeLabels.${type}`)


/* ── Helpers ── */
const fmt = (n: number) => n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "K" : n.toLocaleString();
const money = (n: number) => n.toLocaleString("az-AZ") + " AZN";
const pct = (a: number, b: number) => b > 0 ? Math.round((a / b) * 100) : 0;

/* ── Reusable components ── */
function KpiCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-lg mb-3`}>{icon}</div>
      <div className="text-2xl font-bold text-secondary">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function BarChart({ data, maxVal, colorClass = "bg-primary" }: { data: { label: string; value: number }[]; maxVal: number; colorClass?: string }) {
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-28 truncate shrink-0">{d.label}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
            <div className={`h-full rounded-full ${colorClass} transition-all duration-700 ease-out`} style={{ width: `${maxVal > 0 ? Math.round((d.value / maxVal) * 100) : 0}%`, minWidth: d.value > 0 ? 4 : 0 }} />
          </div>
          <span className="text-xs font-semibold text-gray-700 w-16 text-right shrink-0">{fmt(d.value)}</span>
        </div>
      ))}
    </div>
  );
}

function MiniBarChart({ items, maxVal, colorClass = "bg-primary" }: { items: { label: string; value: number; color?: string }[]; maxVal: number; colorClass?: string }) {
  return (
    <div className="flex items-end gap-1 h-24">
      {items.map((d, i) => (
        <div key={i} className="flex-1 group relative">
          <div className={`${d.color || colorClass} rounded-t transition-all duration-300`} style={{ height: `${maxVal > 0 ? Math.max((d.value / maxVal) * 100, 2) : 2}%`, minHeight: 2 }} />
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
            {d.label}: {d.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-secondary flex items-center gap-2">{icon} {title}</h2>
      {children}
    </div>
  );
}

function Card({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 p-6 ${className}`}>
      {title && <h3 className="font-bold text-secondary mb-4">{title}</h3>}
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════════ */
/* MAIN COMPONENT */
/* ════════════════════════════════════════════════════════════════════════════════ */
function AdminDashboardInner() {

  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { t } = useI18n();
  const isModerator = user?.role === "MODERATOR";

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const tab = (searchParams.get("tab") as TabId) || "ceo";
    const valid: TabId[] = ["ceo", "users", "funnel", "search", "services", "partners", "finance", "technical", "marketing", "moderation", "users_mgmt", "audit"];
    return valid.includes(tab) ? tab : "ceo";
  });

  const [data, setData] = useState<ExtendedAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Moderation state
  const [moderationItems, setModerationItems] = useState<any[]>([]);
  const [moderationFilter, setModerationFilter] = useState<string>("PENDING");
  const [moderationLoading, setModerationLoading] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [moderationPage, setModerationPage] = useState(1);
  const [moderationTotalPages, setModerationTotalPages] = useState(1);
  const [moderationTotal, setModerationTotal] = useState(0);

  // Users management state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [usersSearch, setUsersSearch] = useState("");
  const [usersRoleFilter, setUsersRoleFilter] = useState("ALL");
  const [usersStatusFilter, setUsersStatusFilter] = useState("ALL");
  const [usersLoading, setUsersLoading] = useState(false);
  const [userActionLoading, setUserActionLoading] = useState<string | null>(null);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);

  // Audit log state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditActionFilter, setAuditActionFilter] = useState("ALL");
  const [auditTargetFilter, setAuditTargetFilter] = useState("ALL");
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);

  // User action modals
  const [banModalUser, setBanModalUser] = useState<any>(null);
  const [banReason, setBanReason] = useState("");
  const [roleModalUser, setRoleModalUser] = useState<any>(null);
  const [roleModalNewRole, setRoleModalNewRole] = useState("");

  const fetchModeration = useCallback(async (status = moderationFilter, page = moderationPage) => {
    setModerationLoading(true);
    try {
      const res = await fetch(`/api/admin/moderation?status=${status}&page=${page}&limit=20`, { credentials: "include" });
      if (res.ok) {
        const d = await res.json();
        setModerationItems(d.services || []);
        if (d.pagination) {
          setModerationTotalPages(d.pagination.totalPages || 1);
          setModerationTotal(d.pagination.total || 0);
        }
      }
    } catch (e) {
      console.error("Moderation fetch error:", e);
    } finally {
      setModerationLoading(false);
    }
  }, [moderationFilter, moderationPage]);

  const handleModeration = useCallback(async (serviceId: string, action: "approve" | "reject", reason?: string) => {
    setActionLoading(serviceId);
    try {
      const res = await fetch(`/api/admin/services/${serviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, reason }),
      });
      if (res.ok) {
        setModerationItems(prev => prev.filter(s => s.id !== serviceId));
        setRejectingId(null);
        setRejectReason("");
      } else {
        const err = await res.json();
        alert(err.error || t("adminDashboard.moderation.error"));
      }
    } catch (e) {
      alert(t("adminDashboard.moderation.networkError"));
    } finally {
      setActionLoading(null);
    }
  }, [t]);

  // Fetch basic stats for MODERATOR (uses /api/admin which allows MODERATOR)
  const fetchBasicData = useCallback(async (isBackground = false) => {
    try {
      if (isBackground) setIsRefreshing(true);
      const res = await fetch("/api/admin", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load stats");
      const basic = await res.json();
      // Map basic stats to CeoData format for the overview tab
      setData({
        ceo: {
          today: {
            sales: basic.totalRevenue || 0,
            bookings: basic.pendingBookings || 0,
            commission: 0,
            newUsers: 0,
            newPartners: 0,
            cancellations: 0,
          },
          totals: {
            gmv: basic.totalRevenue || 0,
            platformRevenue: basic.totalRevenue || 0,
            bookings: basic.pendingBookings || 0,
            users: basic.totalUsers || 0,
            partners: 0,
            avgCheck: 0,
            avgCommission: 0,
            cancellations: 0,
            services: basic.totalServices || 0,
          },
          trends: { weekBookings: 0, weekRevenue: 0, monthBookings: 0, monthRevenue: 0 },
          bookingsByDay: [],
        },
      });
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setIsLoading(false);
      if (isBackground) setIsRefreshing(false);
    }
  }, []);

  // Fetch full analytics for ADMIN
  const fetchData = useCallback(async (isBackground = false) => {
    try {
      if (isBackground) setIsRefreshing(true);
      const res = await fetch("/api/admin/analytics/extended?section=all", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load analytics");
      setData(await res.json());
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setIsLoading(false);
      if (isBackground) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Wait for auth to load before fetching data
    if (!user) return;
    if (isModerator) {
      fetchBasicData();
    } else {
      fetchData();
    }
  }, [user, isModerator, fetchBasicData, fetchData]);

  const fetchUsers = useCallback(async (page = usersPage) => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      if (usersSearch) params.set("search", usersSearch);
      if (usersRoleFilter !== "ALL") params.set("role", usersRoleFilter);
      if (usersStatusFilter !== "ALL") params.set("status", usersStatusFilter);
      params.set("page", String(page));
      params.set("limit", "20");
      const res = await fetch(`/api/admin/users?${params}`, { credentials: "include" });
      if (res.ok) {
        const d = await res.json();
        setUsersList(d.users || []);
        if (d.pagination) {
          setUsersTotalPages(d.pagination.totalPages || 1);
          setUsersTotal(d.pagination.total || 0);
        }
      }
    } catch (e) {
      console.error("Users fetch error:", e);
    } finally {
      setUsersLoading(false);
    }
  }, [usersSearch, usersRoleFilter, usersStatusFilter, usersPage]);

  const handleUserAction = useCallback(async (userId: string, action: string, reason?: string, newRole?: string) => {
    setUserActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, reason, newRole }),
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || t("adminDashboard.usersMgmt.error"));
      }
    } catch (e) {
      alert(t("adminDashboard.usersMgmt.networkError"));
    } finally {
      setUserActionLoading(null);
    }
  }, [fetchUsers, t]);

  const fetchAuditLogs = useCallback(async (page = auditPage) => {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams();
      if (auditActionFilter !== "ALL") params.set("action", auditActionFilter);
      if (auditTargetFilter !== "ALL") params.set("targetType", auditTargetFilter);
      params.set("page", String(page));
      params.set("limit", "20");
      const res = await fetch(`/api/admin/audit?${params}`, { credentials: "include" });
      if (res.ok) {
        const d = await res.json();
        setAuditLogs(d.logs || []);
        if (d.pagination) {
          setAuditTotalPages(d.pagination.totalPages || 1);
          setAuditTotal(d.pagination.total || 0);
        }
      }
    } catch (e) {
      console.error("Audit fetch error:", e);
    } finally {
      setAuditLoading(false);
    }
  }, [auditActionFilter, auditTargetFilter, auditPage]);

  // Fetch data when tabs are active (page resets handled via explicit page=1 on filter change)
  useEffect(() => {
    if (activeTab === "moderation") {
      fetchModeration(moderationFilter, moderationPage);
    } else if (activeTab === "users_mgmt") {
      fetchUsers(usersPage);
    } else if (activeTab === "audit") {
      fetchAuditLogs(auditPage);
    }
  }, [activeTab, moderationFilter, moderationPage, fetchModeration, fetchUsers, auditActionFilter, auditTargetFilter, auditPage, fetchAuditLogs]);

  // Auto-refresh polling (ADMIN only - MODERATOR uses basic stats)
  useEffect(() => {
    if (isAutoRefresh && !isModerator) {
      intervalRef.current = setInterval(() => fetchData(true), 30000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAutoRefresh, isModerator, fetchData]);

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">{t("adminDashboard.loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🛡</div>
          <h2 className="text-xl font-bold text-secondary mb-2">{t("adminDashboard.error")}</h2>
          <p className="text-gray-500">{error || t("adminDashboard.noData")}</p>
          <button onClick={() => { setError(null); setIsLoading(true); isModerator ? fetchBasicData() : fetchData(); }} className="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-sm hover:bg-primary-dark transition-colors">
            {t("adminDashboard.retry")}
          </button>
        </div>
      </div>
    );
  }

  const ceo = data.ceo;
  const usr = data.users;
  const fnl = data.funnel;
  const sch = data.search;
  const svc = data.services;
  const prt = data.partners;
  const fin = data.finance;
  const tech = data.technical;
  const mkt = data.marketing;

  /* ── Sidebar ── */
  // MODERATOR can only access: moderation
  // ADMIN can access everything
  const allSidebar: { icon: string; labelKey: string; id: TabId; adminOnly?: boolean }[] = [
    { icon: "📊", labelKey: "adminDashboard.sidebar.overview", id: "ceo" },
    { icon: "👥", labelKey: "adminDashboard.sidebar.users", id: "users", adminOnly: true },
    { icon: "🔽", labelKey: "adminDashboard.sidebar.funnel", id: "funnel", adminOnly: true },
    { icon: "🔍", labelKey: "adminDashboard.sidebar.search", id: "search", adminOnly: true },
    { icon: "📦", labelKey: "adminDashboard.sidebar.services", id: "services", adminOnly: true },
    { icon: "🤝", labelKey: "adminDashboard.sidebar.partners", id: "partners", adminOnly: true },
    { icon: "💰", labelKey: "adminDashboard.sidebar.finance", id: "finance", adminOnly: true },
    { icon: "⚙️", labelKey: "adminDashboard.sidebar.technical", id: "technical", adminOnly: true },
    { icon: "📣", labelKey: "adminDashboard.sidebar.marketing", id: "marketing", adminOnly: true },
    { icon: "🛡", labelKey: "adminDashboard.sidebar.moderation", id: "moderation" },
    { icon: "👤", labelKey: "adminDashboard.sidebar.usersMgmt", id: "users_mgmt", adminOnly: true },
    { icon: "📋", labelKey: "adminDashboard.sidebar.audit", id: "audit", adminOnly: true },
  ];
  const sidebar = isModerator ? allSidebar.filter(item => !item.adminOnly) : allSidebar;

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-secondary to-gray-800 rounded-3xl shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center text-3xl">🛡</div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{t("adminDashboard.title")}</h1>
              <p className="text-white/70">{t("adminDashboard.subtitle")}</p>
              {lastUpdated && (
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5 text-xs text-white/50">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${isRefreshing ? "bg-green-400 animate-pulse" : "bg-green-400"}`} />
                    {isRefreshing ? t("adminDashboard.refreshing") : `${t("adminDashboard.lastUpdated")} ${lastUpdated.toLocaleTimeString()}`}
                  </div>
                  <button
                    onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-all ${isAutoRefresh ? "bg-green-500/20 text-green-300 hover:bg-green-500/30" : "bg-white/10 text-white/50 hover:bg-white/20"}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isAutoRefresh ? "bg-green-400 animate-pulse" : "bg-gray-400"}`} />
                    {isAutoRefresh ? t("adminDashboard.autoRefreshOn") : t("adminDashboard.autoRefreshOff")}
                  </button>
                  {!isAutoRefresh && (
                    <button
                      onClick={() => isModerator ? fetchBasicData(true) : fetchData(true)}                       className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-all"
                     >
                       🔄 {t("adminDashboard.moderation.refresh")}
                     </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
          {/* Sidebar */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
              <nav className="space-y-1">
                {sidebar.map((item) => (
                  <button key={item.id} onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === item.id ? "bg-primary text-white shadow-md" : "text-gray-600 hover:bg-gray-50"}`}>
                    <span className="text-lg">{item.icon}</span>
                    <span className="flex-1 text-left">{t(item.labelKey)}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════ */}
          {/* MAIN CONTENT */}
          {/* ════════════════════════════════════════════════════════════ */}
          <div className="space-y-6 min-w-0">

            {/* ══════════ CEO DASHBOARD ══════════ */}
            {activeTab === "ceo" && ceo && (
              <>
                {/* Today KPIs */}
                <Section title={t("adminDashboard.ceo.sectionTitle")} icon="">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    <KpiCard icon="💰" label={t("adminDashboard.ceo.sales")} value={money(ceo.today.sales)} color="bg-green-50 text-green-600" />
                    <KpiCard icon="🛒" label={t("adminDashboard.ceo.bookings")} value={String(ceo.today.bookings)} color="bg-blue-50 text-blue-600" />
                    <KpiCard icon="🏦" label={t("adminDashboard.ceo.commission")} value={money(ceo.today.commission)} color="bg-primary/10 text-primary" />
                    <KpiCard icon="👤" label={t("adminDashboard.ceo.newUsers")} value={String(ceo.today.newUsers)} color="bg-purple-50 text-purple-600" />
                    <KpiCard icon="🤝" label={t("adminDashboard.ceo.newPartners")} value={String(ceo.today.newPartners)} color="bg-amber-50 text-amber-600" />
                    <KpiCard icon="❌" label={t("adminDashboard.ceo.cancellations")} value={String(ceo.today.cancellations)} color="bg-red-50 text-red-600" />
                    <KpiCard icon="📈" label={t("adminDashboard.ceo.avgCheck")} value={money(ceo.totals.avgCheck)} color="bg-indigo-50 text-indigo-600" />
                  </div>
                </Section>

                {/* Totals */}
                <Card title={t("adminDashboard.ceo.totalsTitle")}>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { label: t("adminDashboard.ceo.gmv"), value: money(ceo.totals.gmv) },
                      { label: t("adminDashboard.ceo.platformRevenue"), value: money(ceo.totals.platformRevenue) },
                      { label: "Бронирований", value: String(ceo.totals.bookings) },
                      { label: t("adminDashboard.ceo.totalUsers"), value: fmt(ceo.totals.users) },
                      { label: t("adminDashboard.ceo.totalPartners"), value: String(ceo.totals.partners) },
                    ].map((item) => (
                      <div key={item.label} className="text-center p-3 bg-gray-50 rounded-xl">
                        <div className="text-lg font-bold text-secondary">{item.value}</div>
                        <div className="text-xs text-gray-500">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Trends */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card title={t("adminDashboard.ceo.weekTitle")}>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-gray-500">{t("adminDashboard.ceo.bookings")}:</span><span className="font-bold">{ceo.trends.weekBookings}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-500">{t("adminDashboard.ceo.platformRevenue")}:</span><span className="font-bold text-green-600">{money(ceo.trends.weekRevenue)}</span></div>
                    </div>
                  </Card>
                  <Card title={t("adminDashboard.ceo.monthTitle")}>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-gray-500">{t("adminDashboard.ceo.bookings")}:</span><span className="font-bold">{ceo.trends.monthBookings}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-500">{t("adminDashboard.ceo.platformRevenue")}:</span><span className="font-bold text-green-600">{money(ceo.trends.monthRevenue)}</span></div>
                    </div>
                  </Card>
                </div>

                {/* Bookings by day */}
                {ceo.bookingsByDay.length > 0 && (
                  <Card title={t("adminDashboard.ceo.bookingsByDay")}>
                    <MiniBarChart
                      items={ceo.bookingsByDay.slice().reverse().map(d => ({ label: d.date.slice(5), value: d.count, color: "bg-primary/80 hover:bg-primary" }))}
                      maxVal={Math.max(...ceo.bookingsByDay.map(d => d.count), 1)}
                    />
                  </Card>
                )}
              </>
            )}

            {/* ══════════ USER ANALYTICS ══════════ */}
            {activeTab === "users" && usr && (
              <>
                <Section title={t("adminDashboard.users.sectionTitle")} icon="">
                  <div className="grid grid-cols-3 gap-4">
                    <KpiCard icon="📱" label={t("adminDashboard.users.dau")} value={String(usr.dau)} color="bg-blue-50 text-blue-600" />
                    <KpiCard icon="📅" label={t("adminDashboard.users.wau")} value={String(usr.wau)} color="bg-purple-50 text-purple-600" />
                    <KpiCard icon="📊" label={t("adminDashboard.users.mau")} value={String(usr.mau)} color="bg-primary/10 text-primary" />
                  </div>
                </Section>

                <Card title={t("adminDashboard.users.byRoles")}>
                  <BarChart
                    data={usr.byRole.map(r => ({ label: r.role, value: r.count }))}
                    maxVal={Math.max(...usr.byRole.map(r => r.count), 1)}
                    colorClass="bg-blue-500"
                  />
                </Card>

                {usr.newByDay.length > 0 && (
                  <Card title={t("adminDashboard.users.newByDay")}>
                    <MiniBarChart
                      items={usr.newByDay.slice().reverse().map(d => ({ label: d.date.slice(5), value: d.count, color: "bg-green-500 hover:bg-green-600" }))}
                      maxVal={Math.max(...usr.newByDay.map(d => d.count), 1)}
                    />
                  </Card>
                )}

                <Card title={t("adminDashboard.users.repeatTitle")}>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: t("adminDashboard.users.once"), value: usr.repeatPurchases.once, color: "bg-blue-500" },
                      { label: t("adminDashboard.users.twice"), value: usr.repeatPurchases.twice, color: "bg-primary" },
                      { label: t("adminDashboard.users.threePlus"), value: usr.repeatPurchases.threePlus, color: "bg-green-500" },
                    ].map(r => (
                      <div key={r.label} className="text-center p-4 bg-gray-50 rounded-xl">
                        <div className="text-2xl font-bold text-secondary">{r.value}%</div>
                        <div className="text-xs text-gray-500 mt-1">{r.label}</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div className={`${r.color} rounded-full h-2`} style={{ width: `${r.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}

            {/* ══════════ FUNNEL ══════════ */}
            {activeTab === "funnel" && fnl && (
              <Section title={t("adminDashboard.funnel.sectionTitle")} icon="">
                <Card>
                  <div className="space-y-3">
                    {fnl.steps.map((s, i) => {
                      const maxCount = Math.max(...fnl.steps.map(x => x.count), 1);
                      const w = maxCount > 0 ? Math.round((s.count / maxCount) * 100) : 0;
                      const convRate = i > 0 && fnl.steps[i - 1].count > 0 ? Math.round((s.count / fnl.steps[i - 1].count) * 100) : 100;
                      return (
                        <div key={i} className="flex items-center gap-4">
                          <span className="text-sm text-gray-600 w-32 shrink-0 font-medium">{s.step}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden relative">
                            <div className="bg-gradient-to-r from-primary to-primary/80 h-full rounded-full transition-all duration-700 flex items-center justify-end pr-3" style={{ width: `${w}%` }}>
                              {w > 20 && <span className="text-xs font-bold text-white">{s.count}</span>}
                            </div>
                          </div>
                          <div className="text-right w-20 shrink-0">
                            <span className="text-lg font-bold text-secondary">{s.count}</span>
                            {s.rate !== undefined && <div className="text-[10px] text-gray-400">{s.rate}%</div>}
                            {s.rate === undefined && i > 0 && <div className="text-[10px] text-gray-400">{convRate}% conv</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
                {fnl.steps.length > 0 && fnl.steps[0].count > 0 && (
                  <Card title={t("adminDashboard.funnel.conversionByStep")}>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {fnl.steps.map((s, i) => {
                        const overallRate = pct(s.count, fnl.steps[0].count);
                        return (
                          <div key={i} className="text-center p-3 bg-gray-50 rounded-xl">
                            <div className="text-xl font-bold text-primary">{overallRate}%</div>
                            <div className="text-xs text-gray-500 mt-1">{s.step}</div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}
              </Section>
            )}

            {/* ══════════ SEARCH ══════════ */}
            {activeTab === "search" && sch && (
              <>
                <Section title={t("adminDashboard.search.sectionTitle")} icon="">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card title={t("adminDashboard.search.topQueries")}>
                      {sch.topQueries.length > 0 ? (
                        <div className="space-y-2">
                          {sch.topQueries.map((q, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                              <span className="text-sm font-bold text-gray-400 w-6 text-center">{i + 1}</span>
                              <span className="flex-1 text-sm font-medium text-secondary truncate">{q.query}</span>
                              <span className="text-sm font-bold text-primary">{q.count}</span>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-gray-400 text-sm text-center py-8">{t("adminDashboard.search.noSearchData")}</p>}
                    </Card>
                    <Card title={t("adminDashboard.search.emptyQueries")}>
                      {sch.emptySearches.length > 0 ? (
                        <div className="space-y-2">
                          {sch.emptySearches.map((q, i) => (
                            <div key={i} className="flex items-center gap-3 p-2 bg-red-50 rounded-lg">
                              <span className="text-sm">❌</span>
                              <span className="flex-1 text-sm font-medium text-red-700 truncate">{q.query}</span>
                              <span className="text-sm font-bold text-red-600">{q.count}×</span>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-gray-400 text-sm text-center py-8">{t("adminDashboard.search.allQueriesOk")}</p>}
                    </Card>
                  </div>
                </Section>
                {sch.byDay.length > 0 && (
                  <Card title={t("adminDashboard.search.queriesByDay")}>
                    <MiniBarChart
                      items={sch.byDay.slice().reverse().map(d => ({ label: d.date.slice(5), value: d.count, color: "bg-indigo-500 hover:bg-indigo-600" }))}
                      maxVal={Math.max(...sch.byDay.map(d => d.count), 1)}
                    />
                  </Card>
                )}
              </>
            )}

            {/* ══════════ SERVICES ══════════ */}
            {activeTab === "services" && svc && (
              <>
                <Section title={t("adminDashboard.services.sectionTitle")} icon="">
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {svc.map(s => (
                      <div key={s.type} className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="text-sm font-medium text-gray-700 mb-2">{t(`adminDashboard.typeLabels.${s.type}`) || s.type}</div>
                        <div className="space-y-1 text-xs text-gray-500">
                          <div className="flex justify-between"><span>{t("adminDashboard.services.count")}</span><span className="font-bold text-secondary">{s.count}</span></div>
                          <div className="flex justify-between"><span>{t("adminDashboard.services.avgPrice")}</span><span className="font-bold text-secondary">{money(s.avgPrice)}</span></div>
                          <div className="flex justify-between"><span>{t("adminDashboard.services.totalBookings")}</span><span className="font-bold text-secondary">{s.totalBookings}</span></div>
                          <div className="flex justify-between"><span>{t("adminDashboard.services.totalIncome")}</span><span className="font-bold text-green-600">{money(s.revenue)}</span></div>
                          <div className="flex justify-between"><span>{t("adminDashboard.services.conversionRate")}</span><span className="font-bold text-primary">{s.conversion}%</span></div>
                          <div className="flex justify-between"><span>{t("adminDashboard.services.avgRating")}</span><span className="font-bold text-amber-500">⭐ {s.avgRating}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>

                <Card title={t("adminDashboard.services.revenueByType")}>
                  <BarChart
                    data={svc.map(s => ({ label: t(`adminDashboard.typeLabels.${s.type}`) || s.type, value: s.revenue }))}
                    maxVal={Math.max(...svc.map(s => s.revenue), 1)}
                    colorClass="bg-green-500"
                  />
                </Card>

                <Card title={t("adminDashboard.services.topViewed")}>
                  {svc.flatMap(s => s.topViewed).sort((a, b) => b.views - a.views).slice(0, 10).length > 0 ? (
                    <div className="space-y-2">
                      {svc.flatMap(s => s.topViewed.map(tv => ({ ...tv, type: s.type }))).sort((a, b) => b.views - a.views).slice(0, 10).map((sv, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                          <span className="text-sm font-bold text-gray-400 w-6 text-center">{i + 1}</span>
                          <span className="text-xs text-gray-400 shrink-0">{t(`adminDashboard.typeLabels.${sv.type}`) || sv.type}</span>
                          <a href={`/services/${sv.id}`} className="flex-1 text-sm font-medium text-secondary hover:text-primary truncate" target="_blank" rel="noopener noreferrer">{sv.title}</a>
                          <span className="text-sm font-bold text-primary">{sv.views} 👁</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-gray-400 text-sm text-center py-8">{t("adminDashboard.services.noViewsData")}</p>}
                </Card>
              </>
            )}

            {/* ══════════ PARTNERS ══════════ */}
            {activeTab === "partners" && prt && (
              <>
                <Section title={t("adminDashboard.partners.sectionTitle")} icon="">
                  <KpiCard icon="🤝" label={t("adminDashboard.partners.totalPartners")} value={String(prt.total)} color="bg-primary/10 text-primary" />
                </Section>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">                    {[
                    { title: t("adminDashboard.partners.topRevenue"), data: prt.topByRevenue, render: (p: typeof prt.topByRevenue[0]) => money(p.revenue) },
                    { title: t("adminDashboard.partners.topBookings"), data: prt.topByBookings, render: (p: typeof prt.topByBookings[0]) => String(p.completedBookings) },
                    { title: t("adminDashboard.partners.topRating"), data: prt.topByRating, render: (p: typeof prt.topByRating[0]) => "⭐ " + p.avgRating },
                  ].map(sec => (
                    <Card key={sec.title} title={sec.title}>
                      {sec.data.length > 0 ? (
                        <div className="space-y-2">
                          {sec.data.map((p, i) => (
                            <div key={p.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                              <span className="text-sm font-bold text-gray-400 w-6 text-center">{i + 1}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-secondary truncate">{p.firstName} {p.lastName}</div>
                                <div className="text-xs text-gray-400">{p.companyName || "—"}</div>
                              </div>
                              <span className="text-sm font-bold text-primary shrink-0">{sec.render(p)}</span>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-gray-400 text-sm text-center py-8">{t("adminDashboard.technical.noData")}</p>}
                    </Card>
                  ))}
                </div>
              </>
            )}

            {/* ══════════ FINANCE ══════════ */}
            {activeTab === "finance" && fin && (
              <>
                <Section title={t("adminDashboard.finance.sectionTitle")} icon="">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard icon="💰" label={t("adminDashboard.finance.gmv")} value={money(fin.gmv)} color="bg-green-50 text-green-600" />
                    <KpiCard icon="🏦" label={t("adminDashboard.finance.platformRevenue")} value={money(fin.platformRevenue)} color="bg-primary/10 text-primary" />
                    <KpiCard icon="↩️" label={t("adminDashboard.finance.refunds")} value={money(fin.refunds)} color="bg-red-50 text-red-600" />
                    <KpiCard icon="⏳" label={t("adminDashboard.finance.pendingPayments")} value={String(fin.pendingPayments)} color="bg-amber-50 text-amber-600" />
                  </div>
                </Section>

                <Card title={t("adminDashboard.finance.revenueByType")}>
                  {fin.revenueByType.length > 0 ? (
                    <BarChart
                      data={fin.revenueByType.map(r => ({ label: t(`adminDashboard.typeLabels.${r.type}`) || r.type, value: r.revenue }))}
                      maxVal={Math.max(...fin.revenueByType.map(r => r.revenue), 1)}
                      colorClass="bg-green-500"
                    />
                  ) : <p className="text-gray-400 text-sm text-center py-8">{t("adminDashboard.finance.noCompletedOrders")}</p>}
                </Card>

                {fin.revenueByType.length > 0 && (
                  <Card title={t("adminDashboard.finance.detailsByType")}>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-3">{t("adminDashboard.finance.tableType")}</th>
                            <th className="text-right text-xs font-semibold text-gray-500 uppercase pb-3">{t("adminDashboard.finance.tableIncome")}</th>
                            <th className="text-right text-xs font-semibold text-gray-500 uppercase pb-3">{t("adminDashboard.finance.tableCommission")}</th>
                            <th className="text-right text-xs font-semibold text-gray-500 uppercase pb-3">{t("adminDashboard.finance.tableOrders")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {fin.revenueByType.map(r => (
                            <tr key={r.type} className="hover:bg-gray-50">
                              <td className="py-3 text-sm font-medium">{t(`adminDashboard.typeLabels.${r.type}`) || r.type}</td>
                              <td className="py-3 text-sm text-right font-bold text-green-600">{money(r.revenue)}</td>
                              <td className="py-3 text-sm text-right text-primary">{money(r.fees)}</td>
                              <td className="py-3 text-sm text-right">{r.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}

                {fin.revenueByDay.length > 0 && (
                  <Card title={t("adminDashboard.finance.revenueByDay")}>
                    <MiniBarChart
                      items={fin.revenueByDay.slice().reverse().map(d => ({ label: d.date.slice(5), value: d.revenue, color: "bg-green-500 hover:bg-green-600" }))}
                      maxVal={Math.max(...fin.revenueByDay.map(d => d.revenue), 1)}
                    />
                  </Card>
                )}
              </>
            )}

            {/* ══════════ TECHNICAL ══════════ */}
            {activeTab === "technical" && tech && (
              <>
                <Section title={t("adminDashboard.technical.sectionTitle")} icon="">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <KpiCard icon="👁" label={t("adminDashboard.technical.totalViews")} value={fmt(tech.totalViews)} color="bg-blue-50 text-blue-600" />
                    <KpiCard icon="📅" label={t("adminDashboard.technical.todayViews")} value={fmt(tech.todayViews)} color="bg-green-50 text-green-600" />
                    <KpiCard icon="⏱" label={t("adminDashboard.technical.avgPageDuration")} value={tech.avgDuration + "с"} color="bg-primary/10 text-primary" />
                  </div>
                </Section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card title={t("adminDashboard.technical.devices")}>
                    {tech.devices.length > 0 ? (
                      <BarChart
                        data={tech.devices.map(d => ({ label: d.device, value: d.count }))}
                        maxVal={Math.max(...tech.devices.map(d => d.count), 1)}
                        colorClass="bg-indigo-500"
                      />
                    ) : <p className="text-gray-400 text-sm text-center py-8">{t("adminDashboard.technical.noData")}</p>}
                  </Card>
                  <Card title={t("adminDashboard.technical.topPages")}>
                    {tech.topPages.length > 0 ? (
                      <BarChart
                        data={tech.topPages.slice(0, 8).map(p => ({ label: p.path, value: p.count }))}
                        maxVal={Math.max(...tech.topPages.slice(0, 8).map(p => p.count), 1)}
                        colorClass="bg-purple-500"
                      />
                    ) : <p className="text-gray-400 text-sm text-center py-8">{t("adminDashboard.technical.noData")}</p>}
                  </Card>
                </div>
              </>
            )}
            {/* ══════════ MARKETING ══════════ */}
            {activeTab === "marketing" && mkt && (
              <>
                <Section title={t("adminDashboard.marketing.sectionTitle")} icon="">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard icon="💰" label={t("adminDashboard.marketing.expenses")} value={money(mkt.totals.cost)} color="bg-red-50 text-red-600" />
                    <KpiCard icon="💵" label={t("adminDashboard.marketing.adRevenue")} value={money(mkt.totals.revenue)} color="bg-green-50 text-green-600" />
                    <KpiCard icon="📈" label="ROI" value={mkt.totals.roi + "%"} color={mkt.totals.roi >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"} />
                    <KpiCard icon="🎯" label={t("adminDashboard.marketing.cac")} value={money(mkt.totals.cac)} color="bg-primary/10 text-primary" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard icon="👁" label={t("adminDashboard.marketing.visits")} value={fmt(mkt.totals.totalVisits)} color="bg-blue-50 text-blue-600" />
                    <KpiCard icon="🛒" label={t("adminDashboard.marketing.bookings")} value={String(mkt.totals.totalBookings)} color="bg-purple-50 text-purple-600" />
                    <KpiCard icon="🔄" label={t("adminDashboard.marketing.conversion")} value={mkt.totals.convRate + "%"} color="bg-amber-50 text-amber-600" />
                    <KpiCard icon="💵" label={t("adminDashboard.marketing.profit")} value={money(mkt.totals.profit)} color={mkt.totals.profit >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"} />
                  </div>
                </Section>

                <Card title={t("adminDashboard.marketing.revenueByChannel")}>
                  <BarChart
                    data={mkt.channels.map(c => ({ label: c.channel, value: c.revenue }))}
                    maxVal={Math.max(...mkt.channels.map(c => c.revenue), 1)}
                    colorClass="bg-green-500"
                  />
                </Card>

                <Card title={t("adminDashboard.marketing.channelsTitle")}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-3">{t("adminDashboard.marketing.tableChannel")}</th>
                          <th className="text-right text-xs font-semibold text-gray-500 uppercase pb-3">{t("adminDashboard.marketing.tableVisits")}</th>
                          <th className="text-right text-xs font-semibold text-gray-500 uppercase pb-3">Заказы</th>
                          <th className="text-right text-xs font-semibold text-gray-500 uppercase pb-3">{t("adminDashboard.marketing.tableIncome")}</th>
                          <th className="text-right text-xs font-semibold text-gray-500 uppercase pb-3">{t("adminDashboard.marketing.tableExpenses")}</th>
                          <th className="text-right text-xs font-semibold text-gray-500 uppercase pb-3">ROI</th>
                          <th className="text-right text-xs font-semibold text-gray-500 uppercase pb-3">CAC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {mkt.channels.map(c => (
                          <tr key={c.channel} className="hover:bg-gray-50">
                            <td className="py-3 text-sm font-medium capitalize">{c.channel}</td>
                            <td className="py-3 text-sm text-right">{c.visits}</td>
                            <td className="py-3 text-sm text-right font-bold text-secondary">{c.bookings}</td>
                            <td className="py-3 text-sm text-right font-bold text-green-600">{money(c.revenue)}</td>
                            <td className="py-3 text-sm text-right text-red-600">{money(c.cost)}</td>
                            <td className="py-3 text-sm text-right"><span className={`font-bold ${c.roi >= 0 ? "text-green-600" : "text-red-600"}`}>{c.roi}%</span></td>
                            <td className="py-3 text-sm text-right">{money(c.cac)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                {mkt.campaigns.length > 0 && (
                  <Card title={t("adminDashboard.marketing.campaigns")}>
                    <div className="space-y-2">
                      {mkt.campaigns.slice(0, 10).map((c, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                          <span className="text-sm font-bold text-gray-400 w-6 text-center">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-secondary truncate">{c.name}</div>
                            <div className="text-xs text-gray-400">{c.channel} • {c.visits} {t("adminDashboard.marketing.visitsShort")} • {c.bookings} {t("adminDashboard.marketing.ordersShort")}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-green-600">{money(c.revenue)}</div>
                            <div className={`text-xs ${c.roi >= 0 ? "text-green-500" : "text-red-500"}`}>ROI {c.roi}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card title={t("adminDashboard.marketing.utmSources")}>
                    {mkt.utmSources.length > 0 ? (
                      <BarChart
                        data={mkt.utmSources.map(u => ({ label: u.source, value: u.revenue }))}
                        maxVal={Math.max(...mkt.utmSources.map(u => u.revenue), 1)}
                        colorClass="bg-indigo-500"
                      />
                    ) : <p className="text-gray-400 text-sm text-center py-8">{t("adminDashboard.technical.noData")}</p>}
                  </Card>
                  <Card title={t("adminDashboard.marketing.adRevenueByDay")}>
                    {mkt.eventsByDay.length > 0 ? (
                      <MiniBarChart
                        items={mkt.eventsByDay.slice().reverse().map(d => ({ label: d.date.slice(5), value: Math.round(d.revenue), color: "bg-green-500 hover:bg-green-600" }))}
                        maxVal={Math.max(...mkt.eventsByDay.map(d => d.revenue), 1)}
                      />
                    ) : <p className="text-gray-400 text-sm text-center py-8">{t("adminDashboard.technical.noData")}</p>}
                  </Card>
                </div>
              </>
            )}

            {/* ══════════ MODERATION ══════════ */}
            {activeTab === "moderation" && (
              <>
                <Section title={t("adminDashboard.moderation.sectionTitle")} icon="">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex bg-gray-100 rounded-xl p-1">
                      {["PENDING", "APPROVED", "REJECTED", "ALL"].map((status) => (
                        <button
                          key={status}
                          onClick={() => { setModerationFilter(status); setModerationPage(1); }}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${moderationFilter === status ? "bg-white shadow-sm text-secondary" : "text-gray-500 hover:text-gray-700"}`}
                        >
                          {status === "PENDING" ? t("adminDashboard.moderation.statusPending") : status === "APPROVED" ? t("adminDashboard.moderation.statusApproved") : status === "REJECTED" ? t("adminDashboard.moderation.statusRejected") : t("adminDashboard.moderation.statusAll")}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => fetchModeration(moderationFilter)}                       className="px-4 py-2 bg-primary text-white rounded-xl text-sm hover:bg-primary-dark transition-colors"
                     >
                       🔄 {t("adminDashboard.moderation.refresh")}
                     </button>
                   </div>
                 </Section>

                 {moderationLoading ? (
                  <Card>
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">{t("adminDashboard.moderation.loading")}</p>
                    </div>
                  </Card>
                ) : moderationItems.length === 0 ? (
                  <Card>
                    <div className="text-center py-8">
                      <div className="text-4xl mb-3">✅</div>
                      <p className="text-gray-500">{t("adminDashboard.moderation.empty")}</p>
                    </div>
                  </Card>
                ) : (
                  <Card>
                    <div className="space-y-3">
                      {moderationItems.map((service) => (
                        <div key={service.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                                  {t(`adminDashboard.typeLabels.${service.type}`) || service.type}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  service.moderationStatus === "PENDING" ? "bg-amber-100 text-amber-700" :
                                  service.moderationStatus === "APPROVED" ? "bg-green-100 text-green-700" :
                                  "bg-red-100 text-red-700"
                                }`}>
                                  {service.moderationStatus === "PENDING" ? t("adminDashboard.moderation.statusPendingShort") : service.moderationStatus === "APPROVED" ? t("adminDashboard.moderation.statusApprovedShort") : t("adminDashboard.moderation.statusRejectedShort")}
                                </span>
                              </div>
                              <h4 className="font-bold text-secondary truncate">{service.title}</h4>
                              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                <span>📍 {service.city}, {service.country}</span>
                                <span>💰 {money(service.price)}</span>
                                <span>⭐ {service.rating}</span>
                                <span>👤 {service.provider.firstName} {service.provider.lastName}</span>
                              </div>
                              {service.moderationReason && (
                                <div className="mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                                  {t("adminDashboard.moderation.reasonPrefix")} {service.moderationReason}
                                </div>
                              )}
                            </div>

                            {service.moderationStatus === "PENDING" && (
                              <div className="flex items-center gap-2 shrink-0">
                                {rejectingId === service.id ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={rejectReason}
                                      onChange={(e) => setRejectReason(e.target.value)}
                                      placeholder={t("adminDashboard.moderation.rejectPlaceholder")}
                                      className="w-48 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-red-400 focus:ring-0 outline-none"
                                    />
                                    <button
                                      onClick={() => handleModeration(service.id, "reject", rejectReason)}
                                      disabled={!rejectReason.trim() || actionLoading === service.id}
                                      className="px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                                    >
                                      {actionLoading === service.id ? "..." : t("adminDashboard.moderation.rejectConfirm")}
                                    </button>
                                    <button
                                      onClick={() => { setRejectingId(null); setRejectReason(""); }}
                                      className="px-3 py-2 text-gray-500 text-sm hover:text-gray-700"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleModeration(service.id, "approve")}
                                      disabled={actionLoading === service.id}
                                      className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                                    >
                                      {actionLoading === service.id ? "..." : t("adminDashboard.moderation.approve")}
                                    </button>
                                    <button
                                      onClick={() => setRejectingId(service.id)}
                                      disabled={actionLoading === service.id}
                                      className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                                    >
                                      {t("adminDashboard.moderation.reject")}
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>                          ))}
                    </div>

                    {/* Moderation Pagination */}
                    {moderationTotalPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className="text-xs text-gray-500">                           {t("common.total")}: {moderationTotal} • {t("common.page")} {moderationPage} {t("common.of")} {moderationTotalPages}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setModerationPage(p => Math.max(1, p - 1))}
                            disabled={moderationPage <= 1}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >                             {t("common.prev")}
                          </button>
                          {Array.from({ length: Math.min(5, moderationTotalPages) }, (_, i) => {
                            const start = Math.max(1, Math.min(moderationPage - 2, moderationTotalPages - 4));
                            const pageNum = start + i;
                            if (pageNum > moderationTotalPages) return null;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setModerationPage(pageNum)}
                                className={`w-8 h-8 text-xs font-medium rounded-lg transition-colors ${
                                  moderationPage === pageNum
                                    ? "bg-primary text-white"
                                    : "text-gray-600 hover:bg-gray-100"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          <button
                            onClick={() => setModerationPage(p => Math.min(moderationTotalPages, p + 1))}
                            disabled={moderationPage >= moderationTotalPages}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Далее →
                          </button>
                        </div>
                      </div>
                    )}
                  </Card>
                )}
              </>
            )}

            {/* ══════════ AUDIT LOG ══════════ */}
            {activeTab === "audit" && (
              <>
                <Section title={t("adminDashboard.audit.sectionTitle")} icon="">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <select
                      value={auditActionFilter}
                      onChange={(e) => { setAuditActionFilter(e.target.value); setAuditPage(1); }}
                      className="h-10 px-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-0 outline-none text-sm"
                    >
                      <option value="ALL">{t("adminDashboard.audit.actionAll")}</option>
                      <option value="approve_service">{t("adminDashboard.audit.actionApproveService")}</option>
                      <option value="reject_service">{t("adminDashboard.audit.actionRejectService")}</option>
                      <option value="ban_user">{t("adminDashboard.audit.actionBanUser")}</option>
                      <option value="unban_user">{t("adminDashboard.audit.actionUnbanUser")}</option>
                      <option value="change_role">{t("adminDashboard.audit.actionChangeRole")}</option>
                    </select>
                    <select
                      value={auditTargetFilter}
                      onChange={(e) => { setAuditTargetFilter(e.target.value); setAuditPage(1); }}
                      className="h-10 px-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-0 outline-none text-sm"
                    >
                      <option value="ALL">Все объекты</option>
                      <option value="service">Услуги</option>
                      <option value="user">Пользователи</option>
                      <option value="booking">Бронирования</option>
                    </select>
                    <button
                      onClick={() => fetchAuditLogs()}                       className="h-10 px-4 bg-primary text-white rounded-xl text-sm hover:bg-primary-dark transition-colors"
                     >
                       🔄 {t("adminDashboard.audit.refresh")}
                     </button>
                   </div>
                 </Section>

                 {auditLoading ? (
                  <Card>
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Загрузка...</p>
                    </div>
                  </Card>
                ) : auditLogs.length === 0 ? (
                  <Card>
                    <div className="text-center py-8">
                      <div className="text-4xl mb-3">📋</div>
                      <p className="text-gray-500">{t("adminDashboard.audit.empty")}</p>
                    </div>
                  </Card>
                ) : (
                  <Card>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-3">Дата</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-3">Действие</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-3">Админ</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-3">Объект</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-3">Детали</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                              <td className="py-3 text-xs text-gray-500 whitespace-nowrap">
                                {new Date(log.createdAt).toLocaleString("ru-RU")}
                              </td>
                              <td className="py-3">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  log.action.includes("approve") ? "bg-green-100 text-green-700" :
                                  log.action.includes("reject") ? "bg-red-100 text-red-700" :
                                  log.action.includes("ban") ? "bg-orange-100 text-orange-700" :
                                  log.action.includes("unban") ? "bg-blue-100 text-blue-700" :
                                  "bg-gray-100 text-gray-700"
                                }`}>{log.action === "approve_service" ? t("adminDashboard.audit.labelApprove") :
                                     log.action === "reject_service" ? t("adminDashboard.audit.labelReject") :
                                     log.action === "ban_user" ? t("adminDashboard.audit.labelBan") :
                                     log.action === "unban_user" ? t("adminDashboard.audit.labelUnban") :
                                     log.action === "change_role" ? t("adminDashboard.audit.labelChangeRole") :
                                    log.action}
                                </span>
                              </td>
                              <td className="py-3">
                                <div className="text-sm text-secondary">{log.actorEmail}</div>
                                <div className="text-[10px] text-gray-400">{log.actorRole}</div>
                              </td>
                              <td className="py-3">
                                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                                  {log.targetType}: {log.targetId.slice(0, 8)}...
                                </span>
                              </td>
                              <td className="py-3">
                                {log.reason && (
                                  <div className="text-xs text-red-600 mb-1">Причина: {log.reason}</div>
                                )}
                                {log.metadata && (
                                  <div className="text-[10px] text-gray-400">
                                    {log.metadata.serviceTitle && <span>Услуга: {log.metadata.serviceTitle}</span>}                                     {log.metadata.userName && <span>{t("adminDashboard.usersMgmt.tableUser")}: {log.metadata.userName}</span>}
                                    {log.metadata.newStatus && <span> → {log.metadata.newStatus}</span>}
                                    {log.metadata.newValue !== undefined && <span> → {String(log.metadata.newValue)}</span>}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Audit Pagination */}
                    {auditTotalPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className="text-xs text-gray-500">                           {t("common.total")}: {auditTotal} • {t("common.page")} {auditPage} {t("common.of")} {auditTotalPages}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                            disabled={auditPage <= 1}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >                             {t("common.prev")}
                          </button>
                          {Array.from({ length: Math.min(5, auditTotalPages) }, (_, i) => {
                            const start = Math.max(1, Math.min(auditPage - 2, auditTotalPages - 4));
                            const pageNum = start + i;
                            if (pageNum > auditTotalPages) return null;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setAuditPage(pageNum)}
                                className={`w-8 h-8 text-xs font-medium rounded-lg transition-colors ${
                                  auditPage === pageNum
                                    ? "bg-primary text-white"
                                    : "text-gray-600 hover:bg-gray-100"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          <button
                            onClick={() => setAuditPage(p => Math.min(auditTotalPages, p + 1))}
                            disabled={auditPage >= auditTotalPages}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Далее →
                          </button>
                        </div>
                      </div>
                    )}
                  </Card>
                )}
              </>
            )}

            {/* ══════════ USERS MANAGEMENT ══════════ */}
            {activeTab === "users_mgmt" && (
              <>
                <Section title={t("adminDashboard.usersMgmt.sectionTitle")} icon="">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="relative flex-1 min-w-[200px]">
                      <input
                        type="text"
                        value={usersSearch}
                        onChange={(e) => setUsersSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && fetchUsers(1)}
                        placeholder={t("adminDashboard.usersMgmt.searchPlaceholder")}
                        className="w-full h-10 pl-4 pr-4 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-0 outline-none text-sm"
                      />
                    </div>
                    <select
                      value={usersRoleFilter}                        onChange={(e) => { setUsersRoleFilter(e.target.value); setUsersPage(1); }}
                      className="h-10 px-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-0 outline-none text-sm"
                    >
                      <option value="ALL">{t("adminDashboard.usersMgmt.roleAll")}</option>
                      <option value="BUYER">Покупатели</option>
                      <option value="PARTNER">Партнёры</option>
                      <option value="MODERATOR">Модераторы</option>
                      <option value="ADMIN">Админы</option>
                    </select>
                    <select
                      value={usersStatusFilter}                        onChange={(e) => { setUsersStatusFilter(e.target.value); setUsersPage(1); }}
                      className="h-10 px-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-0 outline-none text-sm"
                    >
                      <option value="ALL">{t("adminDashboard.usersMgmt.statusAll")}</option>
                      <option value="active">Активные</option>                       <option value="banned">{t("adminDashboard.usersMgmt.banned")}</option>
                    </select>
                    <button
                      onClick={() => fetchUsers()}                       className="h-10 px-4 bg-primary text-white rounded-xl text-sm hover:bg-primary-dark transition-colors"
                     >
                       🔄 {t("adminDashboard.usersMgmt.refresh")}
                     </button>
                   </div>
                 </Section>

                 {usersLoading ? (
                  <Card>
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Загрузка...</p>
                    </div>
                  </Card>
                ) : usersList.length === 0 ? (
                  <Card>
                    <div className="text-center py-8">
                      <div className="text-4xl mb-3">👤</div>
                      <p className="text-gray-500">{t("adminDashboard.usersMgmt.empty")}</p>
                    </div>
                  </Card>
                ) : (
                  <Card>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100">                             <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-3">{t("adminDashboard.usersMgmt.tableUser")}</th>
                             <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-3">{t("adminDashboard.usersMgmt.tableRole")}</th>
                             <th className="text-center text-xs font-semibold text-gray-500 uppercase pb-3">{t("adminDashboard.usersMgmt.tableStatus")}</th>
                             <th className="text-right text-xs font-semibold text-gray-500 uppercase pb-3">{t("adminDashboard.usersMgmt.tableOrders")}</th>
                            <th className="text-right text-xs font-semibold text-gray-500 uppercase pb-3">Рецензии</th>
                            <th className="text-right text-xs font-semibold text-gray-500 uppercase pb-3">Баллы</th>                             <th className="text-center text-xs font-semibold text-gray-500 uppercase pb-3">{t("adminDashboard.usersMgmt.tableActions")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {usersList.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                              <td className="py-3">
                                <div>
                                  <div className="text-sm font-medium text-secondary">{user.firstName} {user.lastName}</div>
                                  <div className="text-xs text-gray-400">{user.email}</div>
                                  <div className="text-[10px] text-gray-400 mt-0.5">{new Date(user.createdAt).toLocaleDateString("ru-RU")}</div>
                                </div>
                              </td>
                              <td className="py-3">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  user.role === "ADMIN" ? "bg-red-100 text-red-700" :
                                  user.role === "MODERATOR" ? "bg-purple-100 text-purple-700" :
                                  user.role === "PARTNER" ? "bg-blue-100 text-blue-700" :
                                  "bg-gray-100 text-gray-700"
                                }`}>
                                  {user.role === "ADMIN" ? "Админ" : user.role === "MODERATOR" ? "Модератор" : user.role === "PARTNER" ? "Партнёр" : "Покупатель"}
                                </span>
                              </td>
                              <td className="py-3 text-center">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                }`}>
                                  {user.isActive ? t("adminDashboard.usersMgmt.active") : t("adminDashboard.usersMgmt.banned")}
                                </span>
                              </td>
                              <td className="py-3 text-right text-sm font-medium text-secondary">{user.bookingsCount}</td>
                              <td className="py-3 text-right text-sm font-medium text-secondary">{user.reviewsCount}</td>
                              <td className="py-3 text-right text-sm font-medium text-amber-600">{user.bonusPoints}</td>
                              <td className="py-3">
                                <div className="flex items-center justify-center gap-1">
                                  {user.isActive ? (
                                    <button
                                      onClick={() => { setBanModalUser(user); setBanReason(""); }}
                                      disabled={userActionLoading === user.id || user.role === "ADMIN"}
                                      className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                      title={t("adminDashboard.usersMgmt.ban")}
                                    >
                                      {t("adminDashboard.usersMgmt.ban")}
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleUserAction(user.id, "unban")}
                                      disabled={userActionLoading === user.id}
                                      className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"                                      title={t("adminDashboard.usersMgmt.unban")}
                                     >
                                       {t("adminDashboard.usersMgmt.unban")}
                                     </button>
                                  )}
                                  <select
                                    value={user.role}
                                    onChange={(e) => {
                                      setRoleModalUser(user);
                                      setRoleModalNewRole(e.target.value);
                                    }}
                                    disabled={userActionLoading === user.id}
                                    className="text-xs px-1 py-1 border border-gray-200 rounded-lg focus:border-primary focus:ring-0 outline-none disabled:opacity-50"
                                  >
                                    <option value="BUYER">Покупатель</option>
                                    <option value="PARTNER">Партнёр</option>
                                    <option value="MODERATOR">Модератор</option>
                                    <option value="ADMIN">Админ</option>
                                  </select>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Users Pagination */}
                    {usersTotalPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className="text-xs text-gray-500">
                          {t("common.total")}: {usersTotal} • {t("common.page")} {usersPage} {t("common.of")} {usersTotalPages}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setUsersPage(p => Math.max(1, p - 1)); }}
                            disabled={usersPage <= 1}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >                             {t("common.prev")}
                          </button>
                          {Array.from({ length: Math.min(5, usersTotalPages) }, (_, i) => {
                            const start = Math.max(1, Math.min(usersPage - 2, usersTotalPages - 4));
                            const pageNum = start + i;
                            if (pageNum > usersTotalPages) return null;
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setUsersPage(pageNum)}
                                className={`w-8 h-8 text-xs font-medium rounded-lg transition-colors ${
                                  usersPage === pageNum
                                    ? "bg-primary text-white"
                                    : "text-gray-600 hover:bg-gray-100"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          <button
                            onClick={() => { setUsersPage(p => Math.min(usersTotalPages, p + 1)); }}
                            disabled={usersPage >= usersTotalPages}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Далее →
                          </button>
                        </div>
                      </div>
                    )}
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Ban Modal ═══ */}
      {banModalUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={() => setBanModalUser(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-secondary mb-2">{t("adminDashboard.usersMgmt.banModalTitle")}</h3>
            <p className="text-sm text-gray-500 mb-4">
              {banModalUser.firstName} {banModalUser.lastName} ({banModalUser.email})
            </p>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t("adminDashboard.usersMgmt.banReasonPlaceholder")}</label>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Укажите причину бана..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-red-400 focus:ring-0 outline-none resize-none h-24"
              autoFocus
            />
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => {
                  if (banReason.trim()) {
                    handleUserAction(banModalUser.id, "ban", banReason);
                    setBanModalUser(null);
                  }
                }}
                disabled={!banReason.trim() || userActionLoading === banModalUser.id}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {userActionLoading === banModalUser.id ? "..." : t("adminDashboard.usersMgmt.banConfirm")}
              </button>
              <button
                onClick={() => setBanModalUser(null)}
                className="px-4 py-2.5 text-gray-500 text-sm font-medium hover:text-gray-700"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Role Change Modal ═══ */}
      {roleModalUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={() => setRoleModalUser(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-secondary mb-2">{t("adminDashboard.usersMgmt.roleModalTitle")}</h3>
            <p className="text-sm text-gray-500 mb-4">
              {roleModalUser.firstName} {roleModalUser.lastName} ({roleModalUser.email})
            </p>
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Текущая роль:</span>
                <span className="font-medium text-secondary">{roleModalUser.role}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-500">Новая роль:</span>
                <span className="font-bold text-primary">{roleModalNewRole}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  handleUserAction(roleModalUser.id, "change_role", undefined, roleModalNewRole);
                  setRoleModalUser(null);
                }}
                disabled={userActionLoading === roleModalUser.id}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {userActionLoading === roleModalUser.id ? "..." : t("adminDashboard.usersMgmt.roleConfirm")}
              </button>
              <button
                onClick={() => setRoleModalUser(null)}
                className="px-4 py-2.5 text-gray-500 text-sm font-medium hover:text-gray-700"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-120px)] bg-gray-50 flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>}>
      <AdminDashboardInner />
    </Suspense>
  );
}
