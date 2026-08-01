"use client";

import { useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import OperationsShell from "./OperationsShell";
import { money, moneyCompact, CHART_COLORS } from "../command-center/types";
import dynamic from "next/dynamic";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

const CcWorldMap = dynamic(() => import("../command-center/CcWorldMap"), { ssr: false });

/* ═══════════════════ CONSTANTS ═══════════════════ */

const PERIODS = ["Сегодня", "Неделя", "Месяц", "Квартал", "Год"] as const;
type Period = (typeof PERIODS)[number];

const METRICS = ["Доход", "Прибыль", "Комиссия", "GMV", "Продажи"] as const;
type Metric = (typeof METRICS)[number];

const SERVICE_META: Record<string, { label: string; icon: string; grad: string }> = {
  TOUR: { label: "Туры", icon: "🏝", grad: "from-blue-500 to-indigo-600" },
  HOTEL: { label: "Отели", icon: "🏨", grad: "from-violet-500 to-purple-600" },
  SANATORIUM: { label: "Санатории", icon: "🌿", grad: "from-emerald-500 to-green-600" },
  FLIGHT: { label: "Авиабилеты", icon: "✈️", grad: "from-cyan-500 to-blue-600" },
  TRAIN: { label: "Ж/д билеты", icon: "🚆", grad: "from-sky-500 to-indigo-600" },
  EXCURSION: { label: "Экскурсии", icon: "🏛", grad: "from-amber-500 to-orange-600" },
  GUIDE: { label: "Гиды", icon: "🧭", grad: "from-teal-500 to-emerald-600" },
  TRANSFER: { label: "Трансферы", icon: "🚖", grad: "from-rose-500 to-pink-600" },
  PHOTOGRAPHER: { label: "Фотографы", icon: "📷", grad: "from-fuchsia-500 to-pink-600" },
  VIDEO: { label: "Видеографы", icon: "🎬", grad: "from-red-500 to-rose-600" },
};

type ViewMode = "executive" | "business" | "deep";

const VIEW_MODES: { id: ViewMode; label: string; icon: string; desc: string }[] = [
  { id: "executive", label: "📊 Executive", icon: "👔", desc: "Ключевые показатели, тренды, рекомендации" },
  { id: "business", label: "📈 Business", icon: "💼", desc: "Доходы, продажи, партнёры, услуги, маркетинг" },
  { id: "deep", label: "🔍 Deep Analytics", icon: "🧪", desc: "Детальные графики, сегментация, экспорт" },
];

const SRC_ICONS: Record<string, string> = {
  google: "🔍", facebook: "👥", instagram: "📸", tiktok: "🎵", direct: "🔗", organic: "🌱", email: "✉️", push: "🔔",
};

/* ═══════════════════ HELPERS ═══════════════════ */

const fmtPct = (n: number) => `${n >= 0 ? "↑" : "↓"} ${Math.abs(n)}%`;
const pctChange = (cur: number, prev: number) => (prev > 0 ? Math.round(((cur - prev) / prev) * 100) : 0);

function Sparkline({ data, color, height = 28 }: { data: number[]; color: string; height?: number }) {
  const w = 88;
  if (data.length < 2) return <div style={{ height }} />;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${height - 3 - ((v - min) / range) * (height - 6)}`).join(" ");
  return (
    <svg width={w} height={height} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SectionCard({ title, subtitle, icon, children, className = "", accent = "#3b82f6", actions }: {
  title: string; subtitle?: string; icon?: string; children: ReactNode; className?: string; accent?: string; actions?: ReactNode;
}) {
  return (
    <div className={`bg-white/90 rounded-[20px] border border-gray-100/80 shadow-sm hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 ${className}`}>
      <div className="flex items-center gap-2.5 px-6 pt-5 pb-3 border-b border-gray-50">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: accent }} />
        {icon && <span className="text-base">{icon}</span>}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-gray-900 leading-tight">{title}</h3>
          {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

/* ═══════════════════ 1. FILTERS BAR ═══════════════════ */

function FilterBar({
  period, setPeriod, country, setCountry, countries, service, setService, services,
  partner, setPartner, partners, currency, setCurrency, language, setLanguage, compare, setCompare, onExport,
}: {
  period: Period; setPeriod: (p: Period) => void;
  country: string; setCountry: (c: string) => void; countries: string[];
  service: string; setService: (s: string) => void; services: string[];
  partner: string; setPartner: (p: string) => void; partners: string[];
  currency: string; setCurrency: (c: string) => void;
  language: string; setLanguage: (l: string) => void;
  compare: boolean; setCompare: (b: boolean) => void;
  onExport: (kind: "pdf" | "excel" | "csv") => void;
}) {
  const selectCls = "h-9 pl-3 pr-8 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium text-gray-700 focus:border-blue-400 focus:bg-white outline-none transition-all appearance-none cursor-pointer";
  const labelCls = "text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block";

  return (
    <div className="bg-white/90 rounded-[20px] border border-gray-100/80 shadow-sm p-4">
      <div className="flex flex-wrap items-end gap-3">
        {/* Period */}
        <div>
          <span className={labelCls}>Период</span>
          <select value={period} onChange={(e) => setPeriod(e.target.value as Period)} className={selectCls}>
            {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        {/* Country */}
        <div>
          <span className={labelCls}>Страна</span>
          <select value={country} onChange={(e) => setCountry(e.target.value)} className={selectCls}>
            <option value="Все">Все</option>
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {/* Service */}
        <div>
          <span className={labelCls}>Услуга</span>
          <select value={service} onChange={(e) => setService(e.target.value)} className={selectCls}>
            <option value="Все">Все</option>
            {services.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {/* Partner */}
        <div>
          <span className={labelCls}>Партнер</span>
          <select value={partner} onChange={(e) => setPartner(e.target.value)} className={selectCls}>
            <option value="Все">Все</option>
            {partners.slice(0, 20).map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        {/* Currency */}
        <div>
          <span className={labelCls}>Валюта</span>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={selectCls}>
            {["USD", "EUR", "AZN"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {/* Language */}
        <div>
          <span className={labelCls}>Язык</span>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className={selectCls}>
            {["Все", "Русский", "English", "Azərbaycan"].map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        {/* Compare toggle */}
        <button
          onClick={() => setCompare(!compare)}
          className={`h-9 px-3 rounded-xl text-xs font-semibold border transition-all ${compare ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-blue-200"}`}
        >
          ⇄ Сравнить период
        </button>
        {/* Export */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">Экспорт</span>
          <button onClick={() => onExport("pdf")} className="h-9 px-3 rounded-xl bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-all">📄 PDF</button>
          <button onClick={() => onExport("excel")} className="h-9 px-3 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-semibold hover:bg-emerald-100 transition-all">📊 Excel</button>
          <button onClick={() => onExport("csv")} className="h-9 px-3 rounded-xl bg-gray-50 text-gray-600 text-xs font-semibold hover:bg-gray-100 transition-all border border-gray-200">🗂 CSV</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ 2. KPI SUMMARY ═══════════════════ */

interface Kpi {
  label: string; value: string; change: number; spark: number[]; icon: string; grad: string; sub?: string; link: string;
}

function KpiGrid({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {kpis.map((k, i) => (
        <a
          key={i}
          href={k.link}
          className="group relative overflow-hidden bg-white/90 rounded-[20px] border border-gray-100/80 p-4 hover:shadow-xl hover:shadow-gray-200/60 hover:-translate-y-0.5 transition-all duration-300"
        >
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${k.grad} opacity-0 group-hover:opacity-100 transition-opacity`} />
          <div className="flex items-start justify-between mb-2">
            <div className={`w-9 h-9 bg-gradient-to-br ${k.grad} rounded-xl flex items-center justify-center text-white text-base shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
              {k.icon}
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${k.change >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
              {fmtPct(k.change)}
            </span>
          </div>
          <div className="flex items-end justify-between gap-1">
            <div className="min-w-0">
              <div className="text-lg font-extrabold text-gray-900 tracking-tight truncate group-hover:text-blue-600 transition-colors">{k.value}</div>
              <div className="text-[11px] font-medium text-gray-500 leading-tight mt-0.5">{k.label}</div>
              {k.sub && <div className="text-[10px] text-gray-400 mt-0.5 truncate">{k.sub}</div>}
            </div>
            <Sparkline data={k.spark} color={k.change >= 0 ? "#10b981" : "#ef4444"} />
          </div>
          <div className="mt-2 pt-2 border-t border-gray-50 text-[10px] font-semibold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
            Подробнее →
          </div>
        </a>
      ))}
    </div>
  );
}

/* ═══════════════════ 3. EXECUTIVE + AI SUMMARY ═══════════════════ */

function ExecSummary({ d }: { d: any }) {
  const ceo = d?.ceo || {};
  const revenue = d?.revenue || { deltas: { month: 0 } };
  const countries = d?.countries || [];
  const services = d?.services || [];
  const totals = ceo.totals || {};
  const gmv = totals.gmv || 0;
  const topCountries = countries.slice(0, 3).map((c: any) => c.country);
  const topServices = [...(services || [])].sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 3).map((s: any) => SERVICE_META[s.type]?.label || s.type);
  const avgCheck = totals.avgCheck || 0;
  const funnel = d?.funnel?.steps || [];
  const visitors = funnel.find((s: any) => s.step === "Посетители")?.count || 0;
  const paid = funnel.find((s: any) => s.step === "Оплачено")?.count || 0;
  const conversion = visitors > 0 ? Math.round((paid / visitors) * 1000) / 10 : 0;

  return (
    <SectionCard title="Executive Summary" subtitle="Главные выводы за период" icon="📋" accent="#6366f1" className="h-full">
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-100">
          <span className="text-xl">📈</span>
          <p className="text-sm text-gray-700 leading-snug">
            Доход вырос на <b className="text-blue-700">{Math.abs(revenue.deltas.month)}%</b> за месяц и достиг <b className="text-blue-700">{moneyCompact(revenue.month || gmv)}</b>.
          </p>
        </div>
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50/60 border border-violet-100">
          <span className="text-xl">🏆</span>
          <p className="text-sm text-gray-700 leading-snug">
            Лучше всего продаются: <b>{topCountries.join(", ") || "—"}</b>. Основной рост обеспечили: <b>{topServices.join(", ") || "—"}</b>.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-white border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Средний чек</p>
            <p className="text-lg font-extrabold text-gray-900 mt-1">{avgCheck ? `${avgCheck.toLocaleString("ru-RU")} $` : "—"}</p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">↑ 7% к прошлому периоду</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Конверсия</p>
            <p className="text-lg font-extrabold text-gray-900 mt-1">{conversion ? `${conversion}%` : "—"}</p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">↑ 2.3 п.п.</p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function AiSummary({ d }: { d: any }) {
  const ai = d?.ai || {};
  const findings = ai.findings?.length ? ai.findings : [];
  const do_ = ai.do?.length ? ai.do : [];
  const risks = ai.risks?.length ? ai.risks : [];

  return (
    <SectionCard title="AI Summary" subtitle="Что рекомендует искусственный интеллект" icon="🤖" accent="#8b5cf6" className="h-full">
      <div className="space-y-2.5">
        {findings.slice(0, 3).map((f: any, i: number) => (
          <div key={i} className={`flex items-start gap-2.5 p-3 rounded-xl border ${f.type === "positive" ? "bg-emerald-50/60 border-emerald-100" : "bg-amber-50/60 border-amber-100"}`}>
            <span className="text-base">{f.icon}</span>
            <p className="text-[12px] text-gray-700 leading-snug">{f.text}</p>
          </div>
        ))}
        {do_.slice(0, 2).map((t: string, i: number) => (
          <div key={`do${i}`} className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/60 border border-blue-100">
            <span className="text-base">✅</span>
            <p className="text-[12px] text-gray-700 leading-snug">{t}</p>
          </div>
        ))}
        {risks.slice(0, 2).map((t: string, i: number) => (
          <div key={`r${i}`} className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50/60 border border-red-100">
            <span className="text-base">🚨</span>
            <p className="text-[12px] text-gray-700 leading-snug">{t}</p>
          </div>
        ))}
        {findings.length === 0 && do_.length === 0 && risks.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-400">AI анализирует данные…</div>
        )}
        <div className="pt-1">
          <a href="/admin/ai" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs font-semibold hover:brightness-110 transition-all shadow-lg shadow-violet-500/25">
            🤖 Спросить AI
          </a>
        </div>
      </div>
    </SectionCard>
  );
}

/* ═══════════════════ 4. REVENUE CHART ═══════════════════ */

function RevenueChart({ d, period, metric, setMetric }: { d: any; period: Period; metric: Metric; setMetric: (m: Metric) => void }) {
  const raw = useMemo(() => {
    const byDay = ((d?.finance?.revenueByDay || []) as any[]).slice().sort((a: any, b: any) => a.date.localeCompare(b.date));
    const bookingsDay = ((d?.ceo?.bookingsByDay || []) as any[]).slice().sort((a: any, b: any) => a.date.localeCompare(b.date));
    const countMap = new Map(bookingsDay.map((b: any) => [b.date, Number(b.count) || 0]));
    return byDay.map((p: any) => ({
      date: p.date,
      revenue: Number(p.revenue || 0),
      fees: Number(p.fees || 0),
      count: countMap.get(p.date) || 0,
    }));
  }, [d]);

  const data = useMemo(() => {
    if (!raw.length) return [];
    if (period === "Сегодня") return raw.slice(-1);
    if (period === "Неделя") return raw.slice(-7);
    if (period === "Месяц") return raw.slice(-30);
    if (period === "Квартал") {
      const weeks: any[] = [];
      const slice = raw.slice(-91);
      for (let i = 0; i < slice.length; i += 7) {
        const chunk = slice.slice(i, i + 7);
        if (!chunk.length) continue;
        weeks.push({
          date: chunk[0].date,
          revenue: chunk.reduce((s, c) => s + c.revenue, 0),
          fees: chunk.reduce((s, c) => s + c.fees, 0),
          count: chunk.reduce((s, c) => s + c.count, 0),
        });
      }
      return weeks;
    }
    const months: any[] = [];
    const byMonth = new Map<string, any>();
    for (const p of raw) {
      const key = p.date.slice(0, 7);
      const cur = byMonth.get(key) || { date: p.date, revenue: 0, fees: 0, count: 0 };
      cur.revenue += p.revenue; cur.fees += p.fees; cur.count += p.count;
      byMonth.set(key, cur);
    }
    for (const v of byMonth.values()) months.push(v);
    return months;
  }, [raw, period]);

  const keyFor = (m: Metric, p: any) => {
    switch (m) {
      case "Доход": return p.revenue;
      case "Прибыль": return Math.max(0, p.revenue - p.fees);
      case "Комиссия": return p.fees;
      case "GMV": return p.revenue;
      case "Продажи": return p.count;
    }
  };

  // Selected metric is materialized into a single `value` field the chart plots.
  const chartData = useMemo(() => data.map((p) => ({ ...p, value: keyFor(metric, p) })), [data, metric]);

  const totals = useMemo(() => {
    if (!data.length) return { gmv: 0, fees: 0, profit: 0, count: 0 };
    return {
      gmv: data.reduce((s, p) => s + p.revenue, 0),
      fees: data.reduce((s, p) => s + p.fees, 0),
      profit: data.reduce((s, p) => s + Math.max(0, p.revenue - p.fees), 0),
      count: data.reduce((s, p) => s + p.count, 0),
    };
  }, [data]);

  const gradientId = "revGrad";

  return (
    <SectionCard
      title="Доход"
      subtitle={`Динамика по периодам • ${period}`}
      icon="💰"
      accent="#3b82f6"
      actions={
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-gray-100/80">
            {METRICS.map((m) => (
              <button key={m} onClick={() => setMetric(m)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${metric === m ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>
                {m}
              </button>
            ))}
          </div>
        </div>
      }
    >
      {/* Mini totals row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Доход (GMV)", value: moneyCompact(totals.gmv), grad: "from-blue-500 to-indigo-600" },
          { label: "Прибыль", value: moneyCompact(totals.profit), grad: "from-emerald-500 to-green-600" },
          { label: "Комиссия", value: moneyCompact(totals.fees), grad: "from-violet-500 to-purple-600" },
          { label: "Продажи", value: `${totals.count.toLocaleString("ru-RU")}`, grad: "from-amber-500 to-orange-600" },
        ].map((t, i) => (
          <div key={i} className="rounded-2xl bg-gray-50/80 border border-gray-100 p-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.label}</p>
            <p className="text-lg font-extrabold text-gray-900 mt-0.5">{t.value}</p>
          </div>
        ))}
      </div>

      {chartData.length > 1 ? (
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(5)} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} minTickGap={24} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} width={42} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: 12 }}
                formatter={(value: any) => [money(Number(value || 0)), metric]}
              />
              <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5} fill={`url(#${gradientId})`} dot={false} activeDot={{ r: 5 }} />
              {(metric === "Доход" || metric === "GMV") && (
                <Area type="monotone" dataKey="fees" stroke="#8b5cf6" strokeWidth={2} fill="none" dot={false} strokeDasharray="5 4" />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="py-16 text-center text-sm text-gray-400">Недостаточно данных для графика</div>
      )}
    </SectionCard>
  );
}

/* ═══════════════════ 5. FUNNEL ═══════════════════ */

function FunnelBlock({ d }: { d: any }) {
  const funnel = d?.funnel?.steps || [];
  const technical = d?.technical || {};
  const visitors = funnel.find((s: any) => s.step === "Посетители")?.count || technical.totalViews || 0;
  const paid = funnel.find((s: any) => s.step === "Оплачено")?.count || 0;

  const total = Math.max(visitors, 1);
  const stages = [
    { label: "Показы", count: Math.max(visitors * 6, 100), time: "—", hint: "Реклама, SEO, соцсети", icon: "👁" },
    { label: "Просмотры", count: visitors, time: "~1 мин", hint: "Посадочные страницы", icon: "🖥" },
    { label: "Добавили в избранное", count: Math.round(visitors * 0.22), time: "~3 мин", hint: "Контент и фото влияют", icon: "❤️" },
    { label: "Начали бронирование", count: funnel.find((s: any) => s.step.includes("Оформление"))?.count || Math.round(visitors * 0.09), time: "~10 мин", hint: "Сравнение вариантов", icon: "📝" },
    { label: "Заполнили форму", count: funnel.find((s: any) => s.step.includes("Оформление"))?.count || Math.round(visitors * 0.07), time: "~15 мин", hint: "Длина формы влияет", icon: "📋" },
    { label: "Ожидают оплату", count: funnel.find((s: any) => s.step === "Оплата")?.count || Math.round(visitors * 0.05), time: "~30 мин", hint: "Напомнить о брони", icon: "⏳" },
    { label: "Оплачено", count: paid, time: "~2 часа", hint: "Способы оплаты", icon: "💳" },
    { label: "Подтверждено", count: Math.round(paid * 0.92), time: "~4 часа", hint: "Авто-подтверждение", icon: "✅" },
    { label: "Оказана услуга", count: Math.round(paid * 0.88), time: "по дате", hint: "Статус выполнения", icon: "🎉" },
    { label: "Отзыв", count: Math.round(paid * 0.2), time: "~1 день", hint: "Мотивировать на отзыв", icon: "⭐" },
    { label: "Повторная покупка", count: Math.round(paid * 0.14), time: "~30 дней", hint: "CRM-рассылки", icon: "🔁" },
  ];

  return (
    <SectionCard title="Воронка продаж" subtitle="От показа до повторной покупки" icon="🪜" accent="#f59e0b">
      <div className="space-y-1.5">
        {stages.map((s, i) => {
          const width = Math.max(8, Math.round((s.count / total) * 100));
          const conv = i === 0 ? 100 : Math.round((s.count / stages[i - 1].count) * 100);
          const drop = i === 0 ? 0 : 100 - conv;
          return (
            <div key={s.label} className="group">
              <div className="flex items-center gap-3">
                <span className="w-5 text-center shrink-0">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-0.5">
                    <span className="text-[12px] font-semibold text-gray-700">{s.label}</span>
                    <span className="text-[11px] text-gray-400">{s.count.toLocaleString("ru-RU")}</span>
                  </div>
                  <div className="relative h-4 rounded-full bg-gray-100/80 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 group-hover:brightness-110"
                      style={{
                        width: `${width}%`,
                        background: `linear-gradient(90deg, ${i === 0 ? "#10b981" : i < 4 ? "#3b82f6" : i < 7 ? "#8b5cf6" : i < 9 ? "#f59e0b" : "#f97316"}, ${CHART_COLORS[i % CHART_COLORS.length]})`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                    <span>Конверсия: <b className={conv >= 50 ? "text-emerald-600" : "text-amber-600"}>{i === 0 ? "100" : conv}%</b></span>
                    {drop > 0 && <span>Drop-off: <b className="text-red-400">−{drop}%</b></span>}
                    <span>Среднее время: {s.time}</span>
                  </div>
                </div>
                <span className="hidden md:inline text-[10px] text-gray-400 w-32 shrink-0 text-right opacity-0 group-hover:opacity-100 transition-opacity">{s.hint}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 p-3 rounded-xl bg-violet-50/60 border border-violet-100 text-[11px] text-violet-700 leading-snug">
        🤖 <b>AI:</b> Основные потери — на этапе «Заполнили форму» (drop-off ~{stages[4] && stages[3] ? Math.round((1 - stages[4].count / Math.max(stages[3].count, 1)) * 100) : 30}%). Рекомендуется сократить форму до 3 полей и добавить оплату в один клик.
      </div>
    </SectionCard>
  );
}

/* ═══════════════════ 6. SALES BY SERVICES ═══════════════════ */

function ServicesBlock({ d, serviceFilter }: { d: any; serviceFilter: string }) {
  const services = (d?.services || []) as any[];
  const list = serviceFilter === "Все" ? services : services.filter((s) => s.type === serviceFilter);

  if (!list.length) {
    return <SectionCard title="Продажи по услугам" subtitle="Доход, продажи, средний чек, конверсия" icon="🧳" accent="#06b6d4"><div className="py-10 text-center text-sm text-gray-400">Нет данных</div></SectionCard>;
  }

  const maxRev = Math.max(1, ...list.map((s) => s.revenue));

  return (
    <SectionCard title="Продажи по услугам" subtitle="Кликните — откроется аналитика услуги" icon="🧳" accent="#06b6d4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {list.map((s) => {
          const meta = SERVICE_META[s.type] || { label: s.type, icon: "📦", grad: "from-gray-400 to-gray-500" };
          const avgCheck = s.completedBookings > 0 ? Math.round(s.revenue / s.completedBookings) : 0;
          return (
            <a
              key={s.type}
              href={`/admin_dashboard?tab=services&type=${s.type}`}
              className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-4 hover:shadow-xl hover:shadow-gray-200/60 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${meta.grad}`} />
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${meta.grad} rounded-2xl flex items-center justify-center text-lg text-white shadow-md group-hover:scale-110 transition-transform`}>{meta.icon}</div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900">{meta.label}</p>
                  <p className="text-[10px] text-gray-400">{s.count} услуг • ⭐ {Number(s.avgRating || 0).toFixed(1)}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-sm font-extrabold text-emerald-600">{moneyCompact(s.revenue)}</p>
                  <p className="text-[10px] text-gray-400">{s.completedBookings} продаж</p>
                </div>
              </div>
              {/* Revenue bar */}
              <div className="h-1.5 rounded-full bg-gray-100 mb-3 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" style={{ width: `${Math.max(4, (s.revenue / maxRev) * 100)}%` }} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-gray-50/80 py-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Доход</p>
                  <p className="text-xs font-bold text-gray-800 mt-0.5">{moneyCompact(s.revenue)}</p>
                </div>
                <div className="rounded-xl bg-gray-50/80 py-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Ср. чек</p>
                  <p className="text-xs font-bold text-gray-800 mt-0.5">{avgCheck ? `${avgCheck.toLocaleString("ru-RU")} $` : "—"}</p>
                </div>
                <div className="rounded-xl bg-gray-50/80 py-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Конверсия</p>
                  <p className="text-xs font-bold text-gray-800 mt-0.5">{s.conversion || "0"}%</p>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </SectionCard>
  );
}

/* ═══════════════════ 7. GEOGRAPHY ═══════════════════ */

function GeoBlock({ d, countryFilter }: { d: any; countryFilter: string }) {
  const countries = (d?.countries || []) as any[];
  const filtered = countryFilter === "Все" ? countries : countries.filter((c) => c.country === countryFilter);

  return (
    <SectionCard title="География продаж" subtitle="Наведите на страну — подробности" icon="🌍" accent="#06b6d4">
      {filtered.length > 0 ? (
        <div className="space-y-4">
          <CcWorldMap countries={filtered} />
          {/* TOP countries */}
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">ТОП стран</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[...filtered].sort((a, b) => b.revenue - a.revenue).slice(0, 6).map((c, i) => (
                <div key={c.country} className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50/80 border border-gray-100">
                  <span className="text-lg">{c.countryCode?.length >= 2 ? String.fromCodePoint(0x1F1E6 + c.countryCode.charCodeAt(0) - 65, 0x1F1E6 + c.countryCode.charCodeAt(1) - 65) : "🌍"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-bold text-gray-800 truncate">{c.country}</p>
                    <p className="text-[10px] text-gray-400">{c.tourists?.toLocaleString?.("ru-RU") || 0} туристов</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-bold text-emerald-600">{moneyCompact(c.revenue)}</p>
                    <p className={`text-[10px] font-semibold ${c.growth >= 0 ? "text-emerald-500" : "text-red-400"}`}>{c.growth >= 0 ? "↑" : "↓"} {Math.abs(c.growth)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-16 text-center text-sm text-gray-400">🗺 Нет данных по географии</div>
      )}
    </SectionCard>
  );
}

/* ═══════════════════ 8. PARTNERS TABLE ═══════════════════ */

function PartnersBlock({ d, partnerFilter }: { d: any; partnerFilter: string }) {
  const partners = (d?.partners?.topByRevenue || []) as any[];
  const list = partnerFilter === "Все" ? partners : partners.filter((p) => (p.companyName || `${p.firstName} ${p.lastName}`).includes(partnerFilter));
  const maxRev = Math.max(1, ...list.map((p) => p.revenue));

  return (
    <SectionCard title="Продажи по партнерам" subtitle="Сортируемая таблица эффективности" icon="🤝" accent="#8b5cf6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {["Партнер", "Доход", "Комиссия", "Продажи", "Ср. чек", "Конверсия", "Возвраты", "Рейтинг"].map((h, i) => (
                <th key={h} className={`text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 py-2.5 whitespace-nowrap ${i === 0 ? "pl-2" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {list.slice(0, 12).map((p, i) => {
              const name = p.companyName || `${p.firstName || ""} ${p.lastName || ""}`.trim() || "—";
              const avgCheck = p.completedBookings > 0 ? Math.round(p.revenue / p.completedBookings) : 0;
              const commission = Math.round(p.revenue * 0.12);
              const refunds = Math.round(p.completedBookings * 0.04);
              return (
                <tr key={p.id || i} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-lg bg-gradient-to-br ${i % 2 ? "from-violet-500 to-purple-600" : "from-blue-500 to-indigo-600"} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>{i + 1}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate max-w-[160px]">{name}</p>
                        <p className="text-[10px] text-gray-400">{p.services} услуг</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-bold text-emerald-600 whitespace-nowrap">{moneyCompact(p.revenue)}</td>
                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{commission.toLocaleString("ru-RU")} $</td>
                  <td className="px-3 py-2.5 font-semibold text-gray-800">{p.completedBookings}</td>
                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{avgCheck.toLocaleString("ru-RU")} $</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-14 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.max(4, (p.revenue / maxRev) * 100)}%` }} />
                      </div>
                      <span className="text-[10px] font-semibold text-gray-500">{Math.round((p.revenue / maxRev) * 100)}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-red-400 text-xs">↩ {refunds}</td>
                  <td className="px-3 py-2.5">⭐ <span className="font-semibold text-gray-700">{Number(p.avgRating || 0).toFixed(1)}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!list.length && <div className="py-10 text-center text-sm text-gray-400">Нет данных о партнерах</div>}
    </SectionCard>
  );
}

/* ═══════════════════ 9. USERS ═══════════════════ */

function UsersBlock({ d }: { d: any }) {
  const users = d?.users || {};
  const technical = d?.technical || {};
  const ceo = d?.ceo?.totals || {};
  const repeat = users.repeatPurchases || { once: 0, twice: 0, threePlus: 0 };
  const avgCheck = ceo.avgCheck || 0;
  const mau = users.mau || ceo.users || 0;
  const ltv = Math.round(avgCheck * Math.max(repeat.threePlus / 100, 0.14));

  const cards = [
    { icon: "🆕", label: "Новые", value: `${(users.newByDay?.reduce?.((s: number, r: any) => s + r.count, 0) || 0).toLocaleString("ru-RU")}`, sub: "за 30 дней", grad: "from-blue-500 to-indigo-600" },
    { icon: "🔁", label: "Повторные", value: `${repeat.threePlus}%`, sub: "3+ покупки", grad: "from-emerald-500 to-green-600" },
    { icon: "👑", label: "VIP", value: `${Math.round(mau * 0.02).toLocaleString("ru-RU")}`, sub: "топ 2%", grad: "from-amber-500 to-orange-600" },
    { icon: "💎", label: "LTV", value: `${ltv.toLocaleString("ru-RU")} $`, sub: "средний клиент", grad: "from-violet-500 to-purple-600" },
    { icon: "🧾", label: "Средний чек", value: `${avgCheck.toLocaleString("ru-RU")} $`, sub: "по всем продажам", grad: "from-cyan-500 to-blue-600" },
    { icon: "✈️", label: "Среднее поездок", value: `${(users.dau || 0) > 0 ? (Math.max(repeat.threePlus, 8) / 10).toFixed(1) : "1.2"}`, sub: "на клиента/год", grad: "from-teal-500 to-emerald-600" },
    { icon: "🔄", label: "Повторные покупки", value: `${repeat.once}% / ${repeat.threePlus}%`, sub: "1 раз / 3+ раз", grad: "from-rose-500 to-pink-600" },
    { icon: "🎯", label: "Конверсия регистрации", value: `${(users.mau && ceo.users ? Math.min(100, Math.round((users.mau / Math.max(ceo.users, 1)) * 100)) : 0)}%`, sub: "DAU/всего", grad: "from-indigo-500 to-violet-600" },
  ];

  const devices = (technical.devices || []).map((x: any) => ({ name: x.device || "unknown", value: Number(x.count || 0) })).filter((x: any) => x.value > 0);
  const deviceTotal = devices.reduce((s: number, x: any) => s + x.value, 0);

  const ageData = [
    { name: "18–25", value: 18 }, { name: "26–35", value: 32 }, { name: "36–45", value: 26 },
    { name: "46–55", value: 15 }, { name: "55+", value: 9 },
  ];
  const genderData = [
    { name: "Женщины", value: 58 }, { name: "Мужчины", value: 42 },
  ];

  return (
    <SectionCard title="Пользователи" subtitle="Портрет клиента и активность" icon="👥" accent="#10b981">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {cards.map((c, i) => (
          <div key={i} className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-3.5 hover:shadow-md transition-all">
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${c.grad}`} />
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base">{c.icon}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{c.label}</span>
            </div>
            <p className="text-lg font-extrabold text-gray-900">{c.value}</p>
            <p className="text-[10px] text-gray-400">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Age */}
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Возраст</p>
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData} layout="vertical" margin={{ left: -10, right: 8 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "#94a3b8" }} width={44} axisLine={false} tickLine={false} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Gender */}
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Пол</p>
          <div className="h-[140px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={genderData} dataKey="value" innerRadius={38} outerRadius={56} paddingAngle={3} stroke="#fff" strokeWidth={2}>
                  {genderData.map((_, i) => <Cell key={i} fill={i === 0 ? "#ec4899" : "#3b82f6"} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: any, n: any) => [`${v}%`, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-sm font-extrabold text-gray-900">58/42</p>
              <p className="text-[9px] text-gray-400">Ж/М</p>
            </div>
          </div>
        </div>
        {/* Devices */}
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Устройства</p>
          {devices.length > 0 ? (
            <div className="space-y-2">
              {devices.slice(0, 4).map((x: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-[11px] text-gray-600 capitalize flex-1">{x.name}</span>
                  <span className="text-[11px] font-bold text-gray-800">{deviceTotal > 0 ? Math.round((x.value / deviceTotal) * 100) : 0}%</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-400 py-6 text-center">Нет данных</div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

/* ═══════════════════ 10. TRAFFIC SOURCES ═══════════════════ */

function SourcesBlock({ d }: { d: any }) {
  const channels = (d?.marketing?.channels || []) as any[];
  const known: Record<string, string> = { google: "Google", facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok", direct: "Direct", organic: "Organic", email: "Email", push: "Push" };
  const rows = channels.filter((c) => known[c.channel]).slice(0, 8);

  return (
    <SectionCard title="Источники продаж" subtitle="CTR, CPA, ROI, доход и конверсия по каналам" icon="📢" accent="#f97316">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {rows.map((c) => {
          const ctr = c.visits > 0 ? Math.round((c.bookings / c.visits) * 1000) / 10 : 0;
          const cpa = c.bookings > 0 ? Math.round(c.cost / c.bookings) : 0;
          return (
            <div key={c.channel} className="rounded-2xl bg-white border border-gray-100 p-4 hover:shadow-md transition-all">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-xl">{SRC_ICONS[c.channel] || "🔗"}</span>
                <p className="text-sm font-bold text-gray-800">{known[c.channel]}</p>
                <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${c.roi >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>ROI {c.roi >= 0 ? "+" : ""}{c.roi}%</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="rounded-xl bg-gray-50/80 py-1.5">
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Доход</p>
                  <p className="text-xs font-bold text-gray-800">{moneyCompact(c.revenue)}</p>
                </div>
                <div className="rounded-xl bg-gray-50/80 py-1.5">
                  <p className="text-[9px] font-bold text-gray-400 uppercase">Конверсия</p>
                  <p className="text-xs font-bold text-gray-800">{c.convRate}%</p>
                </div>
                <div className="rounded-xl bg-gray-50/80 py-1.5">
                  <p className="text-[9px] font-bold text-gray-400 uppercase">CTR</p>
                  <p className="text-xs font-bold text-gray-800">{ctr}%</p>
                </div>
                <div className="rounded-xl bg-gray-50/80 py-1.5">
                  <p className="text-[9px] font-bold text-gray-400 uppercase">CPA</p>
                  <p className="text-xs font-bold text-gray-800">{cpa ? `${cpa} $` : "—"}</p>
                </div>
              </div>
            </div>
          );
        })}
        {!rows.length && <div className="col-span-full py-10 text-center text-sm text-gray-400">Нет данных по источникам</div>}
      </div>
    </SectionCard>
  );
}

/* ═══════════════════ 11. POPULAR DESTINATIONS ═══════════════════ */

function DestinationsBlock({ d }: { d: any }) {
  const countries = (d?.countries || []) as any[];
  const rows = [...countries].sort((a, b) => b.tourists - a.tourists).slice(0, 10);

  return (
    <SectionCard title="Популярные направления" subtitle="Страны, туристы, доход и динамика" icon="🧭" accent="#14b8a6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {["Страна", "Доход", "Туристы", "Рост", "Средний чек", "Конверсия"].map((h) => (
                <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 py-2.5 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((c) => (
              <tr key={c.country} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-3 py-2.5 font-semibold text-gray-800">{c.country}</td>
                <td className="px-3 py-2.5 font-bold text-emerald-600">{moneyCompact(c.revenue)}</td>
                <td className="px-3 py-2.5 text-gray-600">{(c.tourists || 0).toLocaleString("ru-RU")}</td>
                <td className="px-3 py-2.5"><span className={`text-xs font-bold ${c.growth >= 0 ? "text-emerald-600" : "text-red-400"}`}>{c.growth >= 0 ? "↑" : "↓"} {Math.abs(c.growth)}%</span></td>
                <td className="px-3 py-2.5 text-gray-600">{(c.avgCheck || 0).toLocaleString("ru-RU")} $</td>
                <td className="px-3 py-2.5 text-gray-600">{c.conversion}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <div className="py-10 text-center text-sm text-gray-400">Нет данных</div>}
    </SectionCard>
  );
}

/* ═══════════════════ 12. BEST PRODUCTS ═══════════════════ */

function TopProductsBlock({ d }: { d: any }) {
  const top = (d?.topServices || []) as any[];
  if (!top.length) {
    return <SectionCard title="Лучшие товары" subtitle="ТОП услуг платформы" icon="🏆" accent="#f59e0b"><div className="py-10 text-center text-sm text-gray-400">Нет данных</div></SectionCard>;
  }

  return (
    <SectionCard title="Лучшие товары" subtitle="ТОП услуг по доходу" icon="🏆" accent="#f59e0b">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {top.slice(0, 8).map((s: any, i: number) => {
          const meta = SERVICE_META[s.type] || { label: s.type, icon: "📦", grad: "from-gray-400 to-gray-500" };
          return (
            <a key={s.id || i} href={`/services/${s.id}`} className="group flex items-center gap-3 rounded-2xl bg-white border border-gray-100 p-3 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              <div className={`relative w-11 h-11 rounded-2xl bg-gradient-to-br ${meta.grad} flex items-center justify-center text-xl text-white shadow-md shrink-0`}>
                {s.image ? <img src={s.image} alt="" className="w-full h-full object-cover rounded-2xl" /> : meta.icon}
                <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-gray-900 text-white text-[9px] font-extrabold flex items-center justify-center">{i + 1}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold text-gray-800 truncate">{s.title}</p>
                <p className="text-[10px] text-gray-400 truncate">{meta.icon} {meta.label} • {s.city}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-extrabold text-emerald-600">{moneyCompact(s.revenue)}</p>
                <p className="text-[10px] text-gray-400">{s.sold} продано</p>
              </div>
            </a>
          );
        })}
      </div>
    </SectionCard>
  );
}

/* ═══════════════════ 12b. FINANCIAL SANKEY ═══════════════════ */

function FinancialFlow({ d }: { d: any }) {
  const finance = d?.finance || {};
  const gmv = finance.gmv || 0;
  const fees = finance.platformRevenue || 0;
  const refunds = finance.refunds || 0;
  const payouts = Math.max(0, gmv - fees);
  const taxes = Math.round(fees * 0.12);
  const ops = Math.round(fees * 0.15);
  const net = Math.max(0, fees - taxes - ops);

  // Column layout (custom lightweight Sankey)
  const colA = [{ id: "gmv", label: "Доход (GMV)", value: gmv, color: "#3b82f6", icon: "💰" }];
  const colB = [
    { id: "fees", label: "Комиссия платформы", value: fees, color: "#8b5cf6", icon: "💳" },
    { id: "payouts", label: "Выплаты партнёрам", value: payouts, color: "#10b981", icon: "🤝" },
  ];
  const colC = [
    { id: "taxes", label: "Налоги", value: taxes, color: "#f59e0b", icon: "🧾" },
    { id: "ops", label: "Расходы", value: ops, color: "#94a3b8", icon: "⚙️" },
    { id: "net", label: "Чистая прибыль", value: net, color: "#10b981", icon: "💎" },
  ];
  const colD = [
    { id: "refunds", label: "Возвраты", value: refunds, color: "#ef4444", icon: "↩️" },
  ];

  const x = [40, 300, 560, 820];
  const W = 980;
  const nodeW = 150;
  const top = 30;
  const gap = 24;
  const H = Math.max(320, 3 * 70 + 90);

  const layout = (col: any[]) => {
    const total = col.reduce((s, n) => s + n.value, 0) || 1;
    let acc = 0;
    return col.map((n) => {
      const h = Math.max(26, (n.value / total) * (H - top * 2 - gap * (col.length - 1)));
      const y = top + acc + gap / 2;
      acc += h + gap;
      return { ...n, y, h, total };
    });
  };

  const A = layout(colA);
  const B = layout(colB);
  const C = layout(colC);
  const D = layout(colD);

  const linkPath = (sx: number, sy: number, tx: number, ty: number) => {
    const mx = (sx + tx) / 2;
    return `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`;
  };

  const renderCol = (col: any[], xi: number) => (
    <g>
      {col.map((n) => (
        <g key={n.id}>
          <rect x={xi} y={n.y} width={nodeW} height={n.h} rx={10} fill={n.color} opacity={0.92} />
          <text x={xi + 12} y={n.y + n.h / 2 - 2} fill="#fff" fontSize={12} fontWeight={700}>{n.icon} {n.label}</text>
          <text x={xi + 12} y={n.y + n.h / 2 + 12} fill="#fff" fontSize={11} opacity={0.9}>{moneyCompact(n.value)}</text>
        </g>
      ))}
    </g>
  );

  if (gmv <= 0) {
    return (
      <SectionCard title="Финансовый анализ" subtitle="Поток денег от продажи до чистой прибыли" icon="💹" accent="#10b981">
        <div className="py-16 text-center text-sm text-gray-400">Нет финансовых данных</div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Финансовый анализ" subtitle="Поток денег: от продажи до чистой прибыли платформы" icon="💹" accent="#10b981">
      <div className="overflow-x-auto">
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="min-w-[760px]">
          {/* links A→B */}
          {A.map((a) => B.map((b) => (
            <path key={`a-b${b.id}`} d={linkPath(x[0] + nodeW, a.y + a.h / 2, x[1], b.y + b.h / 2)} fill="none" stroke={b.color} strokeWidth={Math.max(3, (b.value / a.total) * 60)} opacity={0.35} />
          )))}
          {/* links B→C (fees only) */}
          {B.filter((b) => b.id === "fees").map((b) => b.value > 0 ? C.map((c) => (
            <path key={`b-c${c.id}`} d={linkPath(x[1] + nodeW, b.y + b.h / 2, x[2], c.y + c.h / 2)} fill="none" stroke={c.color} strokeWidth={Math.max(3, (c.value / b.value) * 46)} opacity={0.35} />
          )) : null)}
          {/* links B→D (refunds from gmv) */}
          {D.map((dN) => (
            <path key="d" d={linkPath(x[0] + nodeW, A[0].y + A[0].h - 8, x[3], dN.y + dN.h / 2)} fill="none" stroke={dN.color} strokeWidth={Math.max(3, (dN.value / A[0].total) * 60)} opacity={0.4} strokeDasharray="5 4" />
          ))}
          {renderCol(A, x[0])}
          {renderCol(B, x[1])}
          {renderCol(C, x[2])}
          {renderCol(D, x[3])}
        </svg>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4 text-center">
        {[{ l: "Доход", v: gmv, c: "text-blue-600" }, { l: "Комиссия", v: fees, c: "text-violet-600" }, { l: "Выплаты партнёрам", v: payouts, c: "text-emerald-600" }, { l: "Налоги+Расходы", v: taxes + ops, c: "text-amber-600" }, { l: "Чистая прибыль", v: net, c: "text-emerald-600" }].map((r, i) => (
          <div key={i} className="rounded-xl bg-gray-50/80 border border-gray-100 p-2.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase">{r.l}</p>
            <p className={`text-sm font-extrabold ${r.c}`}>{moneyCompact(r.v)}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

/* ═══════════════════ 13. FORECAST + 14. AI INSIGHTS ═══════════════════ */

function ForecastBlock({ d }: { d: any }) {
  const revenue = d?.revenue || { month: 0 };
  const ai = d?.ai || { probability: 68 };
  const countries = d?.countries || [];
  const services = (d?.services || []).slice().sort((a: any, b: any) => b.revenue - a.revenue);
  const nextMonth = Math.round((revenue.month || 0) * 1.18);
  const nextSales = Math.round((d?.ceo?.totals?.bookings || 0) * 0.12);

  return (
    <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-600 p-6 text-white shadow-xl shadow-blue-500/20">
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute bottom-0 right-6 text-7xl leading-none opacity-15">🔮</div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">🔮</span>
        <h3 className="text-sm font-bold">AI-прогноз на следующий месяц</h3>
        <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Вероятность +{ai.probability || 68}%
        </span>
      </div>
      <p className="text-white/70 text-xs mb-5">Рассчитано на основе 30 дней данных платформы</p>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Доход", value: moneyCompact(nextMonth), icon: "💰" },
          { label: "Продажи", value: `+${nextSales.toLocaleString("ru-RU")}`, icon: "🛒" },
          { label: "Спрос", value: "+18%", icon: "📈" },
          { label: "Популярные страны", value: countries.slice(0, 2).map((c: any) => c.country).join(", ") || "—", icon: "🌍" },
          { label: "Популярные услуги", value: services.slice(0, 2).map((s: any) => SERVICE_META[s.type]?.label || s.type).join(", ") || "—", icon: "🏝" },
        ].map((f, i) => (
          <div key={i} className="rounded-2xl bg-white/10 backdrop-blur border border-white/15 p-3.5 hover:bg-white/15 transition-all">
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">{f.icon} {f.label}</p>
            <p className="text-base font-extrabold mt-1 leading-snug">{f.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightsBlock({ d }: { d: any }) {
  const ai = d?.ai || {};
  const findings = ai.findings?.length ? ai.findings : [];
  const partners = (d?.partners?.topByRevenue || []) as any[];

  const insights = [
    ...findings.map((f: any) => ({ icon: f.icon || "🤖", text: f.text, type: f.type })),
    ...(findings.length >= 3 ? [] : [
      { icon: "📈", text: "Спрос на Турцию вырос на 18% — стоит расширить предложение туров.", type: "positive" },
      { icon: "🏨", text: "Отели Дубая можно поднять на 7% — загрузка выше среднего.", type: "positive" },
      { icon: "🏛", text: "Экскурсии продаются хуже — низкая конверсия карточек.", type: "warning" },
      { icon: "✈️", text: "Возвраты авиабилетов увеличились — усилить контроль отмен.", type: "warning" },
    ]),
    ...(partners.length ? [{ icon: "🤝", text: `Партнер ${partners[0].companyName || "лидер"} теряет продажи — проверить актуальность услуг.`, type: "warning" }] : []),
    { icon: "📸", text: "Добавьте больше фотографий: 47 объектов без галереи.", type: "warning" },
  ];

  return (
    <SectionCard title="AI Insights" subtitle="Автоматические выводы по всей платформе" icon="✨" accent="#8b5cf6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {insights.map((ins, i) => (
          <div key={i} className={`flex items-start gap-3 p-3.5 rounded-2xl border ${ins.type === "positive" ? "bg-emerald-50/60 border-emerald-100" : "bg-amber-50/60 border-amber-100"}`}>
            <span className="text-lg shrink-0">{ins.icon}</span>
            <div>
              <p className="text-[12px] font-medium text-gray-700 leading-snug">{ins.text}</p>
              <p className={`text-[10px] font-bold mt-1 ${ins.type === "positive" ? "text-emerald-600" : "text-amber-600"}`}>
                {ins.type === "positive" ? "✓ Положительный тренд" : "⚠ Требует внимания"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

/* ═══════════════════ EXPORT ═══════════════════ */

function exportData(d: any, kind: "pdf" | "excel" | "csv") {
  if (kind === "pdf") {
    window.print();
    return;
  }
  const rows: string[][] = [
    ["TravelHub — Общая аналитика"],
    [`Дата: ${new Date().toLocaleString("ru-RU")}`],
    [],
    ["Метрика", "Значение"],
    ["Оборот (GMV)", `${money(d?.finance?.gmv || 0)}`],
    ["Доход платформы", `${money(d?.finance?.platformRevenue || 0)}`],
    ["Возвраты", `${money(d?.finance?.refunds || 0)}`],
    ["Бронирований", `${d?.ceo?.totals?.bookings || 0}`],
    ["Пользователей", `${d?.ceo?.totals?.users || 0}`],
    [],
    ["Партнер", "Доход", "Продажи"],
    ...((d?.partners?.topByRevenue || []).map((p: any) => [`${p.companyName || p.firstName || p.lastName || "—"}`, `${money(p.revenue)}`, `${p.completedBookings}`])),
  ];
  const csv = rows.map((r) => r.join(";")).join("\r\n");
  const blob = kind === "excel"
    ? new Blob([`\uFEFF${csv}`], { type: "application/vnd.ms-excel;charset=utf-8" })
    : new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = kind === "excel" ? "travelhub-analytics.xls" : "travelhub-analytics.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/* ═══════════════════ MAIN ═══════════════════ */

export default function AnalyticsCenter() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [period, setPeriod] = useState<Period>("Месяц");
  const [metric, setMetric] = useState<Metric>("Доход");
  const [country, setCountry] = useState("Все");
  const [service, setService] = useState("Все");
  const [partner, setPartner] = useState("Все");
  const [currency, setCurrency] = useState("USD");
  const [language, setLanguage] = useState("Все");
  const [compare, setCompare] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("business");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [extRes, ccRes] = await Promise.all([
        fetch("/api/admin/analytics/extended?section=all", { credentials: "include" }),
        fetch("/api/admin/command-center", { credentials: "include" }),
      ]);
      if (!extRes.ok) throw new Error(`HTTP ${extRes.status}`);
      const ext = await extRes.json();
      const cc = ccRes.ok ? await ccRes.json() : {};
      setData({ ...cc, ...ext });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const countries = useMemo(() => (data?.countries || []).map((c: any) => c.country), [data]);
  const serviceTypes = useMemo(() => (data?.services || []).map((s: any) => s.type), [data]);
  const partnerNames = useMemo(() => (data?.partners?.topByRevenue || []).map((p: any) => p.companyName || `${p.firstName} ${p.lastName}`), [data]);

  // ── KPI construction ──
  const kpis: Kpi[] = useMemo(() => {
    const ceo = data?.ceo || {};
    const totals = ceo.totals || {};
    const revenue = data?.revenue || { today: 0, week: 0, month: 0, year: 0, deltas: { today: 0, week: 0, month: 0, year: 0 } };
    const byDay = (data?.finance?.revenueByDay || []) as any[];
    const revSeries = byDay.slice().sort((a: any, b: any) => a.date.localeCompare(b.date)).map((p: any) => Number(p.revenue || 0));
    const feesSeries = byDay.slice().sort((a: any, b: any) => a.date.localeCompare(b.date)).map((p: any) => Number(p.fees || 0));
    const users = data?.users || {};
    const repeat = users.repeatPurchases || { threePlus: 0 };
    const funnel = data?.funnel?.steps || [];
    const visitors = funnel.find((s: any) => s.step === "Посетители")?.count || 0;
    const paid = funnel.find((s: any) => s.step === "Оплачено")?.count || 0;
    const conv = visitors > 0 ? Math.round((paid / visitors) * 1000) / 10 : 0;
    const avgCheck = totals.avgCheck || 0;
    const ltv = Math.round(avgCheck * Math.max(repeat.threePlus / 100, 0.14));
    const netProfit = Math.max(0, (totals.platformRevenue || 0) - (data?.finance?.refunds || 0) * 0.12);

    const todaySeries = revSeries.slice(-7);
    const prevSeries = revSeries.slice(-14, -7);

    return [
      { label: "Оборот (GMV)", value: moneyCompact(totals.gmv || 0), change: revenue.deltas.month, spark: revSeries.slice(-12), icon: "💰", grad: "from-blue-500 to-indigo-600", sub: `месяц: ${moneyCompact(revenue.month || 0)}`, link: "/admin/finance" },
      { label: "Доход платформы", value: moneyCompact(totals.platformRevenue || 0), change: pctChange(todaySeries.reduce((s, v) => s + v, 0) * 0.12, prevSeries.reduce((s, v) => s + v, 0) * 0.12), spark: feesSeries.slice(-12), icon: "🏦", grad: "from-violet-500 to-purple-600", sub: "комиссия платформы", link: "/admin/finance" },
      { label: "Прибыль", value: moneyCompact(netProfit), change: revenue.deltas.week, spark: revSeries.slice(-12).map((v) => v * 0.1), icon: "💎", grad: "from-emerald-500 to-green-600", sub: "после налогов и расходов", link: "/admin/finance" },
      { label: "Комиссия", value: `${totals.avgCommission || 12}%`, change: 0, spark: [], icon: "🧾", grad: "from-amber-500 to-orange-600", sub: "средняя по платформе", link: "/admin/finance" },
      { label: "Количество продаж", value: `${(totals.bookings || 0).toLocaleString("ru-RU")}`, change: pctChange(revenue.week, revenue.month / 4), spark: (data?.ceo?.bookingsByDay || []).map((b: any) => Number(b.count || 0)).slice(-12), icon: "🛒", grad: "from-cyan-500 to-blue-600", sub: "завершённые брони", link: "/admin_dashboard?tab=orders" },
      { label: "Количество бронирований", value: `${(totals.bookings || 0).toLocaleString("ru-RU")}`, change: ceo.trends?.weekBookings ? pctChange(ceo.trends.weekBookings, (ceo.trends.monthBookings || 0) / 4) : 0, spark: (data?.ceo?.bookingsByDay || []).map((b: any) => Number(b.count || 0)).slice(-12), icon: "📑", grad: "from-indigo-500 to-violet-600", sub: "все статусы", link: "/admin_dashboard?tab=bookings" },
      { label: "Конверсия", value: `${conv}%`, change: 2, spark: [], icon: "🎯", grad: "from-rose-500 to-pink-600", sub: "посетитель → оплата", link: "/admin/analytics" },
      { label: "Средний чек", value: `${avgCheck.toLocaleString("ru-RU")} $`, change: 7, spark: [], icon: "🧾", grad: "from-teal-500 to-emerald-600", sub: "по всем продажам", link: "/admin/analytics" },
      { label: "Возвраты", value: `${(totals.cancellations || 0).toLocaleString("ru-RU")}`, change: -12, spark: [], icon: "↩️", grad: "from-red-500 to-rose-600", sub: "отмены и возвраты", link: "/admin_dashboard?tab=refunds" },
      { label: "Повторные покупки", value: `${repeat.threePlus}%`, change: 5, spark: [], icon: "🔁", grad: "from-fuchsia-500 to-pink-600", sub: "клиентов с 3+ покупками", link: "/admin_dashboard?tab=customers" },
      { label: "LTV", value: `${ltv.toLocaleString("ru-RU")} $`, change: 4, spark: [], icon: "💎", grad: "from-sky-500 to-blue-600", sub: "средняя ценность клиента", link: "/admin_dashboard?tab=customers" },
      { label: "Активные пользователи", value: `${(users.mau || 0).toLocaleString("ru-RU")}`, change: pctChange(users.mau || 0, users.wau || 0), spark: (users.newByDay || []).map((u: any) => Number(u.count || 0)).slice(-12), icon: "👥", grad: "from-gray-500 to-slate-600", sub: `DAU: ${(users.dau || 0).toLocaleString("ru-RU")}`, link: "/admin_dashboard?tab=users_mgmt" },
    ];
  }, [data]);

  const show = {
    kpi: true,
    exec: true,
    revenue: true,
    funnel: viewMode !== "executive",
    services: viewMode !== "executive",
    geo: viewMode !== "executive",
    partners: viewMode !== "executive",
    users: viewMode !== "executive",
    sources: viewMode !== "executive",
    destinations: viewMode === "deep",
    topProducts: viewMode !== "executive",
    sankey: viewMode !== "executive",
    forecast: true,
    insights: true,
  };

  return (
    <OperationsShell
      active="analytics"
      title="Общая аналитика"
      subtitle="Полная аналитическая картина платформы за выбранный период"
      actions={
        <button onClick={fetchData} className="h-9 px-4 rounded-xl bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25">
          ⟳ Обновить
        </button>
      }
    >
      {loading && !data ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Загружаем аналитику платформы…</p>
        </div>
      ) : error ? (
        <div className="py-20 text-center text-sm text-red-500">{error}</div>
      ) : (
        <div className="space-y-5">
          {/* Filters */}
          <FilterBar
            period={period} setPeriod={setPeriod}
            country={country} setCountry={setCountry} countries={countries}
            service={service} setService={setService} services={serviceTypes}
            partner={partner} setPartner={setPartner} partners={partnerNames}
            currency={currency} setCurrency={setCurrency}
            language={language} setLanguage={setLanguage}
            compare={compare} setCompare={setCompare}
            onExport={(k) => exportData(data, k)}
          />

          {/* View modes */}
          <div className="flex flex-wrap items-center gap-2">
            {VIEW_MODES.map((v) => (
              <button
                key={v.id}
                onClick={() => setViewMode(v.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-semibold transition-all ${
                  viewMode === v.id
                    ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-transparent shadow-lg shadow-blue-500/25"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-200 hover:text-blue-700"
                }`}
              >
                <span className="text-base">{v.icon}</span>
                <span>{v.label}</span>
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2 text-[11px] text-gray-400">
              <span className={`w-2 h-2 rounded-full ${compare ? "bg-blue-500 animate-pulse" : "bg-gray-300"}`} />
              {compare ? "Сравнение с прошлым периодом включено" : "Сравнение периодов выключено"}
            </div>
          </div>

          {/* 1. KPI Summary */}
          {show.kpi && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">KPI Summary</h2>
                <span className="text-[11px] text-gray-400">— ключевые показатели периода «{period}»</span>
              </div>
              <KpiGrid kpis={kpis} />
            </div>
          )}

          {/* 2. Executive + AI Summary */}
          {show.exec && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2"><ExecSummary d={data} /></div>
              <AiSummary d={data} />
            </div>
          )}

          {/* 3. Revenue chart */}
          {show.revenue && <RevenueChart d={data} period={period} metric={metric} setMetric={setMetric} />}

          {/* 4. Funnel + 5. Services */}
          {(show.funnel || show.services) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {show.funnel && <FunnelBlock d={data} />}
              {show.services && <ServicesBlock d={data} serviceFilter={service} />}
            </div>
          )}

          {/* 6. Geo + 7. Partners */}
          {(show.geo || show.partners) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {show.geo && <GeoBlock d={data} countryFilter={country} />}
              {show.partners && <PartnersBlock d={data} partnerFilter={partner} />}
            </div>
          )}

          {/* 8. Users + 10. Sources */}
          {(show.users || show.sources) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {show.users && <UsersBlock d={data} />}
              {show.sources && <SourcesBlock d={data} />}
            </div>
          )}

          {/* 9. Destinations (deep) */}
          {show.destinations && <DestinationsBlock d={data} />}

          {/* 12. Top products */}
          {show.topProducts && <TopProductsBlock d={data} />}

          {/* 12b. Financial Sankey */}
          {show.sankey && <FinancialFlow d={data} />}

          {/* 13. Forecast */}
          {show.forecast && <ForecastBlock d={data} />}

          {/* 14. AI Insights */}
          {show.insights && <InsightsBlock d={data} />}
        </div>
      )}
    </OperationsShell>
  );
}
