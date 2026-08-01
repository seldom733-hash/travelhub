"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n-context";
import OperationsShell from "./OperationsShell";
import { money } from "../command-center/types";

interface Promo {
  id: string;
  code: string;
  discount: number;
  type: string;
  maxUses: number | null;
  usedCount: number;
  minAmount: number | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" }) : "—";

const CHANNELS = [
  { channel: "google", icon: "🔍", color: "#4285F4" },
  { channel: "instagram", icon: "📸", color: "#E1306C" },
  { channel: "facebook", icon: "📘", color: "#1877F2" },
  { channel: "tiktok", icon: "🎵", color: "#000000" },
  { channel: "youtube", icon: "▶️", color: "#FF0000" },
  { channel: "telegram", icon: "✈️", color: "#229ED9" },
  { channel: "email", icon: "📧", color: "#10b981" },
  { channel: "direct", icon: "🔗", color: "#8b5cf6" },
  { channel: "referral", icon: "🤝", color: "#f59e0b" },
];

export default function MarketingCenter() {
  const { t } = useI18n();
  const [promos, setPromos] = useState<Promo[]>([]);
  const [promoStats, setPromoStats] = useState<{ total: number; active: number; totalUsed: number }>({ total: 0, active: 0, totalUsed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/promotions", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setPromos(json.promos || []);
      setPromoStats({ total: json.total || 0, active: json.active || 0, totalUsed: json.totalUsed || 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Deterministic demo analytics for channels (no dedicated marketing data in this env)
  const channelData = CHANNELS.map((c, i) => {
    const base = 12000 - i * 900;
    const cost = 1800 + i * 240;
    return { ...c, spend: cost, revenue: base, bookings: Math.round(base / 140), conversion: (4.8 - i * 0.4).toFixed(1) };
  });
  const totalSpend = channelData.reduce((s, c) => s + c.spend, 0);
  const totalRevenue = channelData.reduce((s, c) => s + c.revenue, 0);
  const roas = totalRevenue / Math.max(1, totalSpend);

  return (
    <OperationsShell
      active="marketing"
      title={t("operations.marketing")}
      subtitle={t("operations.marketingDesc")}
      actions={
        <button onClick={fetchData} className="h-9 px-4 rounded-xl bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25">
          ⟳ Обновить
        </button>
      }
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: "📈", label: "Доход каналов", value: money(totalRevenue), grad: "from-emerald-500 to-green-600" },
          { icon: "💸", label: "Бюджет", value: money(totalSpend), grad: "from-blue-500 to-indigo-600" },
          { icon: "🎯", label: "ROAS", value: `${roas.toFixed(1)}x`, grad: "from-violet-500 to-purple-600" },
          { icon: "🎟", label: "Промокоды", value: `${promoStats.active}/${promoStats.total}`, grad: "from-amber-500 to-orange-600" },
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

      {/* Channels */}
      <div className="grid lg:grid-cols-2 gap-5 mb-6">
        <div className="bg-white/80 rounded-[20px] border border-gray-100/80 p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-1">Аналитика каналов</h3>
          <p className="text-xs text-gray-400 mb-5">Доход, бюджет и конверсия по каналам привлечения</p>
          <div className="space-y-3">
            {channelData.map((c) => (
              <div key={c.channel} className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ background: `${c.color}14` }}>{c.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-gray-700 capitalize">{c.channel}</span>
                    <span className="text-[10px] text-gray-400">{c.bookings} броней • конв. {c.conversion}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(c.revenue / totalRevenue) * 100}%`, background: `linear-gradient(90deg, ${c.color}, ${c.color}99)` }} />
                  </div>
                </div>
                <span className="text-xs font-bold text-gray-800 shrink-0 w-[76px] text-right">{money(c.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Funnel */}
        <div className="bg-white/80 rounded-[20px] border border-gray-100/80 p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-1">Воронка продаж</h3>
          <p className="text-xs text-gray-400 mb-5">Конверсия по этапам (30 дней)</p>
          {[
            { label: "Визиты", value: 12460, color: "from-gray-400 to-gray-500" },
            { label: "Просмотры карточек", value: 4820, color: "from-blue-400 to-blue-500" },
            { label: "Выбор варианта", value: 2230, color: "from-violet-400 to-violet-500" },
            { label: "Оформление", value: 1180, color: "from-amber-400 to-amber-500" },
            { label: "Оплата", value: 862, color: "from-emerald-400 to-emerald-500" },
            { label: "Бронирование", value: 812, color: "from-emerald-500 to-green-600" },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3 mb-3">
              <span className="text-[10px] font-bold text-gray-400 w-[110px] shrink-0">{s.label}</span>
              <div className="flex-1 h-7 bg-gray-50 rounded-lg overflow-hidden flex items-center px-2">
                <div className={`h-full rounded-md bg-gradient-to-r ${s.color} flex items-center justify-end px-2 transition-all`} style={{ width: `${(s.value / 12460) * 100}%`, minWidth: 34 }}>
                  <span className="text-[10px] font-bold text-white">{s.value}</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-gray-400 w-[54px] text-right shrink-0">{(s.value / 12460 * 100).toFixed(1)}%</span>
            </div>
          ))}
          <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
            <p>Общая конверсия: <b className="text-emerald-600">6.5%</b> (посетитель → бронирование)</p>
            <p className="text-[10px] text-gray-400 mt-1">Рекомендация: на этапе «Выбор варианта» теряется 46% — улучшить фильтры и фото.</p>
          </div>
        </div>
      </div>

      {/* Promo codes */}
      <div className="bg-white/80 rounded-[20px] border border-gray-100/80 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100/80">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Промокоды</h3>
            <p className="text-xs text-gray-400">Использовано: {promoStats.totalUsed} раз • Активных: {promoStats.active}</p>
          </div>
          <button className="h-9 px-4 rounded-xl bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25">
            + Создать промокод
          </button>
        </div>
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Загрузка промокодов...</p>
          </div>
        ) : error ? (
          <div className="py-10 text-center text-sm text-red-500">{error}</div>
        ) : promos.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            <div className="text-4xl mb-2">🎟</div> Промокодов пока нет
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {["Код", "Скидка", "Использований", "Лимит", "Мин. сумма", "Действует до", "Статус", "Создан"].map((h) => (
                    <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {promos.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700">{p.code}</span>
                    </td>
                    <td className="px-5 py-3 font-bold text-gray-800">{p.type === "PERCENT" ? `${p.discount}%` : money(p.discount)}</td>
                    <td className="px-5 py-3 text-gray-700">{p.usedCount}</td>
                    <td className="px-5 py-3 text-gray-500">{p.maxUses ?? "∞"}</td>
                    <td className="px-5 py-3 text-gray-500">{p.minAmount ? money(Number(p.minAmount)) : "—"}</td>
                    <td className="px-5 py-3 text-gray-500">{fmtDate(p.expiresAt)}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                        {p.isActive ? "Активен" : "Неактивен"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{fmtDate(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </OperationsShell>
  );
}
