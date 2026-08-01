"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n-context";
import OperationsShell from "./OperationsShell";
import { money } from "../command-center/types";

interface UserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  bonusPoints: number;
  createdAt: string;
  lastLoginAt: string | null;
  bookingsCount: number;
  reviewsCount: number;
  servicesCount: number;
  favoritesCount?: number;
  spent?: number;
  phone?: string | null;
}

interface UserDetail {
  user: any;
  bookings: any[];
  payments: any[];
  reviews: any[];
  favorites: any[];
  cancellations: any[];
  audit: any[];
  activities: any[];
  conversations: any[];
  stats: { bookingsCount: number; spent: number; completedCount: number };
}

const ROLE_NAMES: Record<string, string> = {
  BUYER: "Покупатель", PARTNER: "Партнёр", MODERATOR: "Модератор", ADMIN: "Администратор",
};

const BOOKING_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Ожидает", cls: "bg-amber-50 text-amber-600" },
  CONFIRMED: { label: "Подтверждён", cls: "bg-blue-50 text-blue-600" },
  COMPLETED: { label: "Завершён", cls: "bg-emerald-50 text-emerald-600" },
  CANCELLED: { label: "Отменён", cls: "bg-red-50 text-red-500" },
  REFUNDED: { label: "Возврат", cls: "bg-gray-100 text-gray-500" },
};

const PAYMENT_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Ожидает", cls: "bg-amber-50 text-amber-600" },
  COMPLETED: { label: "Оплачен", cls: "bg-emerald-50 text-emerald-600" },
  FAILED: { label: "Ошибка", cls: "bg-red-50 text-red-500" },
  REFUNDED: { label: "Возврат", cls: "bg-gray-100 text-gray-500" },
};

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" }) : "—";

const fmtDateTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

const TABS = [
  { id: "overview", icon: "👤", label: "Обзор" },
  { id: "bookings", icon: "🧾", label: "Все бронирования" },
  { id: "payments", icon: "💳", label: "Все платежи" },
  { id: "reviews", icon: "⭐", label: "Отзывы" },
  { id: "favorites", icon: "❤️", label: "Избранное" },
  { id: "chat", icon: "💬", label: "Чат" },
  { id: "history", icon: "🕘", label: "История" },
  { id: "docs", icon: "📄", label: "Документы" },
  { id: "refunds", icon: "↩️", label: "Возвраты" },
  { id: "complaints", icon: "⚠️", label: "Жалобы" },
  { id: "ai", icon: "🤖", label: "AI-оценка клиента" },
];

export default function UsersCRM() {
  const { t } = useI18n();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [tab, setTab] = useState("overview");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter.toLowerCase());
      params.set("limit", "100");
      const res = await fetch(`/api/admin/users?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setUsers(json.users || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchUsers, search]);

  const openUser = async (u: UserRow) => {
    setSelected(u);
    setDetail(null);
    setTab("overview");
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, { credentials: "include" });
      if (res.ok) setDetail(await res.json());
    } catch { /* ignore */ }
    setDetailLoading(false);
  };

  const d = detail?.user;

  return (
    <OperationsShell
      active="users"
      title={t("operations.users")}
      subtitle={`${users.length} ${t("operations.usersDesc")}`}
      actions={
        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 px-3 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium text-gray-600 focus:border-blue-400 outline-none"
          >
            <option value="ALL">Все роли</option>
            <option value="BUYER">Покупатели</option>
            <option value="PARTNER">Партнёры</option>
            <option value="MODERATOR">Модераторы</option>
            <option value="ADMIN">Администраторы</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium text-gray-600 focus:border-blue-400 outline-none"
          >
            <option value="ALL">Все статусы</option>
            <option value="active">Активные</option>
            <option value="banned">Заблокированные</option>
          </select>
        </div>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: "👥", label: "Всего пользователей", value: users.length.toString(), grad: "from-blue-500 to-indigo-600" },
          { icon: "👤", label: "Покупателей", value: users.filter((u) => u.role === "BUYER").length.toString(), grad: "from-emerald-500 to-green-600" },
          { icon: "🧾", label: "Бронирований", value: users.reduce((s, u) => s + u.bookingsCount, 0).toLocaleString("ru-RU"), grad: "from-violet-500 to-purple-600" },
          { icon: "🎁", label: "Бонусов выдано", value: users.reduce((s, u) => s + u.bonusPoints, 0).toLocaleString("ru-RU"), grad: "from-amber-500 to-orange-600" },
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
              placeholder="Поиск: имя, email..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-blue-400 focus:ring-0 focus:bg-white outline-none transition-all"
            />
          </div>
        </div>

        {error && <div className="p-6 text-center text-sm text-red-500">{error}</div>}
        {loading && (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Загрузка пользователей...</p>
          </div>
        )}
        {!loading && users.length === 0 && (
          <div className="py-16 text-center text-sm text-gray-400">
            <div className="text-4xl mb-2">👥</div> Пользователи не найдены
          </div>
        )}
        {!loading && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {["Имя", "Email", "Телефон", "Страна", "Последний вход", "Заказы", "Потрачено", "Избранное", "Статус", "Бонусы"].map((h) => (
                    <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u.id} onClick={() => openUser(u)} className="hover:bg-blue-50/40 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {u.firstName[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 whitespace-nowrap">{u.firstName} {u.lastName}</p>
                          <p className="text-[10px] text-gray-400">{ROLE_NAMES[u.role] || u.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[170px] truncate">{u.email}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{u.phone || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">—</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(u.lastLoginAt)}</td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{u.bookingsCount}</td>
                    <td className="px-4 py-3 font-bold text-emerald-600 whitespace-nowrap">{u.spent ? money(u.spent) : "—"}</td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{u.favoritesCount ?? "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Активен
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Заблокирован
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-violet-600">🎁 {u.bonusPoints}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── User Card Drawer ─── */}
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
                  {selected.firstName[0]?.toUpperCase() || "U"}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-extrabold truncate">{selected.firstName} {selected.lastName}</h2>
                  <p className="text-xs text-white/70">{ROLE_NAMES[selected.role] || selected.role} • {selected.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-100">✓ Активен</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-white">🎁 {selected.bonusPoints} баллов</span>
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
                  <p className="text-sm text-gray-500">Загрузка карточки пользователя...</p>
                </div>
              ) : (
                <>
                  {/* Обзор */}
                  {tab === "overview" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          ["Регистрация", fmtDateTime(d?.createdAt || selected.createdAt)],
                          ["Последний вход", fmtDateTime(d?.lastLoginAt || selected.lastLoginAt)],
                          ["Уровень", d?.level || "—"],
                          ["Валюта", d?.currency || "AZN"],
                          ["Бронирований", (detail?.stats?.bookingsCount ?? selected.bookingsCount).toString()],
                          ["Потрачено", money(detail?.stats?.spent || 0)],
                        ].map(([l, v], i) => (
                          <div key={i} className="bg-gray-50/60 rounded-2xl p-4 border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{l}</p>
                            <p className="text-sm font-semibold text-gray-800 mt-1">{v}</p>
                          </div>
                        ))}
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-violet-50 rounded-2xl p-4 border border-blue-100">
                        <p className="text-xs font-bold text-blue-700 mb-2">🤖 AI-оценка клиента</p>
                        <ul className="space-y-1.5 text-xs text-gray-600">
                          <li>✓ Активность: <b>{selected.bookingsCount} бронирований</b>, {selected.reviewsCount} отзывов</li>
                          <li>✓ Лояльность: <b>{selected.bonusPoints} бонусных баллов</b></li>
                          <li>{selected.bookingsCount >= 3 ? "→ Постоянный клиент — подключить к программе PREMIUM" : "→ Новый клиент — предложить приветственный бонус"}</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Все бронирования */}
                  {tab === "bookings" && (
                    detail?.bookings && detail.bookings.length > 0 ? (
                      <div className="space-y-2">
                        {detail.bookings.map((b) => (
                          <div key={b.id} className="flex items-center gap-3 bg-gray-50/60 rounded-2xl p-3 border border-gray-100">
                            <span className="text-lg">🧾</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{b.service?.title}</p>
                              <p className="text-[10px] text-gray-400">№{b.id.slice(0, 8)} • {fmtDate(b.createdAt)} • {b.service?.city}, {b.service?.country}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${BOOKING_STATUS[b.status]?.cls || "bg-gray-100"}`}>{BOOKING_STATUS[b.status]?.label || b.status}</span>
                            <span className="text-sm font-bold text-gray-800">{money(Number(b.totalPrice))}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 text-center text-sm text-gray-400">Бронирований пока нет</div>
                    )
                  )}

                  {/* Все платежи */}
                  {tab === "payments" && (
                    detail?.payments && detail.payments.length > 0 ? (
                      <div className="space-y-2">
                        {detail.payments.map((p) => (
                          <div key={p.id} className="flex items-center gap-3 bg-gray-50/60 rounded-2xl p-3 border border-gray-100">
                            <span className="text-lg">💳</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800">Платёж №{p.id.slice(0, 8)}</p>
                              <p className="text-[10px] text-gray-400">{p.method} • {fmtDateTime(p.createdAt)}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PAYMENT_STATUS[p.status]?.cls || "bg-gray-100"}`}>{PAYMENT_STATUS[p.status]?.label || p.status}</span>
                            <span className="text-sm font-bold text-gray-800">{money(Number(p.amount))}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 text-center text-sm text-gray-400">Платежей пока нет</div>
                    )
                  )}

                  {/* Отзывы */}
                  {tab === "reviews" && (
                    detail?.reviews && detail.reviews.length > 0 ? (
                      <div className="space-y-3">
                        {detail.reviews.map((r) => (
                          <div key={r.id} className="bg-gray-50/60 rounded-2xl p-4 border border-gray-100">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-amber-500">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                              <span className="text-xs font-semibold text-gray-700">{r.service?.title}</span>
                              <span className="text-[10px] text-gray-400 ml-auto">{fmtDate(r.createdAt)}</span>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2">{r.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 text-center text-sm text-gray-400">Отзывов пока нет</div>
                    )
                  )}

                  {/* Избранное */}
                  {tab === "favorites" && (
                    detail?.favorites && detail.favorites.length > 0 ? (
                      <div className="space-y-2">
                        {detail.favorites.map((f) => (
                          <div key={f.id} className="flex items-center gap-3 bg-gray-50/60 rounded-2xl p-3 border border-gray-100">
                            <img src={f.service?.images?.split(",")[0] || `https://placehold.co/48x48`} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{f.service?.title}</p>
                              <p className="text-[10px] text-gray-400">{f.service?.city}, {f.service?.country}</p>
                            </div>
                            <span className="text-sm font-bold text-blue-600">{money(Number(f.service?.price || 0))}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 text-center text-sm text-gray-400">Нет избранного</div>
                    )
                  )}

                  {/* Чат */}
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

                  {/* История */}
                  {tab === "history" && (
                    detail?.activities && detail.activities.length > 0 ? (
                      <div className="space-y-2">
                        {detail.activities.map((a) => (
                          <div key={a.id} className="flex items-center gap-3 bg-gray-50/60 rounded-2xl p-3 border border-gray-100">
                            <span className="text-lg">🕘</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-700">{a.action}</p>
                              <p className="text-[10px] text-gray-400">{fmtDateTime(a.createdAt)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 text-center text-sm text-gray-400">История активности пуста</div>
                    )
                  )}

                  {/* Документы */}
                  {tab === "docs" && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 bg-gray-50/60 rounded-2xl p-4 border border-gray-100">
                        <span className="text-xl">🪪</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800">Паспорт / удостоверение личности</p>
                          <p className="text-[10px] text-gray-400">Загружен: {fmtDate(selected.createdAt)}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">✓ Проверен</span>
                      </div>
                      {selected.role === "PARTNER" && (
                        <div className="flex items-center gap-3 bg-gray-50/60 rounded-2xl p-4 border border-gray-100">
                          <span className="text-xl">📄</span>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800">Свидетельство о регистрации</p>
                            <p className="text-[10px] text-gray-400">Загружен: {fmtDate(selected.createdAt)}</p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">На проверке</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Возвраты */}
                  {tab === "refunds" && (
                    detail?.cancellations && detail.cancellations.length > 0 ? (
                      <div className="space-y-2">
                        {detail.cancellations.map((c) => (
                          <div key={c.id} className="flex items-center gap-3 bg-gray-50/60 rounded-2xl p-3 border border-gray-100">
                            <span className="text-lg">↩️</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{c.booking?.service?.title || "Бронирование"}</p>
                              <p className="text-[10px] text-gray-400">{c.reason} • {fmtDate(c.createdAt)}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status === "APPROVED" || c.status === "PROCESSED" ? "bg-emerald-50 text-emerald-600" : c.status === "PENDING" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500"}`}>{c.status}</span>
                            <span className="text-sm font-bold text-red-500">{money(Number(c.refundAmount))}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-16 text-center text-sm text-gray-400">Возвратов не было</div>
                    )
                  )}

                  {/* Жалобы */}
                  {tab === "complaints" && (
                    <div className="space-y-3">
                      <div className="bg-gray-50/60 rounded-2xl p-4 border border-gray-100 text-xs text-gray-500">
                        Жалоб на пользователя пока нет. Здесь будут отображаться обращения из поддержки и модерации.
                      </div>
                    </div>
                  )}

                  {/* AI-оценка клиента */}
                  {tab === "ai" && (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 rounded-2xl p-5 text-white shadow-xl shadow-indigo-500/20">
                        <h4 className="text-sm font-bold mb-3">🤖 AI-оценка клиента</h4>
                        <div className="space-y-2 text-xs text-white/85">
                          <p>📊 Потрачено: <b>{money(detail?.stats?.spent || 0)}</b> • {detail?.stats?.completedCount || 0} завершённых заказов</p>
                          <p>⭐ Отзывов оставлено: <b>{selected.reviewsCount}</b></p>
                          <p>🏆 Сегмент: <b>{(detail?.stats?.bookingsCount ?? 0) >= 5 ? "VIP-клиент" : (detail?.stats?.bookingsCount ?? 0) >= 2 ? "Постоянный клиент" : "Новый клиент"}</b></p>
                        </div>
                      </div>
                      <div className="bg-gray-50/60 rounded-2xl p-4 border border-gray-100 space-y-2 text-xs text-gray-600">
                        <p className="font-bold text-gray-800">Рекомендации:</p>
                        <p>✓ {(detail?.stats?.bookingsCount ?? 0) >= 5 ? "Предложить персонального менеджера и расширенный кешбэк" : "Отправить персональное промо на следующий заказ"}</p>
                        <p>✓ Напомнить о бронированиях и предложить доп. услуги (трансфер, экскурсии)</p>
                        <p>✓ Отметить в программе лояльности — начислено {selected.bonusPoints} баллов</p>
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
