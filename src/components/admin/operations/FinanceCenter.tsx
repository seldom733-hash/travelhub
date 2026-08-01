"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n-context";
import OperationsShell from "./OperationsShell";
import { money, CHART_COLORS } from "../command-center/types";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
  booking: { user?: { firstName?: string; lastName?: string; email?: string }; service?: { title?: string; type?: string } } | null;
}

const PAYMENT_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Ожидает", cls: "bg-amber-50 text-amber-600" },
  COMPLETED: { label: "Оплачен", cls: "bg-emerald-50 text-emerald-600" },
  FAILED: { label: "Ошибка", cls: "bg-red-50 text-red-500" },
  REFUNDED: { label: "Возврат", cls: "bg-gray-100 text-gray-500" },
};

const fmtDateTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

const SERVICE_TYPE_NAMES: Record<string, string> = {
  TOUR: "Тур", HOTEL: "Отель", SANATORIUM: "Санаторий", EXCURSION: "Экскурсия",
  GUIDE: "Гид", PHOTOGRAPHER: "Фотограф", TRANSFER: "Трансфер", FLIGHT: "Авиабилет", TRAIN: "ЖД билет",
};

export default function FinanceCenter() {
  const { t } = useI18n();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cmdData, setCmdData] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pRes, cRes] = await Promise.all([
        fetch("/api/admin/payments?limit=100", { credentials: "include" }),
        fetch("/api/admin/command-center", { credentials: "include" }),
      ]);
      if (!pRes.ok) throw new Error(`HTTP ${pRes.status}`);
      const pJson = await pRes.json();
      setPayments(pJson.payments || []);
      if (cRes.ok) setCmdData(await cRes.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const completed = payments.filter((p) => p.status === "COMPLETED");
  const totalCollected = completed.reduce((s, p) => s + Number(p.amount || 0), 0);
  const pending = payments.filter((p) => p.status === "PENDING").length;
  const failed = payments.filter((p) => p.status === "FAILED").length;
  const refunded = payments.filter((p) => p.status === "REFUNDED").reduce((s, p) => s + Number(p.amount || 0), 0);

  const byCategory = cmdData?.byCategory || [];
  const byDay = cmdData?.revenue?.byDay || [];
  const rev = cmdData?.revenue || { today: 0, week: 0, month: 0, year: 0, deltas: {} };

  const maxDay = Math.max(1, ...byDay.map((d: any) => d.revenue));

  return (
    <OperationsShell
      active="finance"
      title={t("operations.finance")}
      subtitle={t("operations.financeDesc")}
      actions={
        <button onClick={fetchData} className="h-9 px-4 rounded-xl bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25">
          ⟳ Обновить
        </button>
      }
    >
      {/* Revenue KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: "📊", label: "Доход сегодня", value: money(rev.today || 0), delta: rev.deltas?.today, grad: "from-blue-500 to-indigo-600" },
          { icon: "🗓", label: "Доход за неделю", value: money(rev.week || 0), delta: rev.deltas?.week, grad: "from-emerald-500 to-green-600" },
          { icon: "📅", label: "Доход за месяц", value: money(rev.month || 0), delta: rev.deltas?.month, grad: "from-violet-500 to-purple-600" },
          { icon: "💰", label: "Доход за год", value: money(rev.year || 0), delta: rev.deltas?.year, grad: "from-amber-500 to-orange-600" },
        ].map((k, i) => (
          <div key={i} className="relative overflow-hidden bg-white/80 rounded-[20px] p-5 border border-gray-100/80">
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${k.grad}`} />
            <div className="flex items-start justify-between mb-3">
              <div className={`w-11 h-11 bg-gradient-to-br ${k.grad} rounded-2xl flex items-center justify-center text-white text-xl shadow-lg shadow-blue-500/20`}>{k.icon}</div>
              {k.delta !== undefined && (
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${k.delta >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                  {k.delta >= 0 ? "↑" : "↓"} {Math.abs(k.delta)}%
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900 tracking-tight">{k.value}</div>
            <div className="text-sm font-medium text-gray-500">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Second row: donut + revenue chart */}
      <div className="grid lg:grid-cols-2 gap-5 mb-6">
        {/* Donut */}
        <div className="bg-white/80 rounded-[20px] border border-gray-100/80 p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-1">{t("commandCenter.whereMoney")}</h3>
          <p className="text-xs text-gray-400 mb-5">{t("commandCenter.platformRevenue")}</p>
          {byCategory.length > 0 ? (
            <div className="flex items-center gap-6">
              <div className="relative w-40 h-40 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {(() => {
                    let acc = 0;
                    const total = byCategory.reduce((s: number, c: any) => s + c.percentage, 0) || 1;
                    return byCategory.map((c: any, i: number) => {
                      const start = acc / total * 100;
                      const len = c.percentage / total * 100;
                      acc += c.percentage;
                      return (
                        <circle key={i} cx="50" cy="50" r="40" fill="none" strokeWidth="12"
                          stroke={CHART_COLORS[i % CHART_COLORS.length]}
                          strokeDasharray={`${Math.max(0, len - 0.5)} ${Math.max(0, 100 - len + 0.5)}`}
                          strokeDashoffset={-start} />
                      );
                    });
                  })()}
                  <circle cx="50" cy="50" r="28" fill="white" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-extrabold text-gray-900">{money(rev.month || 0)}</span>
                  <span className="text-[10px] text-gray-400">{t("commandCenter.month")}</span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {byCategory.map((c: any, i: number) => (
                  <div key={c.type} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="flex-1 text-gray-600 truncate">{c.icon} {c.label}</span>
                    <span className="font-bold text-gray-800">{c.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-gray-400">Нет данных о доходах по категориям</div>
          )}
        </div>

        {/* Revenue by day */}
        <div className="bg-white/80 rounded-[20px] border border-gray-100/80 p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-1">Доход по дням</h3>
          <p className="text-xs text-gray-400 mb-5">Последние 14 дней</p>
          {byDay.length > 0 ? (
            <div className="flex items-end gap-1.5 h-40">
              {byDay.map((d: any, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-blue-500 to-indigo-500 opacity-80 group-hover:opacity-100 transition-opacity relative" style={{ height: `${Math.max(6, d.revenue / maxDay * 100)}%` }} title={`${d.date}: ${money(d.revenue)}`} />
                  <span className="text-[8px] text-gray-400 truncate w-full text-center">{d.date.slice(5)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-gray-400">Нет данных о доходах по дням</div>
          )}
        </div>
      </div>

      {/* Payment stats + table */}
      <div className="grid lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: "💳", label: "Собрано (оплачено)", value: money(totalCollected), cls: "text-emerald-600" },
          { icon: "⏳", label: "Ожидают оплаты", value: pending.toString(), cls: "text-amber-600" },
          { icon: "❌", label: "Ошибки оплаты", value: failed.toString(), cls: "text-red-500" },
          { icon: "↩️", label: "Возвращено", value: money(refunded), cls: "text-gray-500" },
        ].map((k, i) => (
          <div key={i} className="bg-white/80 rounded-[20px] p-5 border border-gray-100/80 flex items-center gap-3">
            <span className="text-2xl">{k.icon}</span>
            <div>
              <div className={`text-xl font-bold ${k.cls}`}>{k.value}</div>
              <div className="text-[11px] font-medium text-gray-400">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Payments table */}
      <div className="bg-white/80 rounded-[20px] border border-gray-100/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100/80">
          <h3 className="text-sm font-bold text-gray-900">Последние платежи</h3>
        </div>
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Загрузка платежей...</p>
          </div>
        ) : error ? (
          <div className="py-10 text-center text-sm text-red-500">{error}</div>
        ) : payments.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            <div className="text-4xl mb-2">💳</div> Платежей пока нет
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {["Платёж", "Клиент", "Услуга", "Метод", "Статус", "Сумма", "Дата"].map((h) => (
                    <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.slice(0, 20).map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3 font-semibold text-gray-800 whitespace-nowrap">№{p.id.slice(0, 8)}</td>
                    <td className="px-5 py-3 text-gray-600 max-w-[160px] truncate">
                      {p.booking?.user ? `${p.booking.user.firstName || ""} ${p.booking.user.lastName || ""}` : "—"}
                    </td>
                    <td className="px-5 py-3 text-gray-600 max-w-[180px] truncate">
                      {p.booking?.service?.title || "—"}
                      {p.booking?.service?.type && <span className="text-[10px] text-gray-400"> • {SERVICE_TYPE_NAMES[p.booking.service.type] || p.booking.service.type}</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{p.method}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PAYMENT_STATUS[p.status]?.cls || "bg-gray-100"}`}>
                        {PAYMENT_STATUS[p.status]?.label || p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-bold text-gray-800 whitespace-nowrap">{money(Number(p.amount))}</td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{fmtDateTime(p.paidAt || p.createdAt)}</td>
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
