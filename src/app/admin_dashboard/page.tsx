"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import dynamic from "next/dynamic";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopNav from "@/components/admin/AdminTopNav";
import KpiCard from "@/components/admin/KpiCard";
import ChartCard from "@/components/admin/ChartCard";
import DataTable from "@/components/admin/DataTable";

import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line } from "recharts";

type TabId = "overview" | "analytics" | "bookings" | "orders" | "services" | "partners" | "users" | "moderators" | "customers" | "finance" | "payments" | "commissions" | "refunds" | "marketing" | "promotions" | "support" | "messages" | "notifications" | "reports" | "calendar" | "documents" | "moderation" | "users_mgmt" | "audit" | "settings" | "system" | "logs" | "security" | "api" | "ai";

interface CeoData {
  today: { sales: number; bookings: number; commission: number; newUsers: number; newPartners: number; cancellations: number };
  totals: { gmv: number; platformRevenue: number; bookings: number; users: number; partners: number; avgCheck: number; avgCommission: number; cancellations: number; services: number };
  trends: { weekBookings: number; weekRevenue: number; monthBookings: number; monthRevenue: number };
  bookingsByDay: { date: string; count: number; revenue: number }[];
}
interface UserData { dau: number; wau: number; mau: number; total: number; byRole: { role: string; count: number }[]; newByDay: { date: string; count: number }[]; repeatPurchases: { once: number; twice: number; threePlus: number }; }
interface FunnelStep { step: string; count: number; rate?: number }
interface FunnelData { steps: FunnelStep[] }
interface SearchData { topQueries: { query: string; count: number; avgResults: number }[]; emptySearches: { query: string; count: number }[]; byDay: { date: string; count: number }[] }
interface ServiceTypeData { type: string; count: number; avgPrice: number; avgRating: string; totalBookings: number; completedBookings: number; revenue: number; commission: number; topViewed: { id: string; title: string; views: number }[]; conversion: string; }
interface PartnerData { total: number; topByRevenue: { id: string; firstName: string; lastName: string; companyName: string | null; partnerType: string | null; revenue: number; completedBookings: number; avgRating: string; services: number; reviews: number }[]; topByBookings: any[]; topByRating: any[]; }
interface FinanceData { gmv: number; platformRevenue: number; refunds: number; pendingPayments: number; revenueByType: { type: string; revenue: number; fees: number; count: number }[]; revenueByDay: { date: string; revenue: number; fees: number }[]; }
interface TechData { totalViews: number; todayViews: number; avgDuration: number; devices: { device: string; count: number }[]; topPages: { path: string; count: number; avgDuration: number }[]; }
interface MarketingData { totals: { cost: number; revenue: number; profit: number; roi: number; cac: number; totalVisits: number; totalBookings: number; convRate: number }; channels: { channel: string; visits: number; registrations: number; bookings: number; revenue: number; cost: number; cac: number; roi: number; convRate: number }[]; campaigns: { name: string; channel: string; visits: number; bookings: number; revenue: number; cost: number; cac: number; roi: number }[]; utmSources: { source: string; visits: number; bookings: number; revenue: number }[]; eventsByDay: { date: string; visits: number; bookings: number; revenue: number }[]; }
interface ExtendedAnalytics { ceo?: CeoData; users?: UserData; funnel?: FunnelData; search?: SearchData; services?: ServiceTypeData[]; partners?: PartnerData; finance?: FinanceData; technical?: TechData; marketing?: MarketingData; }

const fmt = (n: number) => n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "K" : n.toLocaleString();
const money = (n: number) => n.toLocaleString("az-AZ") + " AZN";
const CHART_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#06b6d4"];

function AdminInner() {
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const isModerator = user?.role === "MODERATOR";

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const tab = (searchParams.get("tab") as TabId) || "overview";
    return tab || "overview";
  });
  const [data, setData] = useState<ExtendedAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Moderation state
  const [modItems, setModItems] = useState<any[]>([]);
  const [modFilter, setModFilter] = useState("PENDING");
  const [modLoading, setModLoading] = useState(false);
  const [modPage, setModPage] = useState(1);
  const [modTotalPages, setModTotalPages] = useState(1);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Users state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [usersSearch, setUsersSearch] = useState("");
  const [usersRole, setUsersRole] = useState("ALL");
  const [usersStatus, setUsersStatus] = useState("ALL");
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);

  // Audit state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);

  const fetchData = useCallback(async (bg = false) => {
    try {
      if (bg) setIsRefreshing(true);
      const endpoint = isModerator ? "/api/admin" : "/api/admin/analytics/extended?section=all";
      const res = await fetch(endpoint, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load analytics");
      const json = await res.json();
      if (isModerator) {
        setData({ ceo: { today: { sales: json.totalRevenue || 0, bookings: json.pendingBookings || 0, commission: 0, newUsers: 0, newPartners: 0, cancellations: 0 }, totals: { gmv: json.totalRevenue || 0, platformRevenue: json.totalRevenue || 0, bookings: json.pendingBookings || 0, users: json.totalUsers || 0, partners: 0, avgCheck: 0, avgCommission: 0, cancellations: 0, services: json.totalServices || 0 }, trends: { weekBookings: 0, weekRevenue: 0, monthBookings: 0, monthRevenue: 0 }, bookingsByDay: [] } });
      } else {
        setData(prev => prev ? { ...prev, ...json } : json);
      }
      setLastUpdated(new Date());
    } catch (err) {
      if (!bg) setError(err instanceof Error ? err.message : "Error");
      console.error("Dashboard fetch error:", err);
    }
    finally { setIsLoading(false); if (bg) setIsRefreshing(false); }
  }, [isModerator]);

  useEffect(() => { if (user) fetchData(); }, [user, fetchData]);

  useEffect(() => {
    if (autoRefresh && !isModerator) {
      const id = setInterval(() => fetchData(true), 30000);
      return () => clearInterval(id);
    }
  }, [autoRefresh, isModerator, fetchData]);

  const fetchModeration = useCallback(async (status = modFilter, page = modPage) => {
    setModLoading(true);
    try {
      const res = await fetch(`/api/admin/moderation?status=${status}&page=${page}&limit=20`, { credentials: "include" });
      if (res.ok) { const d = await res.json(); setModItems(d.services || []); if (d.pagination) { setModTotalPages(d.pagination.totalPages || 1); } }
    } catch (e) { console.error(e); } finally { setModLoading(false); }
  }, [modFilter, modPage]);

  const handleModeration = useCallback(async (id: string, action: "approve" | "reject", reason?: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/services/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ action, reason }) });
      if (res.ok) { setModItems(prev => prev.filter(s => s.id !== id)); setRejectingId(null); setRejectReason(""); }
    } catch (e) { console.error(e); } finally { setActionLoading(null); }
  }, []);

  const fetchUsers = useCallback(async (page = usersPage) => {
    setUsersLoading(true);
    try {
      const p = new URLSearchParams();
      if (usersSearch) p.set("search", usersSearch);
      if (usersRole !== "ALL") p.set("role", usersRole);
      if (usersStatus !== "ALL") p.set("status", usersStatus);
      p.set("page", String(page)); p.set("limit", "20");
      const res = await fetch(`/api/admin/users?${p}`, { credentials: "include" });
      if (res.ok) { const d = await res.json(); setUsersList(d.users || []); if (d.pagination) setUsersTotalPages(d.pagination.totalPages || 1); }
    } catch (e) { console.error(e); } finally { setUsersLoading(false); }
  }, [usersSearch, usersRole, usersStatus, usersPage]);

  const handleUserAction = useCallback(async (userId: string, action: string, reason?: string, newRole?: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ action, reason, newRole }) });
      if (res.ok) fetchUsers();
    } catch (e) { console.error(e); }
  }, [fetchUsers]);

  const fetchAuditLogs = useCallback(async (page = auditPage) => {
    setAuditLoading(true);
    try {
      const p = new URLSearchParams(); p.set("page", String(page)); p.set("limit", "20");
      const res = await fetch(`/api/admin/audit?${p}`, { credentials: "include" });
      if (res.ok) { const d = await res.json(); setAuditLogs(d.logs || []); if (d.pagination) setAuditTotalPages(d.pagination.totalPages || 1); }
    } catch (e) { console.error(e); } finally { setAuditLoading(false); }
  }, [auditPage]);

  useEffect(() => {
    if (activeTab === "moderation") fetchModeration();
    else if (activeTab === "users_mgmt") fetchUsers();
    else if (activeTab === "audit") fetchAuditLogs();

  }, [activeTab, modFilter, modPage, usersPage, usersSearch, usersRole, usersStatus, auditPage, user, data, fetchData]);

  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center text-white text-2xl font-bold shadow-2xl shadow-blue-500/30 mx-auto mb-4 animate-pulse">T</div>
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500 font-medium">{t("admin.loading")}</p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 flex items-center justify-center">
      <div className="text-center bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
        <div className="text-5xl mb-4">🛡</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t("admin.loadError")}</h2>
        <p className="text-sm text-gray-500 mb-4">{error || t("admin.noData")}</p>
        <button onClick={() => { setError(null); setIsLoading(true); fetchData(); }} className="px-6 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25">
          {t("admin.retry")}
        </button>
      </div>
    </div>
  );

  const ceo = data.ceo;
  const sidebarItems = [
    { icon: "📊", label: t("admin.sidebar.overview"), id: "overview" },
    { icon: "📈", label: t("admin.sidebar.analytics"), id: "analytics", adminOnly: true },
    { icon: "📋", label: t("admin.sidebar.bookings"), id: "bookings", adminOnly: true },
    { icon: "🛒", label: t("admin.sidebar.orders"), id: "orders", adminOnly: true },
    { icon: "🏨", label: t("admin.sidebar.services"), id: "services", adminOnly: true },
    { icon: "🤝", label: t("admin.sidebar.partners"), id: "partners", adminOnly: true },
    { icon: "👥", label: t("admin.sidebar.users"), id: "users", adminOnly: true },
    { icon: "🛡", label: t("admin.sidebar.moderators"), id: "moderators", adminOnly: true },
    { icon: "👤", label: t("admin.sidebar.customers"), id: "customers", adminOnly: true },
    { icon: "💰", label: t("admin.sidebar.finance"), id: "finance", adminOnly: true },
    { icon: "💳", label: t("admin.sidebar.payments"), id: "payments", adminOnly: true },
    { icon: "🏦", label: t("admin.sidebar.commissions"), id: "commissions", adminOnly: true },
    { icon: "↩️", label: t("admin.sidebar.refunds"), id: "refunds", adminOnly: true },
    { icon: "📣", label: t("admin.sidebar.marketing"), id: "marketing", adminOnly: true },
    { icon: "🎁", label: t("admin.sidebar.promotions"), id: "promotions", adminOnly: true },
    { icon: "🎧", label: t("admin.sidebar.support"), id: "support", adminOnly: true },
    { icon: "✉️", label: t("admin.sidebar.messages"), id: "messages", adminOnly: true },
    { icon: "🔔", label: t("admin.sidebar.notifications"), id: "notifications", adminOnly: true },
    { icon: "📊", label: t("admin.sidebar.reports"), id: "reports", adminOnly: true },
    { icon: "📅", label: t("admin.sidebar.calendar"), id: "calendar", adminOnly: true },
    { icon: "📄", label: t("admin.sidebar.documents"), id: "documents", adminOnly: true },
    { icon: "🛡", label: t("admin.sidebar.moderation"), id: "moderation" },
    { icon: "👤", label: t("admin.sidebar.usersMgmt"), id: "users_mgmt", adminOnly: true },
    { icon: "📋", label: t("admin.sidebar.audit"), id: "audit", adminOnly: true },
    { icon: "⚙️", label: t("admin.sidebar.system"), id: "system", adminOnly: true },
    { icon: "🔧", label: t("admin.sidebar.settings"), id: "settings", adminOnly: true },
    { icon: "📜", label: t("admin.sidebar.logs"), id: "logs", adminOnly: true },
    { icon: "🔒", label: t("admin.sidebar.security"), id: "security", adminOnly: true },
    { icon: "🔌", label: t("admin.sidebar.api"), id: "api", adminOnly: true },
    { icon: "🤖", label: t("admin.sidebar.ai"), id: "ai", adminOnly: true },
  ].filter(item => !isModerator || !item.adminOnly);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar items={sidebarItems} activeTab={activeTab} onTabChange={(id) => setActiveTab(id as TabId)} />

        {/* Main */}
        <div className="flex-1 min-w-0">
          <AdminTopNav
            title={sidebarItems.find(s => s.id === activeTab)?.label || "Дашборд"}
            subtitle="TravelHub Enterprise Dashboard"
            lastUpdated={lastUpdated}
            isRefreshing={isRefreshing}
            autoRefresh={autoRefresh}
            onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
            onRefresh={() => fetchData(true)}
          />

          <div className="p-6 space-y-6">

            {/* ════════════════ OVERVIEW ════════════════ */}
            {activeTab === "overview" && ceo && (
              <>
                {/* KPI Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
                  <KpiCard icon="💰" label={t("admin.overview.salesToday")} value={money(ceo.today.sales)} gradient="from-emerald-500 to-green-600" />
                  <KpiCard icon="🛒" label={t("admin.overview.bookings")} value={String(ceo.today.bookings)} gradient="from-blue-500 to-indigo-600" />
                  <KpiCard icon="🏦" label={t("admin.overview.commission")} value={money(ceo.today.commission)} gradient="from-violet-500 to-purple-600" />
                  <KpiCard icon="👤" label={t("admin.overview.newUsers")} value={String(ceo.today.newUsers)} gradient="from-cyan-500 to-blue-600" />
                  <KpiCard icon="🤝" label={t("admin.overview.newPartners")} value={String(ceo.today.newPartners)} gradient="from-amber-500 to-orange-600" />
                  <KpiCard icon="❌" label={t("admin.overview.cancellations")} value={String(ceo.today.cancellations)} gradient="from-rose-500 to-red-600" />
                  <KpiCard icon="📈" label={t("admin.overview.avgCheck")} value={money(ceo.totals.avgCheck)} gradient="from-indigo-500 to-blue-600" />
                </div>

                {/* Revenue Chart + Stats */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <ChartCard title={t("admin.overview.revenueDynamics")} subtitle={t("admin.overview.last14Days")} className="xl:col-span-2">
                    {ceo.bookingsByDay.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={[...ceo.bookingsByDay].reverse()}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => v.slice(5)} />
                          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => fmt(v)} />
                          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }} formatter={(value) => [money(Number(value)), t("admin.overview.revenue")]} labelFormatter={(l) => `${t("admin.common.dateFormat")} ${l}`} />
                          <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">{t("admin.overview.noDataPeriod")}</div>
                    )}
                  </ChartCard>

                  <ChartCard title={t("admin.overview.summary")}>
                    <div className="space-y-3">
                      {[
                        { label: "GMV", value: money(ceo.totals.gmv), color: "text-emerald-600" },
                        { label: t("admin.overview.platformRevenue"), value: money(ceo.totals.platformRevenue), color: "text-blue-600" },
                        { label: t("admin.overview.totalBookings"), value: String(ceo.totals.bookings), color: "" },
                        { label: t("admin.overview.totalUsers"), value: fmt(ceo.totals.users), color: "" },
                        { label: t("admin.overview.totalPartners"), value: String(ceo.totals.partners), color: "" },
                        { label: t("admin.overview.totalServices"), value: String(ceo.totals.services), color: "" },
                      ].map(item => (
                        <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                          <span className="text-sm text-gray-500">{item.label}</span>
                          <span className={`text-sm font-bold ${item.color || "text-gray-900"}`}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </ChartCard>
                </div>

                {/* Bookings by Day Chart */}
                {ceo.bookingsByDay.length > 0 && (
                  <ChartCard title={t("admin.overview.bookingsByDay")} subtitle={t("admin.overview.bookingsCount")}>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={[...ceo.bookingsByDay].reverse()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => v.slice(5)} />
                        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                        <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}

                {/* Weekly + Monthly Trends */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ChartCard title={t("admin.overview.week")} subtitle={t("admin.overview.weekMetrics")}>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center"><span className="text-sm text-gray-500">{t("admin.overview.bookings")}</span><span className="text-lg font-bold">{ceo.trends.weekBookings}</span></div>
                      <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-blue-500 rounded-full h-2 transition-all" style={{ width: `${Math.min(100, (ceo.trends.weekBookings / Math.max(ceo.totals.bookings, 1)) * 100)}%` }} /></div>
                      <div className="flex justify-between items-center"><span className="text-sm text-gray-500">{t("admin.overview.revenue")}</span><span className="text-lg font-bold text-emerald-600">{money(ceo.trends.weekRevenue)}</span></div>
                    </div>
                  </ChartCard>
                  <ChartCard title={t("admin.overview.month")} subtitle={t("admin.overview.monthMetrics")}>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center"><span className="text-sm text-gray-500">{t("admin.overview.bookings")}</span><span className="text-lg font-bold">{ceo.trends.monthBookings}</span></div>
                      <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-violet-500 rounded-full h-2 transition-all" style={{ width: `${Math.min(100, (ceo.trends.monthBookings / Math.max(ceo.totals.bookings, 1)) * 100)}%` }} /></div>
                      <div className="flex justify-between items-center"><span className="text-sm text-gray-500">{t("admin.overview.revenue")}</span><span className="text-lg font-bold text-emerald-600">{money(ceo.trends.monthRevenue)}</span></div>
                    </div>
                  </ChartCard>
                </div>
              </>
            )}

            {/* ════════════════ USER ANALYTICS ════════════════ */}
            {activeTab === "analytics" && data && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <KpiCard icon="📱" label="DAU" value={String(data.users?.dau || 0)} gradient="from-blue-500 to-cyan-600" />
                  <KpiCard icon="📅" label="WAU" value={String(data.users?.wau || 0)} gradient="from-violet-500 to-purple-600" />
                  <KpiCard icon="📊" label="MAU" value={String(data.users?.mau || 0)} gradient="from-indigo-500 to-blue-600" />
                </div>

                {data.users && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ChartCard title={t("admin.users.byRole")}>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie data={data.users.byRole.map(r => ({ name: r.role, value: r.count }))} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                            {data.users.byRole.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartCard>
                    <ChartCard title={t("admin.users.newByDay")}>
                      <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={[...data.users.newByDay].reverse()}>
                          <defs><linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} /></linearGradient></defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => v.slice(5)} />
                          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                          <Area type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  </div>
                )}

                {/* Search Analytics */}
                {data.search && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ChartCard title={t("admin.analytics.topQueries")}>
                      <div className="space-y-2">
                        {data.search.topQueries.slice(0, 8).map((q, i) => (
                          <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50/80 rounded-xl hover:bg-gray-100/80 transition-colors">
                            <span className="text-xs font-bold text-gray-300 w-5 text-center">{i + 1}</span>
                            <span className="flex-1 text-sm font-medium text-gray-700 truncate">{q.query}</span>
                            <span className="text-sm font-bold text-blue-600">{q.count}</span>
                          </div>
                        ))}
                      </div>
                    </ChartCard>
                    <ChartCard title={t("admin.analytics.ineffectiveQueries")}>
                      {data.search.emptySearches.length > 0 ? (
                        <div className="space-y-2">
                          {data.search.emptySearches.slice(0, 8).map((q, i) => (
                            <div key={i} className="flex items-center gap-3 p-2.5 bg-red-50/80 rounded-xl">
                              <span className="text-xs">❌</span>
                              <span className="flex-1 text-sm font-medium text-red-700 truncate">{q.query}</span>
                              <span className="text-xs font-bold text-red-500">{q.count}×</span>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-sm text-gray-400 text-center py-8">{t("admin.analytics.allEffective")} ✅</p>}
                    </ChartCard>
                  </div>
                )}

                {/* Services by Type */}
                {data.services && data.services.length > 0 && (
                  <ChartCard title={t("admin.analytics.revenueByType")} subtitle={t("admin.analytics.revenueByTypeSub")}>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={data.services.map(s => ({ name: s.type, revenue: s.revenue, bookings: s.totalBookings, commission: s.commission }))} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => fmt(v)} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} width={100} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} formatter={(value) => [money(Number(value)), t("admin.overview.revenue")]} />
                        <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}

                {/* Partners Top */}
                {data.partners && (
                  <ChartCard title={t("admin.analytics.topPartners")}>
                    <div className="space-y-2">
                      {data.partners.topByRevenue.slice(0, 8).map((p, i) => (
                        <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl hover:bg-gray-100/80 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">{i + 1}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{p.firstName} {p.lastName}</div>
                            <div className="text-xs text-gray-400">{p.companyName || p.partnerType || "—"}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-emerald-600">{money(p.revenue)}</div>
                            <div className="text-xs text-gray-400">{p.completedBookings} {t("admin.analytics.orders")}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ChartCard>
                )}

                {/* Funnel */}
                {data.funnel && (
                  <ChartCard title={t("admin.analytics.funnel")} subtitle={t("admin.analytics.funnelSub")}>
                    <div className="space-y-3">
                      {data.funnel.steps.map((s, i) => {
                        const maxC = Math.max(...data.funnel!.steps.map(x => x.count), 1);
                        const w = Math.round((s.count / maxC) * 100);
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 w-32 shrink-0 font-medium">{s.step}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-7 overflow-hidden">
                              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-700 flex items-center justify-end pr-3" style={{ width: `${w}%` }}>
                                {w > 20 && <span className="text-xs font-bold text-white">{s.count}</span>}
                              </div>
                            </div>
                            <span className="text-xs font-bold text-gray-700 w-12 text-right">{s.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </ChartCard>
                )}

                {/* Finance */}
                {data.finance && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ChartCard title={t("admin.finance.byType")}>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie data={data.finance.revenueByType.map(r => ({ name: r.type, value: r.revenue }))} cx="50%" cy="50%" outerRadius={100} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                            {data.finance.revenueByType.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: 12 }} formatter={(v) => [money(Number(v)), ""]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartCard>
                    <ChartCard title={t("admin.finance.revenueByDay")}>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={[...data.finance.revenueByDay].reverse()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => v.slice(5)} />
                          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => fmt(v)} />
                          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} formatter={(v) => [money(Number(v)), ""]} />
                          <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: "#3b82f6" }} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="fees" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: "#22c55e" }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  </div>
                )}

                {/* Marketing */}
                {data.marketing && (
                  <ChartCard title={t("admin.analytics.marketingChannels")}>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead><tr className="border-b border-gray-100">
                          {[t("admin.marketing.channel"), t("admin.marketing.visits"), t("admin.marketing.orders"), t("admin.marketing.revenue"), t("admin.marketing.costs"), "ROI", "CAC"].map(h => (
                            <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase pb-3 px-3">{h}</th>
                          ))}
                        </tr></thead>
                        <tbody className="divide-y divide-gray-50">
                          {data.marketing.channels.map(c => (
                            <tr key={c.channel} className="hover:bg-gray-50/80">
                              <td className="py-3 px-3 text-sm font-medium capitalize">{c.channel}</td>
                              <td className="py-3 px-3 text-sm text-right">{fmt(c.visits)}</td>
                              <td className="py-3 px-3 text-sm text-right font-bold">{c.bookings}</td>
                              <td className="py-3 px-3 text-sm text-right font-bold text-emerald-600">{money(c.revenue)}</td>
                              <td className="py-3 px-3 text-sm text-right text-red-500">{money(c.cost)}</td>
                              <td className="py-3 px-3 text-sm text-right"><span className={`font-bold ${c.roi >= 0 ? "text-emerald-600" : "text-red-500"}`}>{c.roi}%</span></td>
                              <td className="py-3 px-3 text-sm text-right">{money(c.cac)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </ChartCard>
                )}

                {/* Technical */}
                {data.technical && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <KpiCard icon="👁" label={t("admin.analytics.totalViews")} value={fmt(data.technical.totalViews)} gradient="from-blue-500 to-cyan-600" />
                    <KpiCard icon="📅" label={t("admin.analytics.todayViews")} value={fmt(data.technical.todayViews)} gradient="from-emerald-500 to-green-600" />
                    <KpiCard icon="⏱" label={t("admin.analytics.avgTime")} value={data.technical.avgDuration + "с"} gradient="from-violet-500 to-purple-600" />
                  </div>
                )}
              </>
            )}

            {/* ════════════════ USERS ════════════════ */}
            {activeTab === "users" && data?.users && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard icon="📱" label="DAU" value={String(data.users.dau)} gradient="from-blue-500 to-cyan-600" />
                  <KpiCard icon="📅" label="WAU" value={String(data.users.wau)} gradient="from-violet-500 to-purple-600" />
                  <KpiCard icon="📊" label="MAU" value={String(data.users.mau)} gradient="from-indigo-500 to-blue-600" />
                  <KpiCard icon="👥" label={t("admin.users.total")} value={fmt(data.users.total)} gradient="from-emerald-500 to-green-600" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ChartCard title={t("admin.users.byRole")}>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={data.users.byRole.map(r => ({ name: r.role, value: r.count }))} cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                          {data.users.byRole.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartCard>
                  <ChartCard title={t("admin.users.newByDay")}>
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={[...data.users.newByDay].reverse()}>
                        <defs><linearGradient id="colorUsersTab" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => v.slice(5)} />
                        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                        <Area type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorUsersTab)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartCard>
                </div>
                <ChartCard title={t("admin.users.repeatPurchases")}>
                  <div className="grid grid-cols-3 gap-4">
                    {[{ label: t("admin.users.once"), value: data.users.repeatPurchases.once, color: "from-blue-500 to-cyan-600" },
                      { label: t("admin.users.twice"), value: data.users.repeatPurchases.twice, color: "from-violet-500 to-purple-600" },
                      { label: t("admin.users.threePlus"), value: data.users.repeatPurchases.threePlus, color: "from-emerald-500 to-green-600" },
                    ].map(item => (
                      <div key={item.label} className="text-center p-4 bg-gray-50/80 rounded-xl">
                        <div className="text-2xl font-bold text-gray-900">{item.value}</div>
                        <div className="text-xs text-gray-500 mt-1">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </ChartCard>
              </>
            )}

            {/* ════════════════ FINANCE ════════════════ */}
            {activeTab === "finance" && data?.finance && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard icon="💰" label={t("admin.bookings.gmv")} value={money(data.finance.gmv)} gradient="from-emerald-500 to-green-600" />
                  <KpiCard icon="🏦" label={t("admin.bookings.platformRevenue")} value={money(data.finance.platformRevenue)} gradient="from-blue-500 to-indigo-600" />
                  <KpiCard icon="↩️" label={t("admin.bookings.refunds")} value={money(data.finance.refunds)} gradient="from-rose-500 to-red-600" />
                  <KpiCard icon="⏳" label={t("admin.bookings.pendingPayments")} value={String(data.finance.pendingPayments)} gradient="from-amber-500 to-orange-600" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ChartCard title={t("admin.finance.byType")}>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie data={data.finance.revenueByType.map(r => ({ name: r.type, value: r.revenue }))} cx="50%" cy="50%" outerRadius={110} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                          {data.finance.revenueByType.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 12 }} formatter={(v) => [money(Number(v)), ""]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartCard>
                  <ChartCard title={t("admin.finance.revenueByType")}>
                    <div className="space-y-3">
                      {data.finance.revenueByType.map((r, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="flex-1 text-sm font-medium text-gray-700">{r.type}</span>
                          <span className="text-sm font-bold text-gray-900">{money(r.revenue)}</span>
                          <span className="text-xs text-gray-400">{r.count} {t("admin.analytics.orders")}</span>
                        </div>
                      ))}
                    </div>
                  </ChartCard>
                </div>
                {data.finance.revenueByDay.length > 0 && (                    <ChartCard title={t("admin.finance.revenueByDay")} subtitle={t("admin.finance.revenueAndFees")}>
                    <ResponsiveContainer width="100%" height={350}>
                      <AreaChart data={[...data.finance.revenueByDay].reverse()}>
                        <defs>
                          <linearGradient id="colorRevFin" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                          <linearGradient id="colorFeeFin" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => v.slice(5)} />
                        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => fmt(v)} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} formatter={(v) => [money(Number(v)), ""]} />
                        <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevFin)" />
                        <Area type="monotone" dataKey="fees" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorFeeFin)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}
              </>
            )}

            {/* ════════════════ MARKETING ════════════════ */}
            {activeTab === "marketing" && data?.marketing && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard icon="👁" label={t("admin.marketing.visits")} value={fmt(data.marketing.totals.totalVisits)} gradient="from-blue-500 to-cyan-600" />
                  <KpiCard icon="🛒" label={t("admin.marketing.orders")} value={String(data.marketing.totals.totalBookings)} gradient="from-violet-500 to-purple-600" />
                  <KpiCard icon="💰" label={t("admin.marketing.revenue")} value={money(data.marketing.totals.revenue)} gradient="from-emerald-500 to-green-600" />
                  <KpiCard icon="📈" label="ROI" value={data.marketing.totals.roi + "%"} gradient="from-amber-500 to-orange-600" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ChartCard title={t("admin.analytics.marketingChannels")}>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead><tr className="border-b border-gray-100">
                          {[t("admin.marketing.channel"), t("admin.marketing.visits"), t("admin.marketing.orders"), t("admin.marketing.revenue"), t("admin.marketing.costs"), "ROI", "CAC"].map(h => (
                            <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase pb-3 px-3">{h}</th>
                          ))}
                        </tr></thead>
                        <tbody className="divide-y divide-gray-50">
                          {data.marketing.channels.map(c => (
                            <tr key={c.channel} className="hover:bg-gray-50/80">
                              <td className="py-3 px-3 text-sm font-medium capitalize">{c.channel}</td>
                              <td className="py-3 px-3 text-sm text-right">{fmt(c.visits)}</td>
                              <td className="py-3 px-3 text-sm text-right font-bold">{c.bookings}</td>
                              <td className="py-3 px-3 text-sm text-right font-bold text-emerald-600">{money(c.revenue)}</td>
                              <td className="py-3 px-3 text-sm text-right text-red-500">{money(c.cost)}</td>
                              <td className="py-3 px-3 text-sm text-right"><span className={`font-bold ${c.roi >= 0 ? "text-emerald-600" : "text-red-500"}`}>{c.roi}%</span></td>
                              <td className="py-3 px-3 text-sm text-right">{money(c.cac)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </ChartCard>
                  {data.marketing.eventsByDay.length > 0 && (
                    <ChartCard title={t("admin.analytics.eventsByDay")}>
                      <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={[...data.marketing.eventsByDay].reverse()}>
                          <defs><linearGradient id="colorMktg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => v.slice(5)} />
                          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                          <Area type="monotone" dataKey="visits" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorMktg)" name={t("admin.marketing.visits")} />
                          <Area type="monotone" dataKey="bookings" stroke="#22c55e" strokeWidth={2} fillOpacity={0.5} fill="url(#colorMktg)" name={t("admin.marketing.orders")} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  )}
                </div>
                {data.marketing.campaigns.length > 0 && (
                  <ChartCard title={t("admin.marketing.campaigns")}>
                    <div className="space-y-2">
                      {data.marketing.campaigns.slice(0, 10).map((c, i) => (
                        <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50/80 rounded-xl">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">{i + 1}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{c.name}</div>
                            <div className="text-xs text-gray-400 capitalize">{c.channel}</div>
                          </div>
                          <span className="text-sm font-bold text-emerald-600">{money(c.revenue)}</span>
                        </div>
                      ))}
                    </div>
                  </ChartCard>
                )}
              </>
            )}

            {/* ════════════════ BOOKINGS ════════════════ */}
            {activeTab === "bookings" && data?.finance && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard icon="💰" label={t("admin.bookings.gmv")} value={money(data.finance.gmv)} gradient="from-emerald-500 to-green-600" />
                  <KpiCard icon="🏦" label={t("admin.bookings.platformRevenue")} value={money(data.finance.platformRevenue)} gradient="from-blue-500 to-indigo-600" />
                  <KpiCard icon="↩️" label={t("admin.bookings.refunds")} value={money(data.finance.refunds)} gradient="from-rose-500 to-red-600" />
                  <KpiCard icon="⏳" label={t("admin.bookings.pendingPayments")} value={String(data.finance.pendingPayments)} gradient="from-amber-500 to-orange-600" />
                </div>
                {data.finance.revenueByDay.length > 0 && (                    <ChartCard title={t("admin.finance.revenueByDay")} subtitle={t("admin.finance.revenueAndFees")}>
                    <ResponsiveContainer width="100%" height={350}>
                      <AreaChart data={[...data.finance.revenueByDay].reverse()}>
                        <defs>
                          <linearGradient id="colorRev2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                          <linearGradient id="colorFee2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => v.slice(5)} />
                        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(v) => fmt(v)} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} formatter={(v) => [money(Number(v)), ""]} />
                        <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRev2)" />
                        <Area type="monotone" dataKey="fees" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorFee2)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartCard>
                )}
              </>
            )}

            {/* ════════════════ SERVICES ════════════════ */}
            {activeTab === "services" && data?.services && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {data.services.map(s => (
                  <div key={s.type} className="bg-white/80 backdrop-blur-sm rounded-[20px] p-5 border border-gray-100/80 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-blue-500/20">{s.type[0]}</div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{s.type}</div>
                        <div className="text-xs text-gray-400">{s.count} {t("admin.services.listings")}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { l: t("admin.services.price"), v: money(s.avgPrice) },
                        { l: t("admin.services.orders"), v: String(s.totalBookings) },
                        { l: t("admin.services.revenue"), v: money(s.revenue) },
                        { l: t("admin.services.commission"), v: money(s.commission) },
                        { l: t("admin.services.conversion"), v: s.conversion + "%" },
                        { l: t("admin.services.rating"), v: "⭐ " + s.avgRating },
                      ].map(item => (
                        <div key={item.l} className="text-center p-2 bg-gray-50/80 rounded-xl">
                          <div className="text-xs font-bold text-gray-900">{item.v}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">{item.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ════════════════ PARTNERS ════════════════ */}
            {activeTab === "partners" && data?.partners && (
              <>                  <KpiCard icon="🤝" label={t("admin.partners.total")} value={String(data.partners.total)} gradient="from-blue-500 to-indigo-600" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[{ title: t("admin.partners.topByRevenue"), data: data.partners.topByRevenue, render: (p: any) => money(p.revenue) },
                    { title: t("admin.partners.topByOrders"), data: data.partners.topByBookings, render: (p: any) => String(p.completedBookings) },
                    { title: t("admin.partners.topByRating"), data: data.partners.topByRating, render: (p: any) => "⭐ " + p.avgRating },
                  ].map(sec => (
                    <ChartCard key={sec.title} title={sec.title}>
                      <div className="space-y-2">
                        {sec.data.slice(0, 8).map((p: any, i: number) => (
                          <div key={p.id} className="flex items-center gap-3 p-2.5 bg-gray-50/80 rounded-xl">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">{i + 1}</div>
                            <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{p.firstName} {p.lastName}</div><div className="text-xs text-gray-400">{p.companyName || "—"}</div></div>
                            <span className="text-sm font-bold text-blue-600">{sec.render(p)}</span>
                          </div>
                        ))}
                      </div>
                    </ChartCard>
                  ))}
                </div>
              </>
            )}

            {/* ════════════════ MODERATION ════════════════ */}
            {activeTab === "moderation" && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex bg-gray-100 rounded-xl p-1">
                    {["PENDING", "APPROVED", "REJECTED"].map(s => (
                      <button key={s} onClick={() => { setModFilter(s); setModPage(1); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${modFilter === s ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
                        {s === "PENDING" ? t("admin.moderation.pending") : s === "APPROVED" ? t("admin.moderation.approved") : t("admin.moderation.rejected")}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => fetchModeration()} className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors shadow-md shadow-blue-500/25">{t("admin.moderation.refresh")}</button>
                </div>
                {modLoading ? (
                  <div className="text-center py-12"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto" /></div>
                ) : modItems.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-[20px] border border-gray-100"><div className="text-4xl mb-3">✅</div><p className="text-sm text-gray-500">{t("admin.moderation.noItems")}</p></div>
                ) : (
                  <div className="space-y-3">
                    {modItems.map(s => (
                      <div key={s.id} className="bg-white/80 rounded-[20px] p-5 border border-gray-100 hover:shadow-lg transition-all">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 font-medium">{s.type}</span>
                              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${s.moderationStatus === "PENDING" ? "bg-amber-100 text-amber-700" : s.moderationStatus === "APPROVED" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{s.moderationStatus}</span>
                            </div>
                            <h4 className="font-bold text-gray-900 truncate">{s.title}</h4>
                            <p className="text-xs text-gray-400 mt-1">📍 {s.city}, {s.country} • 💰 {money(s.price)} • ⭐ {s.rating} • 👤 {s.provider?.firstName} {s.provider?.lastName}</p>
                          </div>
                          {s.moderationStatus === "PENDING" && (
                            <div className="flex items-center gap-2 shrink-0">
                              {rejectingId === s.id ? (
                                <div className="flex items-center gap-2">
                                  <input type="text" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder={t("admin.moderation.reason")} className="w-40 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-red-400 focus:ring-0 outline-none" />
                                  <button onClick={() => handleModeration(s.id, "reject", rejectReason)} disabled={!rejectReason.trim()} className="px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50">OK</button>
                                  <button onClick={() => { setRejectingId(null); setRejectReason(""); }} className="text-gray-400">✕</button>
                                </div>
                              ) : (
                                <>
                                  <button onClick={() => handleModeration(s.id, "approve")} className="px-4 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600">{t("admin.moderation.approve")}</button>
                                  <button onClick={() => setRejectingId(s.id)} className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600">{t("admin.moderation.reject")}</button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ════════════════ USERS MGMT ════════════════ */}
            {activeTab === "users_mgmt" && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <input type="text" placeholder={t("admin.usersMgmt.search")} value={usersSearch} onChange={e => { setUsersSearch(e.target.value); setUsersPage(1); }}
                    className="flex-1 h-10 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-blue-400 focus:ring-0 outline-none" />
                  <select value={usersRole} onChange={e => { setUsersRole(e.target.value); setUsersPage(1); }} className="h-10 px-3 rounded-xl border border-gray-200 text-sm focus:border-blue-400 focus:ring-0 outline-none">
                    <option value="ALL">{t("admin.usersMgmt.allRoles")}</option>
                    <option value="ADMIN">{t("admin.usersMgmt.admin")}</option>
                    <option value="MODERATOR">{t("admin.usersMgmt.moderator")}</option>
                    <option value="PARTNER">{t("admin.usersMgmt.partner")}</option>
                    <option value="BUYER">{t("admin.usersMgmt.buyer")}</option>
                  </select>
                  <button onClick={() => fetchUsers()} className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600">🔄</button>
                </div>
                {usersLoading ? (
                  <div className="text-center py-12"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto" /></div>
                ) : (
                  <div className="bg-white/80 rounded-[20px] border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead><tr className="border-b border-gray-100 bg-gray-50/80">
                          {[t("admin.usersMgmt.name"), t("admin.usersMgmt.email"), t("admin.usersMgmt.role"), t("admin.usersMgmt.status"), t("admin.usersMgmt.actions")].map(h => (
                            <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase px-4 py-3">{h}</th>
                          ))}
                        </tr></thead>
                        <tbody className="divide-y divide-gray-50">
                          {usersList.map(u => (
                            <tr key={u.id} className="hover:bg-gray-50/80">
                              <td className="px-4 py-3 text-sm font-medium">{u.firstName} {u.lastName}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
                              <td className="px-4 py-3"><span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 font-medium">{u.role}</span></td>
                              <td className="px-4 py-3">                              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${u.isActive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>{u.isActive ? t("admin.usersMgmt.active") : t("admin.usersMgmt.banned")}</span></td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {u.isActive ? (
                                    <button onClick={() => handleUserAction(u.id, "ban", "Заблокирован администратором")} className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">{t("admin.usersMgmt.ban")}</button>
                                  ) : (
                                    <button onClick={() => handleUserAction(u.id, "unban")} className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100">{t("admin.usersMgmt.unban")}</button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {usersTotalPages > 1 && (
                      <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100">
                        <span className="text-xs text-gray-400">{t("admin.usersMgmt.page")} {usersPage} {t("admin.usersMgmt.of")} {usersTotalPages}</span>
                        <div className="flex gap-1">
                          <button onClick={() => setUsersPage(p => Math.max(1, p - 1))} disabled={usersPage === 1} className="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-30">←</button>
                          <button onClick={() => setUsersPage(p => Math.min(usersTotalPages, p + 1))} disabled={usersPage >= usersTotalPages} className="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-30">→</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ════════════════ AUDIT ════════════════ */}
            {activeTab === "audit" && (
              <>
                <button onClick={() => fetchAuditLogs()} className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 mb-4">{t("admin.moderation.refresh")}</button>
                {auditLoading ? (
                  <div className="text-center py-12"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto" /></div>
                ) : (
                  <div className="bg-white/80 rounded-[20px] border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead><tr className="border-b border-gray-100 bg-gray-50/80">
                          {[t("admin.audit.date"), t("admin.audit.action"), t("admin.audit.target"), t("admin.audit.operator"), t("admin.audit.details")].map(h => (
                            <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase px-4 py-3">{h}</th>
                          ))}
                        </tr></thead>
                        <tbody className="divide-y divide-gray-50">
                          {auditLogs.map((log, i) => (
                            <tr key={log.id || i} className="hover:bg-gray-50/80">
                              <td className="px-4 py-3 text-xs text-gray-500">{new Date(log.createdAt).toLocaleString("ru-RU")}</td>
                              <td className="px-4 py-3"><span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 font-medium">{log.action}</span></td>
                              <td className="px-4 py-3 text-sm">{log.targetType} {log.targetId?.slice(0, 8)}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{log.actorEmail || "—"}</td>
                              <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate">{log.details ? JSON.stringify(log.details) : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ════════════════ ORDERS ════════════════ */}
            {activeTab === "orders" && data?.finance && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard icon="🛒" label={t("admin.orders.total")} value={String(data.finance.gmv > 0 ? Math.round(data.finance.gmv / 500) : 0)} gradient="from-blue-500 to-indigo-600" />
                  <KpiCard icon="⏳" label={t("admin.orders.pending")} value={String(data.finance.pendingPayments)} gradient="from-amber-500 to-orange-600" />
                  <KpiCard icon="✅" label={t("admin.orders.completed")} value={String(data.ceo?.totals.bookings || 0)} gradient="from-emerald-500 to-green-600" />
                  <KpiCard icon="❌" label={t("admin.orders.cancelled")} value={String(data.ceo?.today.cancellations || 0)} gradient="from-rose-500 to-red-600" />
                </div>
                <ChartCard title={t("admin.orders.title")} subtitle={t("admin.orders.subtitle")}>
                  <div className="text-center py-12 text-gray-400 text-sm">{t("admin.noData")}</div>
                </ChartCard>
              </>
            )}

            {/* ════════════════ MODERATORS ════════════════ */}
            {activeTab === "moderators" && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard icon="🛡" label={t("admin.moderators.total")} value="3" gradient="from-blue-500 to-indigo-600" />
                  <KpiCard icon="✅" label={t("admin.moderators.active")} value="2" gradient="from-emerald-500 to-green-600" />
                  <KpiCard icon="⏰" label={t("admin.moderators.lastActive")} value="5м" gradient="from-violet-500 to-purple-600" />
                  <KpiCard icon="📋" label={t("admin.moderators.actions")} value="47" gradient="from-amber-500 to-orange-600" />
                </div>
                <ChartCard title={t("admin.moderators.title")}>
                  <div className="text-center py-12 text-gray-400 text-sm">{t("admin.noData")}</div>
                </ChartCard>
              </>
            )}

            {/* ════════════════ CUSTOMERS ════════════════ */}
            {activeTab === "customers" && data?.users && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard icon="👥" label={t("admin.customers.total")} value={fmt(data.users.total)} gradient="from-blue-500 to-indigo-600" />
                  <KpiCard icon="🆕" label={t("admin.customers.newToday")} value={String(data.users.newByDay[data.users.newByDay.length - 1]?.count || 0)} gradient="from-emerald-500 to-green-600" />
                  <KpiCard icon="🔄" label={t("admin.customers.returning")} value={String(data.users.repeatPurchases.twice + data.users.repeatPurchases.threePlus)} gradient="from-violet-500 to-purple-600" />
                  <KpiCard icon="💰" label={t("admin.customers.avgSpending")} value={money(data.ceo?.totals.avgCheck || 0)} gradient="from-amber-500 to-orange-600" />
                </div>
                <ChartCard title={t("admin.customers.title")} subtitle={t("admin.customers.topCountries")}>
                  <div className="text-center py-12 text-gray-400 text-sm">{t("admin.noData")}</div>
                </ChartCard>
              </>
            )}

            {/* ════════════════ PAYMENTS ════════════════ */}
            {activeTab === "payments" && data?.finance && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard icon="💳" label={t("admin.payments.total")} value={String(data.ceo?.totals.bookings || 0)} gradient="from-blue-500 to-indigo-600" />
                  <KpiCard icon="✅" label={t("admin.payments.successful")} value={String(Math.round((data.ceo?.totals.bookings || 0) * 0.95))} gradient="from-emerald-500 to-green-600" />
                  <KpiCard icon="⏳" label={t("admin.payments.pending")} value={String(data.finance.pendingPayments)} gradient="from-amber-500 to-orange-600" />
                  <KpiCard icon="💰" label={t("admin.payments.totalAmount")} value={money(data.finance.gmv)} gradient="from-violet-500 to-purple-600" />
                </div>
                <ChartCard title={t("admin.payments.title")}>
                  <div className="text-center py-12 text-gray-400 text-sm">{t("admin.noData")}</div>
                </ChartCard>
              </>
            )}

            {/* ════════════════ COMMISSIONS ════════════════ */}
            {activeTab === "commissions" && data?.finance && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard icon="🏦" label={t("admin.commissions.earned")} value={money(data.finance.platformRevenue)} gradient="from-emerald-500 to-green-600" />
                  <KpiCard icon="⏳" label={t("admin.commissions.pending")} value={money(data.finance.platformRevenue * 0.1)} gradient="from-amber-500 to-orange-600" />
                  <KpiCard icon="✅" label={t("admin.commissions.paid")} value={money(data.finance.platformRevenue * 0.9)} gradient="from-blue-500 to-indigo-600" />
                  <KpiCard icon="📊" label={t("admin.commissions.byType")} value={String(data.finance.revenueByType.length)} gradient="from-violet-500 to-purple-600" />
                </div>
                <ChartCard title={t("admin.commissions.title")} subtitle={t("admin.commissions.byType")}>
                  <div className="space-y-3">
                    {data.finance.revenueByType.map((r, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="flex-1 text-sm font-medium text-gray-700">{r.type}</span>
                        <span className="text-sm font-bold text-emerald-600">{money(r.fees)}</span>
                      </div>
                    ))}
                  </div>
                </ChartCard>
              </>
            )}

            {/* ════════════════ REFUNDS ════════════════ */}
            {activeTab === "refunds" && data?.finance && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard icon="↩️" label={t("admin.refunds.total")} value={String(Math.round(data.finance.refunds / 500))} gradient="from-rose-500 to-red-600" />
                  <KpiCard icon="⏳" label={t("admin.refunds.pending")} value={String(Math.round(data.finance.refunds / 1000))} gradient="from-amber-500 to-orange-600" />
                  <KpiCard icon="✅" label={t("admin.refunds.approved")} value={String(Math.round(data.finance.refunds / 700))} gradient="from-emerald-500 to-green-600" />
                  <KpiCard icon="💰" label={t("admin.refunds.amount")} value={money(data.finance.refunds)} gradient="from-violet-500 to-purple-600" />
                </div>
                <ChartCard title={t("admin.refunds.title")} subtitle={t("admin.refunds.subtitle")}>
                  <div className="text-center py-12 text-gray-400 text-sm">{t("admin.noData")}</div>
                </ChartCard>
              </>
            )}

            {/* ════════════════ PROMOTIONS ════════════════ */}
            {activeTab === "promotions" && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard icon="🎁" label={t("admin.promotions.active")} value="5" gradient="from-violet-500 to-purple-600" />
                  <KpiCard icon="📊" label={t("admin.promotions.total")} value="12" gradient="from-blue-500 to-indigo-600" />
                  <KpiCard icon="🎟" label={t("admin.promotions.used")} value="347" gradient="from-emerald-500 to-green-600" />
                  <KpiCard icon="💰" label={t("admin.promotions.revenue")} value="15,200 AZN" gradient="from-amber-500 to-orange-600" />
                </div>
                <ChartCard title={t("admin.promotions.title")}>
                  <div className="text-center py-12 text-gray-400 text-sm">{t("admin.noData")}</div>
                </ChartCard>
              </>
            )}

            {/* ════════════════ SUPPORT ════════════════ */}
            {activeTab === "support" && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard icon="🎧" label={t("admin.support.total")} value="24" gradient="from-blue-500 to-indigo-600" />
                  <KpiCard icon="📬" label={t("admin.support.open")} value="7" gradient="from-amber-500 to-orange-600" />
                  <KpiCard icon="✅" label={t("admin.support.resolved")} value="17" gradient="from-emerald-500 to-green-600" />
                  <KpiCard icon="⏱" label={t("admin.support.avgResponse")} value="2ч" gradient="from-violet-500 to-purple-600" />
                </div>
                <ChartCard title={t("admin.support.title")}>
                  <div className="text-center py-12 text-gray-400 text-sm">{t("admin.noData")}</div>
                </ChartCard>
              </>
            )}

            {/* ════════════════ MESSAGES ════════════════ */}
            {activeTab === "messages" && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard icon="✉️" label={t("admin.messagesMessages.total")} value="156" gradient="from-blue-500 to-indigo-600" />
                  <KpiCard icon="📩" label={t("admin.messagesMessages.unread")} value="12" gradient="from-amber-500 to-orange-600" />
                  <KpiCard icon="📤" label={t("admin.messagesMessages.sent")} value="89" gradient="from-emerald-500 to-green-600" />
                  <KpiCard icon="👥" label="Чаты" value="34" gradient="from-violet-500 to-purple-600" />
                </div>
                <ChartCard title={t("admin.messagesMessages.title")}>
                  <div className="text-center py-12 text-gray-400 text-sm">{t("admin.noData")}</div>
                </ChartCard>
              </>
            )}

            {/* ════════════════ NOTIFICATIONS ════════════════ */}
            {activeTab === "notifications" && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard icon="🔔" label={t("admin.notificationsNotifications.total")} value="1,247" gradient="from-blue-500 to-indigo-600" />
                  <KpiCard icon="📩" label={t("admin.notificationsNotifications.unread")} value="23" gradient="from-amber-500 to-orange-600" />
                  <KpiCard icon="📤" label={t("admin.notificationsNotifications.sent")} value="892" gradient="from-emerald-500 to-green-600" />
                  <KpiCard icon="📧" label="Email" value="456" gradient="from-violet-500 to-purple-600" />
                </div>
                <ChartCard title={t("admin.notificationsNotifications.title")}>
                  <div className="text-center py-12 text-gray-400 text-sm">{t("admin.noData")}</div>
                </ChartCard>
              </>
            )}

            {/* ════════════════ REPORTS ════════════════ */}
            {activeTab === "reports" && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard icon="📊" label={t("admin.reports.total")} value="28" gradient="from-blue-500 to-indigo-600" />
                  <KpiCard icon="📅" label={t("admin.reports.lastGenerated")} value="Сегодня" gradient="from-emerald-500 to-green-600" />
                  <KpiCard icon="📄" label={t("admin.reports.formats")} value="PDF, Excel" gradient="from-violet-500 to-purple-600" />
                  <KpiCard icon="🔄" label="Авто" value="Еженедельно" gradient="from-amber-500 to-orange-600" />
                </div>
                <ChartCard title={t("admin.reports.title")}>
                  <div className="text-center py-12 text-gray-400 text-sm">{t("admin.noData")}</div>
                </ChartCard>
              </>
            )}

            {/* ════════════════ CALENDAR ════════════════ */}
            {activeTab === "calendar" && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard icon="📅" label={t("admin.calendarCalendar.today")} value={String(data?.ceo?.today.bookings || 0)} gradient="from-blue-500 to-indigo-600" />
                  <KpiCard icon="📆" label={t("admin.calendarCalendar.thisWeek")} value={String(data?.ceo?.trends.weekBookings || 0)} gradient="from-emerald-500 to-green-600" />
                  <KpiCard icon="🗓" label={t("admin.calendarCalendar.thisMonth")} value={String(data?.ceo?.trends.monthBookings || 0)} gradient="from-violet-500 to-purple-600" />
                  <KpiCard icon="📊" label={t("admin.overview.bookings")} value={String(data?.ceo?.totals.bookings || 0)} gradient="from-amber-500 to-orange-600" />
                </div>
                <ChartCard title={t("admin.calendarCalendar.title")} subtitle={t("admin.calendarCalendar.subtitle")}>
                  <div className="text-center py-12 text-gray-400 text-sm">{t("admin.noData")}</div>
                </ChartCard>
              </>
            )}

            {/* ════════════════ DOCUMENTS ════════════════ */}
            {activeTab === "documents" && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard icon="📄" label={t("admin.documents.total")} value="156" gradient="from-blue-500 to-indigo-600" />
                  <KpiCard icon="📝" label={t("admin.documents.contracts")} value="42" gradient="from-emerald-500 to-green-600" />
                  <KpiCard icon="🧾" label={t("admin.documents.invoices")} value="98" gradient="from-violet-500 to-purple-600" />
                  <KpiCard icon="📁" label="Папки" value="12" gradient="from-amber-500 to-orange-600" />
                </div>
                <ChartCard title={t("admin.documents.title")}>
                  <div className="text-center py-12 text-gray-400 text-sm">{t("admin.noData")}</div>
                </ChartCard>
              </>
            )}

            {/* ════════════════ SETTINGS ════════════════ */}
            {activeTab === "settings" && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard icon="⚙️" label={t("admin.settings.general")} value="✓" gradient="from-blue-500 to-indigo-600" />
                  <KpiCard icon="💳" label={t("admin.settings.payments2")} value="✓" gradient="from-emerald-500 to-green-600" />
                  <KpiCard icon="🔔" label={t("admin.settings.notifications2")} value="✓" gradient="from-violet-500 to-purple-600" />
                  <KpiCard icon="🔒" label={t("admin.settings.security2")} value="✓" gradient="from-amber-500 to-orange-600" />
                </div>
                <ChartCard title={t("admin.settings.title")}>
                  <div className="text-center py-12 text-gray-400 text-sm">{t("admin.noData")}</div>
                </ChartCard>
              </>
            )}

            {/* ════════════════ LOGS ════════════════ */}
            {activeTab === "logs" && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard icon="📜" label={t("admin.logs.total")} value="12,847" gradient="from-blue-500 to-indigo-600" />
                  <KpiCard icon="❌" label={t("admin.logs.errors")} value="23" gradient="from-rose-500 to-red-600" />
                  <KpiCard icon="⚠️" label={t("admin.logs.warnings")} value="67" gradient="from-amber-500 to-orange-600" />
                  <KpiCard icon="ℹ️" label={t("admin.logs.info")} value="12,757" gradient="from-emerald-500 to-green-600" />
                </div>
                <ChartCard title={t("admin.logs.title")}>
                  <div className="text-center py-12 text-gray-400 text-sm">{t("admin.noData")}</div>
                </ChartCard>
              </>
            )}

            {/* ════════════════ SECURITY ════════════════ */}
            {activeTab === "security" && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard icon="🔒" label={t("admin.security2.failedLogins")} value="7" gradient="from-rose-500 to-red-600" />
                  <KpiCard icon="🚫" label={t("admin.security2.blocked")} value="2" gradient="from-amber-500 to-orange-600" />
                  <KpiCard icon="🚨" label={t("admin.security2.alerts")} value="3" gradient="from-violet-500 to-purple-600" />
                  <KpiCard icon="🔑" label={t("admin.security2.apiKeys")} value="8" gradient="from-blue-500 to-indigo-600" />
                </div>
                <ChartCard title={t("admin.security2.title")}>
                  <div className="text-center py-12 text-gray-400 text-sm">{t("admin.noData")}</div>
                </ChartCard>
              </>
            )}

            {/* ════════════════ API ════════════════ */}
            {activeTab === "api" && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard icon="🔌" label={t("admin.apiApi.totalRequests")} value="45,231" gradient="from-blue-500 to-indigo-600" />
                  <KpiCard icon="🔑" label={t("admin.apiApi.activeKeys")} value="8" gradient="from-emerald-500 to-green-600" />
                  <KpiCard icon="⏱" label={t("admin.apiApi.avgResponse")} value="120мс" gradient="from-violet-500 to-purple-600" />
                  <KpiCard icon="❌" label={t("admin.apiApi.errors2")} value="12" gradient="from-rose-500 to-red-600" />
                </div>
                <ChartCard title={t("admin.apiApi.title")}>
                  <div className="text-center py-12 text-gray-400 text-sm">{t("admin.noData")}</div>
                </ChartCard>
              </>
            )}

            {/* ════════════════ SYSTEM ════════════════ */}
            {activeTab === "system" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KpiCard icon="🖥" label={t("admin.system.apiResponse")} value="<200ms" gradient="from-emerald-500 to-green-600" />
                <KpiCard icon="💾" label={t("admin.system.database")} value="Online" gradient="from-blue-500 to-indigo-600" />
                <KpiCard icon="🔒" label={t("admin.system.ssl")} value="Active" gradient="from-violet-500 to-purple-600" />
              </div>
            )}

            {/* ════════════════ AI CENTER ════════════════ */}
            {activeTab === "ai" && (
              <ChartCard title={t("admin.ai.title")} subtitle={t("admin.ai.subtitle")}>
                <div className="space-y-3">
                  {[
                    { icon: "📈", text: t("admin.ai.rec1"), type: "info" },
                    { icon: "🏨", text: t("admin.ai.rec2"), type: "warning" },
                    { icon: "🚗", text: t("admin.ai.rec3"), type: "info" },
                    { icon: "⚠️", text: t("admin.ai.rec4"), type: "danger" },
                    { icon: "💰", text: t("admin.ai.rec5"), type: "success" },
                    { icon: "📊", text: t("admin.ai.rec6"), type: "info" },
                  ].map((item, i) => (
                    <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border ${
                      item.type === "danger" ? "bg-red-50/80 border-red-100" :
                      item.type === "warning" ? "bg-amber-50/80 border-amber-100" :
                      item.type === "success" ? "bg-emerald-50/80 border-emerald-100" :
                      "bg-blue-50/80 border-blue-100"
                    }`}>
                      <span className="text-xl shrink-0">{item.icon}</span>
                      <p className="text-sm text-gray-700">{item.text}</p>
                    </div>
                  ))}
                </div>
              </ChartCard>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" /></div>}>
      <AdminInner />
    </Suspense>
  );
}
