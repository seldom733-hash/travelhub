"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n-context";

/* ── Types ── */
type TabId = "ceo" | "users" | "funnel" | "search" | "services" | "partners" | "finance" | "technical" | "marketing";

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

const TYPE_LABELS: Record<string, string> = {
  TOUR: "🚗 Туры", HOTEL: "🏨 Отели", SANATORIUM: "🏥 Санатории",
  EXCURSION: "🏛 Экскурсии", GUIDE: "🧑‍💼 Гиды", PHOTOGRAPHER: "📸 Фотографы",
  TRANSFER: "🚌 Трансферы", FLIGHT: "✈️ Авиабилеты", TRAIN: "🚆 Поезда",
};


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
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const tab = (searchParams.get("tab") as TabId) || "ceo";
    const valid: TabId[] = ["ceo", "users", "funnel", "search", "services", "partners", "finance", "technical", "marketing"];
    return valid.includes(tab) ? tab : "ceo";
  });

  const [data, setData] = useState<ExtendedAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh polling
  useEffect(() => {
    if (isAutoRefresh) {
      intervalRef.current = setInterval(() => fetchData(true), 30000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAutoRefresh, fetchData]);

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Загрузка аналитики...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🛡</div>
          <h2 className="text-xl font-bold text-secondary mb-2">Ошибка загрузки</h2>
          <p className="text-gray-500">{error || "Нет данных"}</p>
          <button onClick={() => { setError(null); setIsLoading(true); fetchData(); }} className="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-sm hover:bg-primary-dark transition-colors">
            Попробовать снова
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
  const sidebar: { icon: string; label: string; id: TabId }[] = [
    { icon: "📊", label: "CEO Dashboard", id: "ceo" },
    { icon: "👥", label: "Пользователи", id: "users" },
    { icon: "🔽", label: "Воронка продаж", id: "funnel" },
    { icon: "🔍", label: "Поиск", id: "search" },
    { icon: "📦", label: "Услуги", id: "services" },
    { icon: "🤝", label: "Партнёры", id: "partners" },
    { icon: "💰", label: "Финансы", id: "finance" },
    { icon: "⚙️", label: "Техническая", id: "technical" },
    { icon: "📣", label: "Маркетинг", id: "marketing" },
  ];

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-secondary to-gray-800 rounded-3xl shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center text-3xl">🛡</div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Admin Dashboard — Полная аналитика</h1>
              <p className="text-white/70">TravelHUB Travel Holiday Unified Booking Platform</p>
              {lastUpdated && (
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5 text-xs text-white/50">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${isRefreshing ? "bg-green-400 animate-pulse" : "bg-green-400"}`} />
                    {isRefreshing ? "Обновление..." : `Обновлено: ${lastUpdated.toLocaleTimeString("ru-RU")}`}
                  </div>
                  <button
                    onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-all ${isAutoRefresh ? "bg-green-500/20 text-green-300 hover:bg-green-500/30" : "bg-white/10 text-white/50 hover:bg-white/20"}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isAutoRefresh ? "bg-green-400 animate-pulse" : "bg-gray-400"}`} />
                    {isAutoRefresh ? "Авто-обновление: ВКЛ" : "Авто-обновление: ВЫКЛ"}
                  </button>
                  {!isAutoRefresh && (
                    <button
                      onClick={() => fetchData(true)}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-all"
                    >
                      🔄 Обновить
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
                    <span className="flex-1 text-left">{item.label}</span>
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
                <Section title="📊 CEO Dashboard — Сегодня" icon="">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    <KpiCard icon="💰" label="Продажи" value={money(ceo.today.sales)} color="bg-green-50 text-green-600" />
                    <KpiCard icon="🛒" label="Бронирований" value={String(ceo.today.bookings)} color="bg-blue-50 text-blue-600" />
                    <KpiCard icon="🏦" label="Комиссия" value={money(ceo.today.commission)} color="bg-primary/10 text-primary" />
                    <KpiCard icon="👤" label="Новые юзеры" value={String(ceo.today.newUsers)} color="bg-purple-50 text-purple-600" />
                    <KpiCard icon="🤝" label="Новые партнёры" value={String(ceo.today.newPartners)} color="bg-amber-50 text-amber-600" />
                    <KpiCard icon="❌" label="Отмены" value={String(ceo.today.cancellations)} color="bg-red-50 text-red-600" />
                    <KpiCard icon="📈" label="Средний чек" value={money(ceo.totals.avgCheck)} color="bg-indigo-50 text-indigo-600" />
                  </div>
                </Section>

                {/* Totals */}
                <Card title="📋 Итого">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { label: "Оборот (GMV)", value: money(ceo.totals.gmv) },
                      { label: "Доход платформы", value: money(ceo.totals.platformRevenue) },
                      { label: "Бронирований", value: String(ceo.totals.bookings) },
                      { label: "Пользователей", value: fmt(ceo.totals.users) },
                      { label: "Партнёров", value: String(ceo.totals.partners) },
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
                  <Card title="📅 За неделю">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Бронирований:</span><span className="font-bold">{ceo.trends.weekBookings}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Доход:</span><span className="font-bold text-green-600">{money(ceo.trends.weekRevenue)}</span></div>
                    </div>
                  </Card>
                  <Card title="📅 За месяц">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Бронирований:</span><span className="font-bold">{ceo.trends.monthBookings}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Доход:</span><span className="font-bold text-green-600">{money(ceo.trends.monthRevenue)}</span></div>
                    </div>
                  </Card>
                </div>

                {/* Bookings by day */}
                {ceo.bookingsByDay.length > 0 && (
                  <Card title="📈 Бронирования по дням (30 дней)">
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
                <Section title="👥 Аналитика пользователей" icon="">
                  <div className="grid grid-cols-3 gap-4">
                    <KpiCard icon="📱" label="DAU (сегодня)" value={String(usr.dau)} color="bg-blue-50 text-blue-600" />
                    <KpiCard icon="📅" label="WAU (неделя)" value={String(usr.wau)} color="bg-purple-50 text-purple-600" />
                    <KpiCard icon="📊" label="MAU (месяц)" value={String(usr.mau)} color="bg-primary/10 text-primary" />
                  </div>
                </Section>

                <Card title="📊 Пользователи по ролям">
                  <BarChart
                    data={usr.byRole.map(r => ({ label: r.role, value: r.count }))}
                    maxVal={Math.max(...usr.byRole.map(r => r.count), 1)}
                    colorClass="bg-blue-500"
                  />
                </Card>

                {usr.newByDay.length > 0 && (
                  <Card title="📈 Новые пользователи (30 дней)">
                    <MiniBarChart
                      items={usr.newByDay.slice().reverse().map(d => ({ label: d.date.slice(5), value: d.count, color: "bg-green-500 hover:bg-green-600" }))}
                      maxVal={Math.max(...usr.newByDay.map(d => d.count), 1)}
                    />
                  </Card>
                )}

                <Card title="🔄 Повторные покупки">
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Купили 1 раз", value: usr.repeatPurchases.once, color: "bg-blue-500" },
                      { label: "2 раза", value: usr.repeatPurchases.twice, color: "bg-primary" },
                      { label: "3+ раза", value: usr.repeatPurchases.threePlus, color: "bg-green-500" },
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
              <Section title="🔽 Воронка продаж" icon="">
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
                  <Card title="📊 Конверсия по этапам">
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
                <Section title="🔍 Аналитика поиска" icon="">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card title="🏆 Топ запросов">
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
                      ) : <p className="text-gray-400 text-sm text-center py-8">Нет данных о поисковых запросах</p>}
                    </Card>
                    <Card title="⚠️ Поиски без результатов">
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
                      ) : <p className="text-gray-400 text-sm text-center py-8">Все запросы дают результаты ✓</p>}
                    </Card>
                  </div>
                </Section>
                {sch.byDay.length > 0 && (
                  <Card title="📈 Поисковые запросы по дням (30 дней)">
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
                <Section title="📦 Аналитика по типам услуг" icon="">
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {svc.map(s => (
                      <div key={s.type} className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="text-sm font-medium text-gray-700 mb-2">{TYPE_LABELS[s.type] || s.type}</div>
                        <div className="space-y-1 text-xs text-gray-500">
                          <div className="flex justify-between"><span>Услуг:</span><span className="font-bold text-secondary">{s.count}</span></div>
                          <div className="flex justify-between"><span>Ср. цена:</span><span className="font-bold text-secondary">{money(s.avgPrice)}</span></div>
                          <div className="flex justify-between"><span>Заказов:</span><span className="font-bold text-secondary">{s.totalBookings}</span></div>
                          <div className="flex justify-between"><span>Доход:</span><span className="font-bold text-green-600">{money(s.revenue)}</span></div>
                          <div className="flex justify-between"><span>Конверсия:</span><span className="font-bold text-primary">{s.conversion}%</span></div>
                          <div className="flex justify-between"><span>Рейтинг:</span><span className="font-bold text-amber-500">⭐ {s.avgRating}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>

                <Card title="📊 Доход по типам">
                  <BarChart
                    data={svc.map(s => ({ label: TYPE_LABELS[s.type] || s.type, value: s.revenue }))}
                    maxVal={Math.max(...svc.map(s => s.revenue), 1)}
                    colorClass="bg-green-500"
                  />
                </Card>

                <Card title="👁 Топ просматриваемых услуг">
                  {svc.flatMap(s => s.topViewed).sort((a, b) => b.views - a.views).slice(0, 10).length > 0 ? (
                    <div className="space-y-2">
                      {svc.flatMap(s => s.topViewed.map(tv => ({ ...tv, type: s.type }))).sort((a, b) => b.views - a.views).slice(0, 10).map((sv, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                          <span className="text-sm font-bold text-gray-400 w-6 text-center">{i + 1}</span>
                          <span className="text-xs text-gray-400 shrink-0">{TYPE_LABELS[sv.type] || sv.type}</span>
                          <a href={`/services/${sv.id}`} className="flex-1 text-sm font-medium text-secondary hover:text-primary truncate" target="_blank" rel="noopener noreferrer">{sv.title}</a>
                          <span className="text-sm font-bold text-primary">{sv.views} 👁</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-gray-400 text-sm text-center py-8">Нет данных о просмотрах</p>}
                </Card>
              </>
            )}

            {/* ══════════ PARTNERS ══════════ */}
            {activeTab === "partners" && prt && (
              <>
                <Section title="🤝 Аналитика партнёров" icon="">
                  <KpiCard icon="🤝" label="Всего партнёров" value={String(prt.total)} color="bg-primary/10 text-primary" />
                </Section>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">                    {[
                    { title: "🏆 Топ по доходу", data: prt.topByRevenue, render: (p: typeof prt.topByRevenue[0]) => money(p.revenue) },
                    { title: "🛒 Топ по заказам", data: prt.topByBookings, render: (p: typeof prt.topByBookings[0]) => String(p.completedBookings) },
                    { title: "⭐ Топ по рейтингу", data: prt.topByRating, render: (p: typeof prt.topByRating[0]) => "⭐ " + p.avgRating },
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
                      ) : <p className="text-gray-400 text-sm text-center py-8">Нет данных</p>}
                    </Card>
                  ))}
                </div>
              </>
            )}

            {/* ══════════ FINANCE ══════════ */}
            {activeTab === "finance" && fin && (
              <>
                <Section title="💰 Финансовая аналитика" icon="">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard icon="💰" label="Оборот (GMV)" value={money(fin.gmv)} color="bg-green-50 text-green-600" />
                    <KpiCard icon="🏦" label="Доход платформы" value={money(fin.platformRevenue)} color="bg-primary/10 text-primary" />
                    <KpiCard icon="↩️" label="Возвраты" value={money(fin.refunds)} color="bg-red-50 text-red-600" />
                    <KpiCard icon="⏳" label="Ожидают оплаты" value={String(fin.pendingPayments)} color="bg-amber-50 text-amber-600" />
                  </div>
                </Section>

                <Card title="📊 Доход по типам услуг">
                  {fin.revenueByType.length > 0 ? (
                    <BarChart
                      data={fin.revenueByType.map(r => ({ label: TYPE_LABELS[r.type] || r.type, value: r.revenue }))}
                      maxVal={Math.max(...fin.revenueByType.map(r => r.revenue), 1)}
                      colorClass="bg-green-500"
                    />
                  ) : <p className="text-gray-400 text-sm text-center py-8">Нет завершённых заказов</p>}
                </Card>

                {fin.revenueByType.length > 0 && (
                  <Card title="📋 Детали по типам">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-3">Тип</th>
                            <th className="text-right text-xs font-semibold text-gray-500 uppercase pb-3">Доход</th>
                            <th className="text-right text-xs font-semibold text-gray-500 uppercase pb-3">Комиссия</th>
                            <th className="text-right text-xs font-semibold text-gray-500 uppercase pb-3">Заказов</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {fin.revenueByType.map(r => (
                            <tr key={r.type} className="hover:bg-gray-50">
                              <td className="py-3 text-sm font-medium">{TYPE_LABELS[r.type] || r.type}</td>
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
                  <Card title="📈 Доход по дням (30 дней)">
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
                <Section title="⚙️ Техническая аналитика" icon="">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <KpiCard icon="👁" label="Всего просмотров" value={fmt(tech.totalViews)} color="bg-blue-50 text-blue-600" />
                    <KpiCard icon="📅" label="Сегодня просмотров" value={fmt(tech.todayViews)} color="bg-green-50 text-green-600" />
                    <KpiCard icon="⏱" label="Ср. время на странице" value={tech.avgDuration + "с"} color="bg-primary/10 text-primary" />
                  </div>
                </Section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card title="📱 Устройства">
                    {tech.devices.length > 0 ? (
                      <BarChart
                        data={tech.devices.map(d => ({ label: d.device, value: d.count }))}
                        maxVal={Math.max(...tech.devices.map(d => d.count), 1)}
                        colorClass="bg-indigo-500"
                      />
                    ) : <p className="text-gray-400 text-sm text-center py-8">Нет данных</p>}
                  </Card>
                  <Card title="🌐 Топ страниц">
                    {tech.topPages.length > 0 ? (
                      <BarChart
                        data={tech.topPages.slice(0, 8).map(p => ({ label: p.path, value: p.count }))}
                        maxVal={Math.max(...tech.topPages.slice(0, 8).map(p => p.count), 1)}
                        colorClass="bg-purple-500"
                      />
                    ) : <p className="text-gray-400 text-sm text-center py-8">Нет данных</p>}
                  </Card>
                </div>
              </>
            )}
            {/* ══════════ MARKETING ══════════ */}
            {activeTab === "marketing" && mkt && (
              <>
                <Section title="📣 Маркетинговая аналитика" icon="">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard icon="💰" label="Расходы" value={money(mkt.totals.cost)} color="bg-red-50 text-red-600" />
                    <KpiCard icon="💵" label="Доход от рекламы" value={money(mkt.totals.revenue)} color="bg-green-50 text-green-600" />
                    <KpiCard icon="📈" label="ROI" value={mkt.totals.roi + "%"} color={mkt.totals.roi >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"} />
                    <KpiCard icon="🎯" label="CAC (стоимость привлечения)" value={money(mkt.totals.cac)} color="bg-primary/10 text-primary" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KpiCard icon="👁" label="Визиты" value={fmt(mkt.totals.totalVisits)} color="bg-blue-50 text-blue-600" />
                    <KpiCard icon="🛒" label="Бронирования" value={String(mkt.totals.totalBookings)} color="bg-purple-50 text-purple-600" />
                    <KpiCard icon="🔄" label="Конверсия" value={mkt.totals.convRate + "%"} color="bg-amber-50 text-amber-600" />
                    <KpiCard icon="💵" label="Прибыль" value={money(mkt.totals.profit)} color={mkt.totals.profit >= 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"} />
                  </div>
                </Section>

                <Card title="📊 Доход по каналам">
                  <BarChart
                    data={mkt.channels.map(c => ({ label: c.channel, value: c.revenue }))}
                    maxVal={Math.max(...mkt.channels.map(c => c.revenue), 1)}
                    colorClass="bg-green-500"
                  />
                </Card>

                <Card title="📱 Каналы привлечения">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-3">Канал</th>
                          <th className="text-right text-xs font-semibold text-gray-500 uppercase pb-3">Визиты</th>
                          <th className="text-right text-xs font-semibold text-gray-500 uppercase pb-3">Заказы</th>
                          <th className="text-right text-xs font-semibold text-gray-500 uppercase pb-3">Доход</th>
                          <th className="text-right text-xs font-semibold text-gray-500 uppercase pb-3">Расходы</th>
                          <th className="text-right text-xs font-semibold text-gray-500 uppercase pb-3">ROI</th>
                          <th className="text-right text-xs font-semibold text-gray-500 uppercase pb-3">CAC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {mkt.channels.map(c => (
                          <tr key={c.channel} className="hover:bg-gray-50">
                            <td className="py-3 text-sm font-medium capitalize">{c.channel}</td>
                            <td className="py-3 text-sm text-right">{fmt(c.visits)}</td>
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
                  <Card title="🎯 Кампании">
                    <div className="space-y-2">
                      {mkt.campaigns.slice(0, 10).map((c, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                          <span className="text-sm font-bold text-gray-400 w-6 text-center">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-secondary truncate">{c.name}</div>
                            <div className="text-xs text-gray-400">{c.channel} • {c.visits} визитов • {c.bookings} заказов</div>
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
                  <Card title="🔗 UTM-источники">
                    {mkt.utmSources.length > 0 ? (
                      <BarChart
                        data={mkt.utmSources.map(u => ({ label: u.source, value: u.revenue }))}
                        maxVal={Math.max(...mkt.utmSources.map(u => u.revenue), 1)}
                        colorClass="bg-indigo-500"
                      />
                    ) : <p className="text-gray-400 text-sm text-center py-8">Нет данных</p>}
                  </Card>
                  <Card title="📈 Доход от рекламы по дням">
                    {mkt.eventsByDay.length > 0 ? (
                      <MiniBarChart
                        items={mkt.eventsByDay.slice().reverse().map(d => ({ label: d.date.slice(5), value: Math.round(d.revenue), color: "bg-green-500 hover:bg-green-600" }))}
                        maxVal={Math.max(...mkt.eventsByDay.map(d => d.revenue), 1)}
                      />
                    ) : <p className="text-gray-400 text-sm text-center py-8">Нет данных</p>}
                  </Card>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
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
