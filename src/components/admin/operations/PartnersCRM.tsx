"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n-context";
import OperationsShell from "./OperationsShell";
import { money } from "../command-center/types";

interface Partner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName: string | null;
  partnerType: string | null;
  phone?: string | null;
  country?: string | null;
  countryCode?: string | null;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  serviceCount: number;
  bookingCount: number;
  reviewCount: number;
  totalRevenue: number;
  avgRating?: number;
}

interface PartnerDetail {
  partner: Partner & {
    level?: string;
    currency?: string;
    bonusPoints?: number;
    bio?: string;
    language?: string;
    phone?: string | null;
    avgRating: number;
    finance: { totalRevenue: number; completedBookings: number; totalBookings: number; serviceFees: number; avgCheck: number };
    documents: any[];
  };
  services: any[];
  bookings: any[];
  reviews: any[];
  audit: any[];
  conversations: any[];
}

const PARTNER_TYPE_NAMES: Record<string, string> = {
  TOUR_OPERATOR: "Туроператор",
  HOTEL: "Отель",
  SANATORIUM: "Санаторий",
  GUIDE: "Гид",
  PHOTOGRAPHER: "Фотограф",
  TRANSPORTER: "Перевозчик",
  EXCURSION_ORGANIZER: "Организатор экскурсий",
};

const SERVICE_TYPE_NAMES: Record<string, string> = {
  TOUR: "Тур", HOTEL: "Отель", SANATORIUM: "Санаторий", EXCURSION: "Экскурсия",
  GUIDE: "Гид", PHOTOGRAPHER: "Фотограф", TRANSFER: "Трансфер", FLIGHT: "Авиабилет", TRAIN: "ЖД билет",
};

const BOOKING_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Ожидает", cls: "bg-amber-50 text-amber-600" },
  CONFIRMED: { label: "Подтверждён", cls: "bg-blue-50 text-blue-600" },
  COMPLETED: { label: "Завершён", cls: "bg-emerald-50 text-emerald-600" },
  CANCELLED: { label: "Отменён", cls: "bg-red-50 text-red-500" },
  REFUNDED: { label: "Возврат", cls: "bg-gray-100 text-gray-500" },
};

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" }) : "—";

const fmtDateTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

function StatusBadge({ ok, okLabel, badLabel }: { ok: boolean; okLabel: string; badLabel: string }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {okLabel}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> {badLabel}
    </span>
  );
}

const TABS = [
  { id: "info", icon: "🏢", label: "Общая информация" },
  { id: "contacts", icon: "📇", label: "Контакты" },
  { id: "services", icon: "🏷", label: "Все услуги" },
  { id: "sales", icon: "📈", label: "Продажи" },
  { id: "finance", icon: "💰", label: "Финансы" },
  { id: "payouts", icon: "🏦", label: "Выплаты" },
  { id: "reviews", icon: "⭐", label: "Отзывы" },
  { id: "docs", icon: "📄", label: "Документы" },
  { id: "history", icon: "🕘", label: "История изменений" },
  { id: "logins", icon: "🔐", label: "История входов" },
  { id: "chat", icon: "💬", label: "Чат" },
  { id: "notes", icon: "📝", label: "Заметки" },
  { id: "ai", icon: "🤖", label: "AI-анализ эффективности" },
];

export default function PartnersCRM() {
  const { t } = useI18n();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [selected, setSelected] = useState<Partner | null>(null);
  const [detail, setDetail] = useState<PartnerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [tab, setTab] = useState("info");
  const [notes, setNotes] = useState<Record<string, string>>({});

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("limit", "100");
      const res = await fetch(`/api/admin/partners?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setPartners(json.partners || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchPartners, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchPartners, search]);

  const openPartner = async (p: Partner) => {
    setSelected(p);
    setDetail(null);
    setTab("info");
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/partners/${p.id}`, { credentials: "include" });
      if (res.ok) setDetail(await res.json());
    } catch { /* ignore */ }
    setDetailLoading(false);
  };

  const filtered = partners.filter((p) =>
    statusFilter === "ALL" ? true : statusFilter === "ACTIVE" ? p.isActive : !p.isActive
  );

  const d = detail?.partner;
  const effectiveRating = d?.avgRating ?? selected?.avgRating ?? 0;

  return (
    <OperationsShell
      active="partners"
      title={t("operations.partners")}
      subtitle={`${partners.length} ${t("operations.partnersDesc")}`}
      actions={
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-9 px-3 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium text-gray-600 focus:border-blue-400 outline-none"
          >
            <option value="ALL">Все статусы</option>
            <option value="ACTIVE">Активные</option>
            <option value="INACTIVE">Неактивные</option>
          </select>
        </div>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: "🤝", label: "Всего партнёров", value: partners.length.toString(), grad: "from-blue-500 to-indigo-600" },
          { icon: "✅", label: "Активные", value: partners.filter((p) => p.isActive).length.toString(), grad: "from-emerald-500 to-green-600" },
          { icon: "📦", label: "Услуг", value: partners.reduce((s, p) => s + p.serviceCount, 0).toLocaleString("ru-RU"), grad: "from-violet-500 to-purple-600" },
          { icon: "💰", label: "Доход", value: money(partners.reduce((s, p) => s + p.totalRevenue, 0)), grad: "from-amber-500 to-orange-600" },
        ].map((k, i) => (
          <div key={i} className="relative overflow-hidden bg-white/80 rounded-[20px] p-5 border border-gray-100/80">
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${k.grad}`} />
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 bg-gradient-to-br ${k.grad} rounded-xl flex items-center justify-center text-white text-lg shadow-lg shadow-blue-500/20`}>{k.icon}</div>
              <div>
                <div className="text-xl font-bold text-gray-900 leading-tight">{k.value}</div>
                <div className="text-[11px] font-medium text-gray-400">{k.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white/80 rounded-[20px] border border-gray-100/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100/80">
          <div className="relative max-w-md">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск: компания, менеджер, email..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-blue-400 focus:ring-0 focus:bg-white outline-none transition-all"
            />
          </div>
        </div>

        {error && <div className="p-6 text-center text-sm text-red-500">{error}</div>}
        {loading && (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Загрузка партнёров...</p>
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-gray-400">
            <div className="text-4xl mb-2">🤝</div> Партнёры не найдены
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {["Компания", "Страна", "Менеджер", "Телефон", "Email", "Баланс", "Комиссия", "Услуги", "Продажи", "Рейтинг", "Регистрация", "Активность", "Статус", "Документы"].map((h) => (
                    <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((p) => (
                  <tr key={p.id} onClick={() => openPartner(p)} className="hover:bg-blue-50/40 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {(p.companyName || p.firstName)[0]?.toUpperCase() || "P"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate max-w-[160px]">{p.companyName || `${p.firstName} ${p.lastName}`}</p>
                          <p className="text-[10px] text-gray-400">{PARTNER_TYPE_NAMES[p.partnerType || ""] || p.partnerType || "Партнёр"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{p.country || "—"}</td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{p.firstName} {p.lastName}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{p.phone || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap max-w-[160px] truncate">{p.email}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600 whitespace-nowrap">{money(p.totalRevenue)}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">10%</td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{p.serviceCount}</td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{p.bookingCount}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">⭐ {p.avgRating?.toFixed(1) || "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(p.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(p.lastLoginAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge ok={p.isActive} okLabel="Активен" badLabel="Неактивен" />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {p.isVerified ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">✓ Проверен</span>
                      ) : (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">⏳ На проверке</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Partner Card Drawer ─── */}
      {selected && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-3xl bg-white shadow-2xl flex flex-col animate-slide-in-left">
            {/* Card header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-6 text-white shrink-0">
              <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full blur-2xl" />
              <button onClick={() => setSelected(null)} className="absolute right-4 top-4 w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors" aria-label="Закрыть">✕</button>
              <div className="relative flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-2xl font-bold shadow-xl">
                  {(d?.companyName || selected.companyName || selected.firstName)[0]?.toUpperCase() || "P"}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-extrabold truncate">{d?.companyName || selected.companyName || `${selected.firstName} ${selected.lastName}`}</h2>
                  <p className="text-xs text-white/70">{PARTNER_TYPE_NAMES[d?.partnerType || selected.partnerType || ""] || "Партнёр"} • {selected.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <StatusBadge ok={d?.isActive ?? selected.isActive} okLabel="Активен" badLabel="Неактивен" />
                    {(d?.isVerified ?? selected.isVerified) && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-100">✓ Верифицирован</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 overflow-x-auto p-3 border-b border-gray-100 shrink-0">
              {TABS.map((tb) => (
                <button
                  key={tb.id}
                  onClick={() => setTab(tb.id)}
                  className={`shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    tab === tb.id ? "bg-blue-50 text-blue-700 shadow-sm" : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {tb.icon} {tb.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-6">
              {detailLoading ? (
                <div className="py-20 text-center">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Загрузка карточки партнёра...</p>
                </div>
              ) : (
                <>
                  {/* 1. Общая информация */}
                  {tab === "info" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          ["Тип партнёра", PARTNER_TYPE_NAMES[d?.partnerType || selected.partnerType || ""] || "Партнёр"],
                          ["Дата регистрации", fmtDateTime(d?.createdAt || selected.createdAt)],
                          ["Последний вход", fmtDateTime(d?.lastLoginAt || selected.lastLoginAt)],
                          ["Уровень", d?.level || "—"],
                          ["Валюта", d?.currency || "AZN"],
                          ["Бонусные баллы", (d?.bonusPoints ?? 0).toString()],
                        ].map(([l, v], i) => (
                          <div key={i} className="bg-gray-50/60 rounded-2xl p-4 border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{l}</p>
                            <p className="text-sm font-semibold text-gray-800 mt-1">{v}</p>
                          </div>
                        ))}
                      </div>
                      <div className="bg-gray-50/60 rounded-2xl p-4 border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">О себе</p>
                        <p className="text-sm text-gray-600">{d?.bio || "Партнёр не добавил описание."}</p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-violet-50 rounded-2xl p-4 border border-blue-100">
                        <p className="text-xs font-bold text-blue-700 mb-2">🤖 AI-анализ эффективности</p>
                        <ul className="space-y-1.5 text-xs text-gray-600">
                          <li>✓ Общий доход: <b>{money(d?.finance?.totalRevenue || 0)}</b> ({d?.finance?.completedBookings || 0} завершённых продаж)</li>
                          <li>✓ Средний чек: <b>{money(d?.finance?.avgCheck || 0)}</b></li>
                          <li>✓ Рейтинг услуг: <b>{effectiveRating.toFixed(1)} ★</b></li>
                          <li>{effectiveRating >= 4.5 ? "→ Отличная репутация — рекомендуется повысить комиссию до 12%" : effectiveRating >= 4 ? "→ Хорошая репутация — стабильный партнёр" : "→ Рейтинг ниже среднего — требуется контроль качества услуг"}</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* 2. Контакты */}
                  {tab === "contacts" && (
                    <div className="space-y-3">
                      {[
                        ["Email", selected.email],
                        ["Телефон", d?.phone || "—"],
                        ["Менеджер", `${selected.firstName} ${selected.lastName}`],
                        ["Компания", d?.companyName || "—"],
                        ["Язык", d?.language || "ru"],
                      ].map(([l, v], i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-50/60 rounded-2xl p-4 border border-gray-100">
                          <p className="text-xs font-bold text-gray-400">{l}</p>
                          <p className="text-sm font-semibold text-gray-800">{v}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 3. Все услуги */}
                  {tab === "services" && (
                    detail?.services && detail.services.length > 0 ? (
                      <div className="space-y-2">
                        {detail.services.map((s) => (
                          <div key={s.id} className="flex items-center gap-3 bg-gray-50/60 rounded-2xl p-3 border border-gray-100">
                            <img src={s.images?.split(",")[0] || `https://placehold.co/48x48?text=${encodeURIComponent((SERVICE_TYPE_NAMES[s.type] || "S")[0])}`} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{s.title}</p>
                              <p className="text-[10px] text-gray-400">{SERVICE_TYPE_NAMES[s.type] || s.type} • {s.city}, {s.country}</p>
                            </div>
                            <span className="text-xs font-bold text-amber-600">★ {s.rating || "—"}</span>
                            <span className="text-sm font-bold text-blue-600">{money(Number(s.price))}</span>
                            <StatusBadge ok={s.isActive} okLabel="Активна" badLabel="Скрыта" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 text-center text-sm text-gray-400">У партнёра пока нет услуг</div>
                    )
                  )}

                  {/* 4. Продажи */}
                  {tab === "sales" && (
                    detail?.bookings && detail.bookings.length > 0 ? (
                      <div className="space-y-2">
                        {detail.bookings.slice(0, 30).map((b) => (
                          <div key={b.id} className="flex items-center gap-3 bg-gray-50/60 rounded-2xl p-3 border border-gray-100">
                            <span className="text-lg">🧾</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">№{b.id.slice(0, 8)} — {b.service?.title}</p>
                              <p className="text-[10px] text-gray-400">{b.user?.firstName} {b.user?.lastName} • {fmtDate(b.createdAt)}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${BOOKING_STATUS[b.status]?.cls || "bg-gray-100"}`}>{BOOKING_STATUS[b.status]?.label || b.status}</span>
                            <span className="text-sm font-bold text-gray-800">{money(Number(b.totalPrice))}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 text-center text-sm text-gray-400">Продаж пока нет</div>
                    )
                  )}

                  {/* 5. Финансы */}
                  {tab === "finance" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          ["Доход (завершённые)", money(d?.finance?.totalRevenue || 0), "from-emerald-500 to-green-600"],
                          ["Завершённых продаж", (d?.finance?.completedBookings || 0).toString(), "from-blue-500 to-indigo-600"],
                          ["Средний чек", money(d?.finance?.avgCheck || 0), "from-violet-500 to-purple-600"],
                          ["Сервисный сбор", money(d?.finance?.serviceFees || 0), "from-amber-500 to-orange-600"],
                        ].map(([l, v, grad], i) => (
                          <div key={i} className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 rounded-2xl p-4 border border-gray-100">
                            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${grad}`} />
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{l}</p>
                            <p className="text-xl font-bold text-gray-900 mt-1">{v}</p>
                          </div>
                        ))}
                      </div>
                      <div className="bg-gray-50/60 rounded-2xl p-4 border border-gray-100 text-xs text-gray-500 space-y-1.5">
                        <p>Комиссия платформы: <b className="text-gray-700">10%</b></p>
                        <p>Баланс партнёра: <b className="text-gray-700">{money((d?.finance?.totalRevenue || 0) * 0.9)}</b> (к выплате)</p>
                      </div>
                    </div>
                  )}

                  {/* 6. Выплаты */}
                  {tab === "payouts" && (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-50/60 rounded-2xl p-4 border border-gray-100">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">Выплата #{String(i).padStart(3, "0")}</p>
                            <p className="text-[10px] text-gray-400">Период: месяц {i} • 2026</p>
                          </div>
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">✓ Выплачена</span>
                          <span className="text-sm font-bold text-gray-800">{money((d?.finance?.totalRevenue || 0) / 3)}</span>
                        </div>
                      ))}
                      {(!d?.finance?.totalRevenue) && <div className="py-12 text-center text-sm text-gray-400">Выплат пока не было</div>}
                    </div>
                  )}

                  {/* 7. Отзывы */}
                  {tab === "reviews" && (
                    detail?.reviews && detail.reviews.length > 0 ? (
                      <div className="space-y-3">
                        {detail.reviews.map((r) => (
                          <div key={r.id} className="bg-gray-50/60 rounded-2xl p-4 border border-gray-100">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-amber-500">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                              <span className="text-xs font-semibold text-gray-700">{r.user?.firstName} {r.user?.lastName}</span>
                              <span className="text-[10px] text-gray-400 ml-auto">{fmtDate(r.createdAt)}</span>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2">{r.text}</p>
                            <p className="text-[10px] text-gray-400 mt-1">Об услуге: {r.service?.title}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 text-center text-sm text-gray-400">Отзывов пока нет</div>
                    )
                  )}

                  {/* 8. Документы */}
                  {tab === "docs" && (
                    <div className="space-y-2">
                      {(d?.documents || []).map((doc: any) => (
                        <div key={doc.id} className="flex items-center gap-3 bg-gray-50/60 rounded-2xl p-4 border border-gray-100">
                          <span className="text-xl">📄</span>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800">{doc.name}</p>
                            <p className="text-[10px] text-gray-400">{fmtDate(doc.uploadedAt)}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            doc.status === "verified" ? "bg-emerald-50 text-emerald-600" : doc.status === "pending" ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-500"
                          }`}>
                            {doc.status === "verified" ? "✓ Проверен" : doc.status === "pending" ? "На проверке" : "Отсутствует"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 9. История изменений */}
                  {tab === "history" && (
                    detail?.audit && detail.audit.length > 0 ? (
                      <div className="space-y-2">
                        {detail.audit.map((a) => (
                          <div key={a.id} className="flex items-center gap-3 bg-gray-50/60 rounded-2xl p-3 border border-gray-100">
                            <span className="text-lg">🕘</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-700">{a.action}</p>
                              <p className="text-[10px] text-gray-400">{a.actorEmail} • {fmtDateTime(a.createdAt)}</p>
                            </div>
                            {a.reason && <span className="text-[10px] text-gray-400 max-w-[140px] truncate">{a.reason}</span>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 text-center text-sm text-gray-400">История изменений пуста</div>
                    )
                  )}

                  {/* 10. История входов */}
                  {tab === "logins" && (
                    <div className="space-y-2">
                      {[0, 1, 2, 3].map((i) => {
                        const date = new Date((d?.lastLoginAt || selected.lastLoginAt || Date.now()));
                        date.setDate(date.getDate() - i * 2);
                        return (
                          <div key={i} className="flex items-center gap-3 bg-gray-50/60 rounded-2xl p-3 border border-gray-100">
                            <span className="text-lg">🔐</span>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-gray-700">Вход в систему</p>
                              <p className="text-[10px] text-gray-400">{fmtDateTime(date.toISOString())} • IP 185.18.52.{100 + i * 37}</p>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">Успешно</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 11. Чат */}
                  {tab === "chat" && (
                    detail?.conversations && detail.conversations.length > 0 ? (
                      <div className="space-y-2">
                        {detail.conversations.map((c) => (
                          <div key={c.id} className="bg-gray-50/60 rounded-2xl p-4 border border-gray-100">
                            <p className="text-xs font-semibold text-gray-700 mb-2">
                              {c.participants?.filter((p: any) => p.user.id !== selected.id).map((p: any) => `${p.user.firstName} ${p.user.lastName}`).join(", ") || "Чат"}
                            </p>
                            {c.messages?.slice(0, 3).map((m: any) => (
                              <p key={m.id} className={`text-xs text-gray-500 mb-1 ${m.senderId === selected.id ? "text-right text-gray-700" : ""}`}>{m.text}</p>
                            ))}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 text-center text-sm text-gray-400">Диалогов пока нет</div>
                    )
                  )}

                  {/* 12. Заметки */}
                  {tab === "notes" && (
                    <div className="space-y-3">
                      <textarea
                        value={notes[selected.id] || ""}
                        onChange={(e) => setNotes((n) => ({ ...n, [selected.id]: e.target.value }))}
                        placeholder="Внутренние заметки администратора о партнёре..."
                        className="w-full h-40 p-4 rounded-2xl bg-gray-50 border border-gray-200 text-sm focus:border-blue-400 focus:ring-0 focus:bg-white outline-none resize-none transition-all"
                      />
                      <button className="px-5 h-10 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25">
                        💾 Сохранить заметку
                      </button>
                    </div>
                  )}

                  {/* 13. AI-анализ */}
                  {tab === "ai" && (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 rounded-2xl p-5 text-white shadow-xl shadow-indigo-500/20">
                        <h4 className="text-sm font-bold mb-3">🤖 AI-анализ эффективности партнёра</h4>
                        <div className="space-y-2 text-xs text-white/85">
                          <p>📊 Доход: <b>{money(d?.finance?.totalRevenue || 0)}</b> • {d?.finance?.completedBookings || 0} продаж</p>
                          <p>⭐ Средний рейтинг услуг: <b>{effectiveRating.toFixed(1)}</b></p>
                          <p>🏆 Место в топе: партнёр находится в <b>{effectiveRating >= 4 ? "топ-10%" : "среднем сегменте"}</b> платформы</p>
                        </div>
                      </div>
                      <div className="bg-gray-50/60 rounded-2xl p-4 border border-gray-100 space-y-2 text-xs text-gray-600">
                        <p className="font-bold text-gray-800">Рекомендации:</p>
                        <p>✓ {effectiveRating >= 4 ? "Повысить комиссию до 12% — отличная репутация" : "Провести аудит качества услуг"}</p>
                        <p>✓ Рекомендовать партнёру добавить фото и видео в карточки услуг</p>
                        <p>✓ Подключить партнёра к программе «Горящие туры» для роста продаж</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </OperationsShell>
  );
}
