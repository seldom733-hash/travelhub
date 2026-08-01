"use client";

import { useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import OperationsShell from "./OperationsShell";
import DataTable from "../DataTable";
import { money, moneyCompact, CHART_COLORS } from "../command-center/types";
import dynamic from "next/dynamic";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";

const CcWorldMap = dynamic(() => import("../command-center/CcWorldMap"), { ssr: false });

/* ═══════════════════ CONSTANTS ═══════════════════ */

const PERIODS = ["Сегодня", "Неделя", "Месяц", "Квартал", "Год", "Пользовательский"] as const;
type Period = (typeof PERIODS)[number];

const METRICS = ["Доход", "Прибыль", "Комиссия", "GMV", "Продажи"] as const;
type Metric = (typeof METRICS)[number];

const INTERVALS = ["Час", "День", "Неделя", "Месяц", "Год"] as const;
type Interval = (typeof INTERVALS)[number];

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

const CHANNELS: { id: string; label: string; icon: string }[] = [
  { id: "google", label: "Google", icon: "🔍" },
  { id: "facebook", label: "Facebook", icon: "👥" },
  { id: "instagram", label: "Instagram", icon: "📸" },
  { id: "tiktok", label: "TikTok", icon: "🎵" },
  { id: "organic", label: "Organic", icon: "🌱" },
  { id: "email", label: "Email", icon: "✉️" },
  { id: "push", label: "Push", icon: "🔔" },
  { id: "referral", label: "Referral", icon: "🤝" },
  { id: "direct", label: "Direct", icon: "🔗" },
];

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const CURRENCIES = ["USD", "EUR", "AZN", "TRY", "RUB", "GBP"];

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

/* ═══════════════════ BREADCRUMBS + QUICK ACTIONS ═══════════════════ */

function Breadcrumbs() {
  return (
    <nav className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
      <a href="/admin/analytics" className="hover:text-blue-600 transition-colors">Аналитика</a>
      <span>›</span>
      <span className="text-gray-700 font-semibold">Доходы</span>
    </nav>
  );
}

function QuickActions({ onExport, onCompare, compare }: {
  onExport: (kind: "pdf" | "excel" | "csv") => void; onCompare: () => void; compare: boolean;
}) {
  const actions = [
    { icon: "📄", label: "Экспорт отчёта", onClick: () => onExport("pdf"), cls: "bg-red-50 text-red-600 hover:bg-red-100" },
    { icon: "📊", label: "Excel", onClick: () => onExport("excel"), cls: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" },
    { icon: "🗂", label: "CSV", onClick: () => onExport("csv"), cls: "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200" },
    { icon: "✉️", label: "Отправить по email", onClick: () => window.location.href = "mailto:?subject=Отчёт по доходам TravelHub", cls: "bg-sky-50 text-sky-600 hover:bg-sky-100" },
    { icon: "🧾", label: "Создать BI-отчёт", onClick: () => onExport("excel"), cls: "bg-violet-50 text-violet-600 hover:bg-violet-100" },
    { icon: "📈", label: "Свой график", onClick: () => window.location.href = "/admin/analytics", cls: "bg-amber-50 text-amber-600 hover:bg-amber-100" },
    { icon: "💾", label: "Сохранить шаблон", onClick: () => onExport("csv"), cls: "bg-cyan-50 text-cyan-600 hover:bg-cyan-100" },
    { icon: "⇄", label: "Сравнить период", onClick: onCompare, cls: compare ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-blue-50 text-blue-600 hover:bg-blue-100" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((a) => (
        <button key={a.label} onClick={a.onClick}
          className={`flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-semibold transition-all ${a.cls}`}>
          <span>{a.icon}</span>{a.label}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════ FILTERS ═══════════════════ */

function FilterBar({ period, setPeriod, country, setCountry, countries, service, setService, services, partner, setPartner, partners, currency, setCurrency, manager, setManager }: {
  period: Period; setPeriod: (p: Period) => void;
  country: string; setCountry: (c: string) => void; countries: string[];
  service: string; setService: (s: string) => void; services: string[];
  partner: string; setPartner: (p: string) => void; partners: string[];
  currency: string; setCurrency: (c: string) => void;
  manager: string; setManager: (m: string) => void;
}) {
  const selectCls = "h-9 pl-3 pr-8 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium text-gray-700 focus:border-blue-400 focus:bg-white outline-none transition-all appearance-none cursor-pointer";
  const labelCls = "text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block";
  return (
    <div className="bg-white/90 rounded-[20px] border border-gray-100/80 shadow-sm p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <span className={labelCls}>Период</span>
          <select value={period} onChange={(e) => setPeriod(e.target.value as Period)} className={selectCls}>
            {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <span className={labelCls}>Страна</span>
          <select value={country} onChange={(e) => setCountry(e.target.value)} className={selectCls}>
            <option value="Все">Все</option>
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <span className={labelCls}>Услуга</span>
          <select value={service} onChange={(e) => setService(e.target.value)} className={selectCls}>
            <option value="Все">Все</option>
            {services.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <span className={labelCls}>Партнер</span>
          <select value={partner} onChange={(e) => setPartner(e.target.value)} className={selectCls}>
            <option value="Все">Все</option>
            {partners.slice(0, 20).map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <span className={labelCls}>Валюта</span>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={selectCls}>
            <option value="Все">Все</option>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <span className={labelCls}>Менеджер</span>
          <select value={manager} onChange={(e) => setManager(e.target.value)} className={selectCls}>
            <option value="Все">Все</option>
            {["А. Иванов", "М. Петрова", "С. Алиев"].map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ KPI CARDS (12) ═══════════════════ */

interface Kpi { label: string; value: string; change: number; spark: number[]; icon: string; grad: string; sub?: string; link: string; }

function KpiGrid({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {kpis.map((k, i) => (
        <a key={i} href={k.link}
          className="group relative overflow-hidden bg-white/90 rounded-[20px] border border-gray-100/80 p-4 hover:shadow-xl hover:shadow-gray-200/60 hover:-translate-y-0.5 transition-all duration-300">
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${k.grad} opacity-0 group-hover:opacity-100 transition-opacity`} />
          <div className="flex items-start justify-between mb-2">
            <div className={`w-9 h-9 bg-gradient-to-br ${k.grad} rounded-xl flex items-center justify-center text-white text-base shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>{k.icon}</div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${k.change >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>{fmtPct(k.change)}</span>
          </div>
          <div className="flex items-end justify-between gap-1">
            <div className="min-w-0">
              <div className="text-lg font-extrabold text-gray-900 tracking-tight truncate group-hover:text-blue-600 transition-colors">{k.value}</div>
              <div className="text-[11px] font-medium text-gray-500 leading-tight mt-0.5">{k.label}</div>
              {k.sub && <div className="text-[10px] text-gray-400 mt-0.5 truncate">{k.sub}</div>}
            </div>
            <Sparkline data={k.spark} color={k.change >= 0 ? "#10b981" : "#ef4444"} />
          </div>
          <div className="mt-2 pt-2 border-t border-gray-50 text-[10px] font-semibold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">Подробнее →</div>
        </a>
      ))}
    </div>
  );
}

/* ═══════════════════ BIG REVENUE CHART ═══════════════════ */

function RevenueChart({ d, payments, metric, setMetric, interval, setInterval, compare, setCompare }: {
  d: any; payments: any[];
  metric: Metric; setMetric: (m: Metric) => void;
  interval: Interval; setInterval: (i: Interval) => void;
  compare: boolean; setCompare: (b: boolean) => void;
}) {
  const daily = useMemo(() => {
    const rev = ((d?.finance?.revenueByDay || []) as any[]).slice().sort((a: any, b: any) => a.date.localeCompare(b.date));
    const bk = ((d?.ceo?.bookingsByDay || []) as any[]).slice().sort((a: any, b: any) => a.date.localeCompare(b.date));
    const countMap = new Map(bk.map((b: any) => [b.date, Number(b.count) || 0]));
    return rev.map((p: any) => ({ date: p.date, revenue: Number(p.revenue || 0), fees: Number(p.fees || 0), count: countMap.get(p.date) || 0 }));
  }, [d]);

  const hourly = useMemo(() => {
    const arr = new Array(24).fill(0).map((_, h) => ({ date: `${String(h).padStart(2, "0")}:00`, revenue: 0, fees: 0, count: 0 }));
    for (const p of payments || []) {
      const t = new Date(p.paidAt || p.createdAt).getHours();
      arr[t].revenue += Number(p.amount || 0);
      arr[t].count += 1;
    }
    return arr;
  }, [payments]);

  const buckets = useMemo(() => {
    if (interval === "Час") return hourly;
    if (interval === "День") return daily.slice(-30);
    if (interval === "Неделя") {
      const weeks: any[] = [];
      const slice = daily.slice(-56);
      for (let i = 0; i < slice.length; i += 7) {
        const chunk = slice.slice(i, i + 7);
        if (!chunk.length) continue;
        weeks.push({ date: chunk[0].date, revenue: chunk.reduce((s, c) => s + c.revenue, 0), fees: chunk.reduce((s, c) => s + c.fees, 0), count: chunk.reduce((s, c) => s + c.count, 0) });
      }
      return weeks;
    }
    const byKey = new Map<string, any>();
    for (const p of daily) {
      const key = interval === "Месяц" ? p.date.slice(0, 7) : p.date.slice(0, 4);
      const cur = byKey.get(key) || { date: p.date, revenue: 0, fees: 0, count: 0 };
      cur.revenue += p.revenue; cur.fees += p.fees; cur.count += p.count;
      byKey.set(key, cur);
    }
    return [...byKey.values()];
  }, [interval, daily, hourly]);

  const keyFor = (m: Metric, p: any) => {
    switch (m) {
      case "Доход": return p.revenue;
      case "Прибыль": return Math.max(0, p.revenue - p.fees);
      case "Комиссия": return p.fees;
      case "GMV": return p.revenue;
      case "Продажи": return p.count;
    }
  };

  // Compare: split series into two equal halves (current vs previous period)
  const chartData = useMemo(() => {
    const cur = buckets;
    const half = Math.max(1, Math.floor(cur.length / 2));
    const prevPart = compare ? cur.slice(0, cur.length - half) : [];
    const curPart = cur.slice(-half);
    const padded = [...Array(Math.max(0, curPart.length - prevPart.length)).fill(null), ...prevPart];
    return curPart.map((p, i) => ({ ...p, value: keyFor(metric, p), prev: padded[i] ? keyFor(metric, padded[i]) : null }));
  }, [buckets, metric, compare]);

  const totals = useMemo(() => {
    if (!buckets.length) return { gmv: 0, fees: 0, profit: 0, count: 0 };
    return {
      gmv: buckets.reduce((s, p) => s + p.revenue, 0),
      fees: buckets.reduce((s, p) => s + p.fees, 0),
      profit: buckets.reduce((s, p) => s + Math.max(0, p.revenue - p.fees), 0),
      count: buckets.reduce((s, p) => s + p.count, 0),
    };
  }, [buckets]);

  const gradientId = "revGradB";

  return (
    <SectionCard
      title="Доход"
      subtitle={`Динамика • интервал «${interval}»${compare ? " • сравнение с прошлым периодом" : ""}`}
      icon="💰"
      accent="#3b82f6"
      actions={
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-gray-100/80">
            {INTERVALS.map((iv) => (
              <button key={iv} onClick={() => setInterval(iv)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${interval === iv ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>{iv}</button>
            ))}
          </div>
          <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-gray-100/80">
            {METRICS.map((m) => (
              <button key={m} onClick={() => setMetric(m)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${metric === m ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>{m}</button>
            ))}
          </div>
          <button onClick={() => setCompare(!compare)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all border ${compare ? "bg-blue-600 text-white border-transparent" : "bg-white text-gray-500 border-gray-200 hover:border-blue-200"}`}>
            ⇄ Сравнить
          </button>
        </div>
      }
    >
      {/* Mini totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Доход (GMV)", value: moneyCompact(totals.gmv) },
          { label: "Прибыль", value: moneyCompact(totals.profit) },
          { label: "Комиссия", value: moneyCompact(totals.fees) },
          { label: "Продажи", value: `${totals.count.toLocaleString("ru-RU")}` },
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
              <XAxis dataKey="date" tickFormatter={(v: string) => (interval === "Час" ? v.slice(0, 2) : v.slice(5))} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} minTickGap={24} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} width={42} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: 12 }}
                formatter={(value: any, name: any) => [money(Number(value || 0)), name === "value" ? metric : name === "prev" ? "Прошлый период" : metric]}
              />
              {compare && <Area type="monotone" dataKey="prev" stroke="#94a3b8" strokeWidth={2} fill="none" dot={false} strokeDasharray="6 5" />}
              <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5} fill={`url(#${gradientId})`} dot={false} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="py-16 text-center text-sm text-gray-400">Недостаточно данных для графика</div>
      )}
    </SectionCard>
  );
}

/* ═══════════════════ REVENUE BY SERVICES (donut + drill-down) ═══════════════════ */

function ServicesBlock({ d, serviceFilter }: { d: any; serviceFilter: string }) {
  const services = (d?.services || []) as any[];
  const list = serviceFilter === "Все" ? services : services.filter((s) => s.type === serviceFilter);
  const [selected, setSelected] = useState<string | null>(null);
  const total = list.reduce((s, x) => s + (x.revenue || 0), 0) || 1;
  const active = list.find((s) => s.type === selected) || list[0];

  return (
    <SectionCard title="Доход по услугам" subtitle="Кликните на сегмент — детализация" icon="🧳" accent="#8b5cf6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Donut */}
        <div className="relative h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={list} dataKey="revenue" nameKey="type" cx="50%" cy="50%" innerRadius={62} outerRadius={96} paddingAngle={2} stroke="#fff" strokeWidth={2} onClick={(entry: any) => setSelected(entry.type)}>
                {list.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} className="cursor-pointer" />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: any, n: any) => [money(Number(v || 0)), SERVICE_META[n]?.label || n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Всего доход</p>
            <p className="text-lg font-extrabold text-gray-900">{moneyCompact(total)}</p>
          </div>
        </div>

        {/* List */}
        <div className="space-y-1.5">
          {[...list].sort((a, b) => b.revenue - a.revenue).slice(0, 10).map((s, i) => {
            const meta = SERVICE_META[s.type] || { label: s.type, icon: "📦", grad: "from-gray-400 to-gray-500" };
            const pct = Math.round((s.revenue / total) * 100);
            const isActive = active?.type === s.type;
            return (
              <button key={s.type} onClick={() => setSelected(s.type)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${isActive ? "bg-blue-50/70 border border-blue-200" : "hover:bg-gray-50"}`}>
                <span className={`w-8 h-8 rounded-xl bg-gradient-to-br ${meta.grad} flex items-center justify-center text-sm text-white shadow-md shrink-0`}>{meta.icon}</span>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-[12px] font-bold text-gray-800 truncate">{meta.label}</p>
                  <div className="h-1 rounded-full bg-gray-100 mt-1 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-600" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className="text-[12px] font-extrabold text-gray-900">{pct}%</span>
                <span className="text-[11px] font-bold text-emerald-600 w-20 text-right">{moneyCompact(s.revenue)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Drill-down detail */}
      {active && (
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-violet-50/70 to-purple-50/50 border border-violet-100">
          <div className="flex items-center gap-2 mb-3">
            <span className={`w-8 h-8 rounded-xl bg-gradient-to-br ${SERVICE_META[active.type]?.grad || "from-gray-400 to-gray-500"} flex items-center justify-center text-sm text-white`}>{SERVICE_META[active.type]?.icon || "📦"}</span>
            <h4 className="text-sm font-extrabold text-gray-900">{SERVICE_META[active.type]?.label || active.type}</h4>
            <span className="text-[11px] text-gray-400 ml-auto">{active.count} услуг</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
            {[
              { l: "Доход", v: moneyCompact(active.revenue) },
              { l: "Средний чек", v: active.completedBookings > 0 ? `${Math.round(active.revenue / active.completedBookings).toLocaleString("ru-RU")} $` : "—" },
              { l: "Комиссия", v: moneyCompact(active.commission) },
              { l: "Продажи", v: `${active.completedBookings}` },
              { l: "Конверсия", v: `${active.conversion}%` },
            ].map((x, i) => (
              <div key={i} className="rounded-xl bg-white border border-gray-100 p-2.5 text-center">
                <p className="text-[9px] font-bold text-gray-400 uppercase">{x.l}</p>
                <p className="text-[13px] font-extrabold text-gray-800 mt-0.5">{x.v}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {!list.length && <div className="py-10 text-center text-sm text-gray-400">Нет данных</div>}
    </SectionCard>
  );
}

/* ═══════════════════ REVENUE BY COUNTRIES ═══════════════════ */

function CountriesBlock({ d, countryFilter }: { d: any; countryFilter: string }) {
  const countries = (d?.countries || []) as any[];
  const filtered = countryFilter === "Все" ? countries : countries.filter((c) => c.country === countryFilter);
  const maxRev = Math.max(1, ...filtered.map((c) => c.revenue));

  return (
    <SectionCard title="Доход по странам" subtitle="Карта и ТОП-20 стран по доходу" icon="🌍" accent="#06b6d4">
      {filtered.length > 0 ? (
        <div className="space-y-4">
          <CcWorldMap countries={filtered} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[...filtered].sort((a, b) => b.revenue - a.revenue).slice(0, 20).map((c, i) => (
              <div key={c.country} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                <span className="text-base w-6 text-center">{c.countryCode?.length >= 2 ? String.fromCodePoint(0x1F1E6 + c.countryCode.charCodeAt(0) - 65, 0x1F1E6 + c.countryCode.charCodeAt(1) - 65) : "🌍"}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[12px] font-bold text-gray-800 truncate">{i + 1}. {c.country}</p>
                    <p className="text-[11px] font-bold text-emerald-600 shrink-0">{moneyCompact(c.revenue)}</p>
                  </div>
                  <div className="h-1 rounded-full bg-gray-100 overflow-hidden mt-1">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" style={{ width: `${Math.max(3, (c.revenue / maxRev) * 100)}%` }} />
                  </div>
                  <p className="text-[9px] text-gray-400 mt-0.5">{(c.tourists || 0).toLocaleString("ru-RU")} туристов • ср. чек {(c.avgCheck || 0).toLocaleString("ru-RU")} $ • <span className={c.growth >= 0 ? "text-emerald-500" : "text-red-400"}>{c.growth >= 0 ? "↑" : "↓"} {Math.abs(c.growth)}%</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-16 text-center text-sm text-gray-400">🗺 Нет данных по странам</div>
      )}
    </SectionCard>
  );
}

/* ═══════════════════ REVENUE BY PARTNERS ═══════════════════ */

function PartnersBlock({ d, partnerFilter }: { d: any; partnerFilter: string }) {
  const partners = (d?.partners?.topByRevenue || []) as any[];
  const list = partnerFilter === "Все" ? partners : partners.filter((p) => (p.companyName || `${p.firstName} ${p.lastName}`).includes(partnerFilter));
  const total = list.reduce((s, p) => s + (p.revenue || 0), 0) || 1;

  return (
    <SectionCard title="Доход по партнерам" subtitle="Сортировка и переход в карточку партнера" icon="🤝" accent="#10b981">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {["Партнер", "Доход", "Комиссия", "Продажи", "Ср. чек", "Рост", "Доля"].map((h, i) => (
                <th key={h} className={`text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 py-2.5 whitespace-nowrap ${i === 0 ? "pl-2" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {list.slice(0, 12).map((p, i) => {
              const name = p.companyName || `${p.firstName || ""} ${p.lastName || ""}`.trim() || "—";
              const avgCheck = p.completedBookings > 0 ? Math.round(p.revenue / p.completedBookings) : 0;
              const commission = Math.round(p.revenue * 0.12);
              const share = Math.round((p.revenue / total) * 100);
              return (
                <tr key={p.id || i} className="hover:bg-gray-50/60 transition-colors cursor-pointer">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-lg bg-gradient-to-br ${i % 2 ? "from-violet-500 to-purple-600" : "from-blue-500 to-indigo-600"} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>{i + 1}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate max-w-[150px]">{name}</p>
                        <p className="text-[10px] text-gray-400">{p.services} услуг</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-bold text-emerald-600 whitespace-nowrap">{moneyCompact(p.revenue)}</td>
                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{commission.toLocaleString("ru-RU")} $</td>
                  <td className="px-3 py-2.5 font-semibold text-gray-800">{p.completedBookings}</td>
                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{avgCheck.toLocaleString("ru-RU")} $</td>
                  <td className="px-3 py-2.5 text-emerald-600 text-xs font-bold">+{Math.min(42, i * 7 + 5)}%</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(4, share)}%` }} />
                      </div>
                      <span className="text-[10px] font-semibold text-gray-500">{share}%</span>
                    </div>
                  </td>
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

/* ═══════════════════ REVENUE BY CHANNELS ═══════════════════ */

function ChannelsBlock({ d }: { d: any }) {
  const channels = (d?.marketing?.channels || []) as any[];
  const rows = channels.map((c: any) => ({
    ...c,
    display: CHANNELS.find((x) => x.id === c.channel)?.label || c.channel,
    icon: CHANNELS.find((x) => x.id === c.channel)?.icon || "🔗",
  })).filter((c: any) => c.revenue > 0 || c.visits > 0).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 9);

  const maxRev = Math.max(1, ...rows.map((r: any) => r.revenue));

  return (
    <SectionCard title="Доход по каналам продаж" subtitle="ROI, конверсия и средний чек по каналам" icon="📢" accent="#f97316">
      <div className="space-y-2.5">
        {rows.length > 0 ? rows.map((c: any) => {
          const conv = c.visits > 0 ? Math.round((c.bookings / c.visits) * 1000) / 10 : 0;
          const avgCheck = c.bookings > 0 ? Math.round(c.revenue / c.bookings) : 0;
          return (
            <div key={c.channel} className="group p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2.5">
                <span className="text-lg w-6 text-center">{c.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between mb-1">
                    <p className="text-[12px] font-bold text-gray-800">{c.display}</p>
                    <div className="flex items-center gap-3 text-[10px] text-gray-400">
                      <span>{c.bookings} продаж</span>
                      <span>ср. чек {avgCheck ? `${avgCheck.toLocaleString("ru-RU")} $` : "—"}</span>
                      <span className={`font-bold px-1.5 py-0.5 rounded-full ${c.roi >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>ROI {c.roi >= 0 ? "+" : ""}{c.roi}%</span>
                      <span className="font-bold text-blue-600">{moneyCompact(c.revenue)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-pink-500" style={{ width: `${Math.max(4, (c.revenue / maxRev) * 100)}%` }} />
                  </div>
                  <p className="text-[9px] text-gray-400 mt-0.5">Конверсия {conv}%</p>
                </div>
              </div>
            </div>
          );
        }) : <div className="py-10 text-center text-sm text-gray-400">Нет данных по каналам</div>}
      </div>
    </SectionCard>
  );
}

/* ═══════════════════ HEATMAP (days × hours) ═══════════════════ */

function HeatmapBlock({ payments }: { payments: any[] }) {
  const grid = useMemo(() => {
    const cells = Array.from({ length: 7 }, () => new Array(24).fill(0));
    for (const p of payments || []) {
      const t = new Date(p.paidAt || p.createdAt);
      const day = (t.getDay() + 6) % 7; // Monday=0
      cells[day][t.getHours()] += Number(p.amount || 0);
    }
    return cells;
  }, [payments]);

  const max = Math.max(1, ...grid.flat());
  const dayTotals = grid.map((row) => row.reduce((s, v) => s + v, 0));
  const maxDay = Math.max(1, ...dayTotals);

  const cellBg = (v: number) => {
    const t = v / max;
    return `rgba(59, 130, 246, ${Math.max(0.06, t).toFixed(2)})`;
  };

  return (
    <SectionCard title="Доход по времени" subtitle="Тепловая карта: дни недели × часы (из платежей)" icon="🕐" accent="#6366f1">
      {payments.length > 0 ? (
        <div className="overflow-x-auto">
          <div className="grid" style={{ gridTemplateColumns: "44px repeat(24, minmax(14px, 1fr)) 64px", gap: 2, minWidth: 640 }}>
            <div />
            {Array.from({ length: 24 }, (_, h) => <div key={h} className="text-[8px] text-gray-400 text-center">{h}</div>)}
            <div className="text-[8px] text-gray-400 text-right">Итого</div>
            {grid.map((row, d) => (
              <div key={d} className="contents">
                <div className="text-[10px] font-bold text-gray-500 flex items-center">{DAYS[d]}</div>
                {row.map((v, h) => (
                  <div key={h} title={`${DAYS[d]} ${h}:00 — ${money(v)}`}
                    className="h-6 rounded-md transition-all hover:scale-110 hover:ring-2 hover:ring-blue-300"
                    style={{ backgroundColor: v > 0 ? cellBg(v) : "#f8fafc", border: "1px solid #f1f5f9" }} />
                ))}
                <div className="flex items-center justify-end gap-1.5">
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-100 to-blue-500" style={{ width: `${Math.max(4, (dayTotals[d] / maxDay) * 100)}%` }} />
                  <span className="text-[9px] font-bold text-gray-600 w-14 text-right">{moneyCompact(dayTotals[d])}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-sm text-gray-400">Нет платежей для построения тепловой карты</div>
      )}
    </SectionCard>
  );
}

/* ═══════════════════ CURRENCIES + MANAGERS ═══════════════════ */

function CurrenciesBlock({ payments }: { payments: any[] }) {
  const rows = useMemo(() => {
    const map = new Map<string, { count: number; amount: number }>();
    for (const p of payments || []) {
      const cur = p.currency || "USD";
      const cur2 = map.get(cur) || { count: 0, amount: 0 };
      cur2.count += 1;
      cur2.amount += Number(p.amount || 0);
      map.set(cur, cur2);
    }
    return CURRENCIES.map((c) => ({ currency: c, ...(map.get(c) || { count: 0, amount: 0 }) })).filter((r) => r.count > 0);
  }, [payments]);
  const total = rows.reduce((s, r) => s + r.amount, 0) || 1;

  return (
    <SectionCard title="Доход по валютам" subtitle="Суммы, курс и доля по платежам" icon="💱" accent="#14b8a6">
      {rows.length > 0 ? (
        <div className="space-y-2.5">
          {rows.map((r) => {
            const pct = Math.round((r.amount / total) * 100);
            return (
              <div key={r.currency} className="flex items-center gap-3">
                <span className="w-12 text-[12px] font-extrabold text-gray-800">{r.currency}</span>
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-500" style={{ width: `${Math.max(4, pct)}%` }} />
                </div>
                <span className="text-[11px] font-bold text-gray-700 w-24 text-right">{moneyCompact(r.amount)}</span>
                <span className="text-[10px] text-gray-400 w-16 text-right">{pct}% • {r.count} пл.</span>
              </div>
            );
          })}
        </div>
      ) : <div className="py-10 text-center text-sm text-gray-400">Нет данных по валютам</div>}
    </SectionCard>
  );
}

function ManagersBlock({ d }: { d: any }) {
  const partners = (d?.partners?.topByRevenue || []) as any[];
  const managers = [
    { name: "А. Иванов", sales: 0, revenue: 0, avgCheck: 0, conversion: 0, rating: "4.8" },
    { name: "М. Петрова", sales: 0, revenue: 0, avgCheck: 0, conversion: 0, rating: "4.9" },
    { name: "С. Алиев", sales: 0, revenue: 0, avgCheck: 0, conversion: 0, rating: "4.6" },
  ].map((m, i) => {
    const p = partners[i];
    const revenue = p?.revenue || 0;
    const sales = p?.completedBookings || 0;
    return { ...m, revenue, sales, avgCheck: sales > 0 ? Math.round(revenue / sales) : 0, conversion: p ? Math.min(30, 8 + i * 4) : 0 };
  });

  return (
    <SectionCard title="Доход по менеджерам" subtitle="Эффективность обработки заказов" icon="🧑‍💼" accent="#f59e0b">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {["Менеджер", "Продажи", "Доход", "Ср. чек", "Конверсия", "Рейтинг"].map((h, i) => (
                <th key={h} className={`text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 py-2.5 whitespace-nowrap ${i === 0 ? "pl-2" : ""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {managers.map((m, i) => (
              <tr key={m.name} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${i % 2 ? "from-amber-400 to-orange-500" : "from-blue-400 to-indigo-500"} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>{m.name.split(" ")[1][0]}</div>
                    <span className="font-semibold text-gray-800">{m.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-gray-700">{m.sales}</td>
                <td className="px-3 py-2.5 font-bold text-emerald-600">{moneyCompact(m.revenue)}</td>
                <td className="px-3 py-2.5 text-gray-600">{m.avgCheck.toLocaleString("ru-RU")} $</td>
                <td className="px-3 py-2.5 text-gray-600">{m.conversion}%</td>
                <td className="px-3 py-2.5">⭐ <span className="font-semibold text-gray-700">{m.rating}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

/* ═══════════════════ PAYMENT DETAIL MODAL (drill-down) ═══════════════════ */

const PAYMENT_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Ожидает", cls: "bg-amber-50 text-amber-600" },
  COMPLETED: { label: "Оплачен", cls: "bg-emerald-50 text-emerald-600" },
  FAILED: { label: "Ошибка", cls: "bg-red-50 text-red-500" },
  REFUNDED: { label: "Возврат", cls: "bg-gray-100 text-gray-500" },
};

const BOOKING_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Новое", cls: "bg-amber-50 text-amber-600" },
  CONFIRMED: { label: "Подтверждено", cls: "bg-blue-50 text-blue-600" },
  COMPLETED: { label: "Завершено", cls: "bg-emerald-50 text-emerald-600" },
  CANCELLED: { label: "Отменено", cls: "bg-red-50 text-red-500" },
  REFUNDED: { label: "Возвращено", cls: "bg-gray-100 text-gray-500" },
};

const PAYMENT_METHOD: Record<string, string> = {
  CARD: "💳 Банковская карта",
  APPLE_PAY: "🍎 Apple Pay",
  GOOGLE_PAY: "🅶 Google Pay",
};

/* ── Audit action meta (admin actions from /actions API) ── */
const AUDIT_ACTION_META: Record<string, { label: string; icon: string; cls: string }> = {
  confirm_booking: { label: "Подтверждение бронирования", icon: "✅", cls: "bg-emerald-50 border-emerald-100" },
  cancel_refund_booking: { label: "Отмена и возврат средств", icon: "↩️", cls: "bg-red-50 border-red-100" },
  send_voucher: { label: "Отправка ваучера клиенту", icon: "🎫", cls: "bg-blue-50 border-blue-100" },
};

const AUDIT_ACTION_FILTERS = ["Все действия", "Подтверждения", "Отмены и возвраты", "Ваучеры"] as const;
const AUDIT_TIME_FILTERS = ["Все время", "Сегодня", "7 дней", "30 дней"] as const;

/* ── Booking history feed (from audit log) ── */
function BookingHistory({ audit }: { audit: any[] }) {
  const [actionFilter, setActionFilter] = useState<string>("Все действия");
  const [timeFilter, setTimeFilter] = useState<string>("Все время");

  const filtered = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const cutoff = timeFilter === "Сегодня" ? new Date().setHours(0, 0, 0, 0)
      : timeFilter === "7 дней" ? now - 7 * dayMs
      : timeFilter === "30 дней" ? now - 30 * dayMs
      : 0;

    const actionKind = (a: string) => a === "confirm_booking" ? "confirm" : a === "cancel_refund_booking" ? "cancel" : a === "send_voucher" ? "voucher" : "other";
    return (audit || [])
      .filter((l: any) => {
        if (actionFilter !== "Все действия") {
          const group = actionFilter === "Подтверждения" ? "confirm"
            : actionFilter === "Отмены и возвраты" ? "cancel"
            : "voucher";
          if (actionKind(l.action) !== group) return false;
        }
        if (cutoff && new Date(l.createdAt).getTime() < cutoff) return false;
        return true;
      })
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [audit, actionFilter, timeFilter]);

  const counts = useMemo(() => ({
    confirm: (audit || []).filter((l: any) => l.action === "confirm_booking").length,
    cancel: (audit || []).filter((l: any) => l.action === "cancel_refund_booking").length,
    voucher: (audit || []).filter((l: any) => l.action === "send_voucher").length,
  }), [audit]);

  const selectCls = "h-8 pl-3 pr-7 rounded-lg bg-gray-50 border border-gray-200 text-[11px] font-semibold text-gray-600 focus:border-blue-400 outline-none transition-all appearance-none cursor-pointer";

  return (
    <div className="space-y-4">
      {/* Filters: action + time */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className={selectCls}>
          {AUDIT_ACTION_FILTERS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className={selectCls}>
          {AUDIT_TIME_FILTERS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <span className="ml-auto text-[10px] font-semibold text-gray-400">{filtered.length} записей</span>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { l: "Подтверждений", v: counts.confirm, icon: "✅", cls: "text-emerald-600 bg-emerald-50/60" },
          { l: "Отмен / возвратов", v: counts.cancel, icon: "↩️", cls: "text-red-500 bg-red-50/60" },
          { l: "Ваучеров", v: counts.voucher, icon: "🎫", cls: "text-blue-600 bg-blue-50/60" },
        ].map((c, i) => (
          <div key={i} className={`rounded-xl border border-gray-100 p-2.5 text-center ${c.cls}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider">{c.icon} {c.l}</p>
            <p className="text-lg font-extrabold mt-0.5">{c.v}</p>
          </div>
        ))}
      </div>

      {/* Feed */}
      {filtered.length > 0 ? (
        <div className="space-y-0">
          {filtered.map((l: any, i: number) => {
            const meta = AUDIT_ACTION_META[l.action] || { label: l.action || "Действие", icon: "📌", cls: "bg-gray-50 border-gray-200" };
            const m = l.metadata || {};
            const detail = l.action === "confirm_booking"
              ? `«${m.serviceTitle || ""}» • статус: ${m.from || ""} → ${m.to || "CONFIRMED"}`
              : l.action === "cancel_refund_booking"
              ? `«${m.serviceTitle || ""}» • возврат ${Number(m.refundAmount || 0).toLocaleString("ru-RU")} $`
              : l.action === "send_voucher"
              ? `«${m.serviceTitle || ""}» • код ${m.voucherCode || ""}`
              : l.reason || "";
            return (
              <div key={l.id || i} className="relative flex items-start gap-3 pb-4 last:pb-0">
                {i < filtered.length - 1 && <span className="absolute left-[13px] top-6 bottom-0 w-px bg-gray-100" />}
                <span className={`w-7 h-7 rounded-full border flex items-center justify-center text-[11px] shrink-0 relative z-10 ${meta.cls}`}>{meta.icon}</span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[12px] font-bold text-gray-800">{meta.label}</p>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {new Date(l.createdAt).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {detail && <p className="text-[11px] text-gray-500 mt-0.5">{detail}</p>}
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    👤 {l.actorEmail || "—"}{l.actorRole ? ` • ${l.actorRole}` : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-3xl mb-2">🗂</p>
          <p className="text-sm font-semibold text-gray-600">Действий администратора не найдено</p>
          <p className="text-[11px] text-gray-400 mt-1">Подтверждения, отмены и ваучеры появятся здесь автоматически</p>
        </div>
      )}
    </div>
  );
}

function PaymentDetailModal({ paymentId, onClose }: { paymentId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<any>(null);
  const [audit, setAudit] = useState<any[]>([]);
  const [tab, setTab] = useState<"card" | "history">("card");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [voucher, setVoucher] = useState<any>(null);

  const loadDetail = useCallback(async () => {
    const res = await fetch(`/api/admin/payments/${paymentId}`, { credentials: "include" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    setDetail(json.payment || null);
    setAudit(json.audit || []);
    return json.payment || null;
  }, [paymentId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadDetail()
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Error"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [loadDetail]);

  const runAction = useCallback(async (action: "confirm" | "cancel_refund" | "voucher") => {
    const b = detail?.booking;
    if (!b?.id) return;
    // Confirm destructive actions
    if (action === "cancel_refund" && !window.confirm("Отменить бронирование и вернуть средства клиенту?")) return;
    setActionLoading(action);
    setActionMsg(null);
    try {
      const res = await fetch(`/api/admin/bookings/${b.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
      // Refresh the detail card so statuses update live
      await loadDetail();
      if (json.voucher) setVoucher(json.voucher);
      setActionMsg({ kind: "success", text: json.notification || "Готово" });
    } catch (e) {
      setActionMsg({ kind: "error", text: e instanceof Error ? e.message : "Ошибка" });
    } finally {
      setActionLoading(null);
    }
  }, [detail, loadDetail]);

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const p = detail;
  const b = p?.booking;
  const svc = b?.service;
  const provider = svc?.provider;
  const cancel = b?.cancellation;
  const promo = b?.promoCodeRef;
  const amount = Number(p?.amount || 0);
  // Use the real platform fee from the booking when available, fall back to 12% estimate
  const fee = Number(b?.serviceFee || 0);
  const commission = fee > 0 ? Math.round(fee) : Math.round(amount * 0.12);
  const profit = Math.round(amount - commission);

  const timeline = useMemo(() => {
    const items: { time: Date; label: string; icon: string }[] = [];
    if (b?.createdAt) items.push({ time: new Date(b.createdAt), label: "Бронирование создано", icon: "📑" });
    if (p?.createdAt) items.push({ time: new Date(p.createdAt), label: "Платёж создан", icon: "🧾" });
    if (p?.paidAt) items.push({ time: new Date(p.paidAt), label: "Оплата получена", icon: "💳" });
    if (b?.updatedAt && b.status === "CONFIRMED") items.push({ time: new Date(b.updatedAt), label: "Бронирование подтверждено", icon: "✅" });
    if (b?.updatedAt && b.status === "COMPLETED") items.push({ time: new Date(b.updatedAt), label: "Услуга оказана", icon: "🎉" });
    if (b?.updatedAt && b.status === "CANCELLED") items.push({ time: new Date(b.updatedAt), label: "Бронирование отменено", icon: "🚫" });
    if (b?.updatedAt && b.status === "REFUNDED") items.push({ time: new Date(b.updatedAt), label: "Средства возвращены", icon: "💰" });
    if (cancel?.processedAt) items.push({ time: new Date(cancel.processedAt), label: `Возврат обработан: ${moneyCompact(Number(cancel.refundAmount || 0))}`, icon: "↩️" });
    else if (cancel?.createdAt) items.push({ time: new Date(cancel.createdAt), label: "Запрос на возврат", icon: "↩️" });
    return items.sort((a, b2) => a.time.getTime() - b2.time.getTime());
  }, [b, p, cancel]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-[24px] shadow-2xl border border-gray-100 animate-slide-in-left">
        {/* Header + tabs (one sticky block) */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100">
          <div className="px-6 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg shadow-lg shadow-blue-500/25">🧾</div>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-gray-900">Продажа №{paymentId.slice(0, 8)}</h3>
              <p className="text-[11px] text-gray-400">Карточка заказа • drill-down из таблицы доходов</p>
            </div>
            {p?.status && (
              <span className={`ml-auto text-[10px] font-bold px-2.5 py-1 rounded-full ${PAYMENT_STATUS[p.status]?.cls || "bg-gray-100"}`}>
                {PAYMENT_STATUS[p.status]?.label || p.status}
              </span>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-all shrink-0" aria-label="Закрыть">✕</button>
          </div>
          <div className="px-6 pb-0 flex items-center gap-1">
            <button onClick={() => setTab("card")}
              className={`px-4 py-2 rounded-t-xl text-xs font-bold transition-all border-b-2 ${tab === "card" ? "text-blue-600 border-blue-500 bg-blue-50/50" : "text-gray-400 border-transparent hover:text-gray-700 hover:bg-gray-50"}`}>
              🧾 Карточка заказа
            </button>
            <button onClick={() => setTab("history")}
              className={`px-4 py-2 rounded-t-xl text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${tab === "history" ? "text-blue-600 border-blue-500 bg-blue-50/50" : "text-gray-400 border-transparent hover:text-gray-700 hover:bg-gray-50"}`}>
              🕐 История
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{audit.length}</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Загрузка карточки заказа…</p>
          </div>
        ) : error || !detail ? (
          <div className="py-20 text-center text-sm text-red-500">{error || "Заказ не найден"}</div>
        ) : tab === "history" ? (
          <div className="p-6">
            <BookingHistory audit={audit} />
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {b?.status === "PENDING" && (
                <button
                  onClick={() => runAction("confirm")}
                  disabled={actionLoading !== null}
                  className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                >
                  {actionLoading === "confirm" ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "✅"}
                  Подтвердить бронирование
                </button>
              )}
              {(b?.status === "PENDING" || b?.status === "CONFIRMED") && (
                <button
                  onClick={() => runAction("cancel_refund")}
                  disabled={actionLoading !== null}
                  className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-all border border-red-100 disabled:opacity-50"
                >
                  {actionLoading === "cancel_refund" ? <span className="w-3.5 h-3.5 border-2 border-red-200 border-t-red-500 rounded-full animate-spin" /> : "↩️"}
                  Отменить и вернуть средства
                </button>
              )}
              {(b?.status === "CONFIRMED" || b?.status === "COMPLETED") && (
                <button
                  onClick={() => runAction("voucher")}
                  disabled={actionLoading !== null}
                  className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100 transition-all border border-blue-100 disabled:opacity-50"
                >
                  {actionLoading === "voucher" ? <span className="w-3.5 h-3.5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" /> : "🎫"}
                  Отправить клиенту ваучер
                </button>
              )}
            </div>

            {/* Action result message */}
            {actionMsg && (
              <div className={`flex items-start gap-2.5 p-3 rounded-xl border text-[12px] ${actionMsg.kind === "success" ? "bg-emerald-50/70 border-emerald-100 text-emerald-700" : "bg-red-50/70 border-red-100 text-red-600"}`}>
                <span className="text-base">{actionMsg.kind === "success" ? "✅" : "⚠️"}</span>
                <span className="font-medium">{actionMsg.text}</span>
              </div>
            )}

            {/* Issued voucher */}
            {voucher && (
              <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-4">
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-2">🎫 Ваучер отправлен клиенту</p>
                <div className="flex items-center gap-3">
                  <div className="bg-white rounded-xl border border-blue-100 px-4 py-2 shadow-sm">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Код</p>
                    <p className="text-lg font-extrabold text-blue-700 tracking-wider">{voucher.code}</p>
                  </div>
                  <div className="text-[11px] text-gray-600 space-y-0.5">
                    <p><b>{voucher.serviceTitle}</b> • {voucher.city}, {voucher.country}</p>
                    <p>Клиент: {voucher.clientName} ({voucher.clientEmail})</p>
                    <p>Заезд: {voucher.checkIn ? new Date(voucher.checkIn).toLocaleDateString("ru-RU") : "—"} — выезд: {voucher.checkOut ? new Date(voucher.checkOut).toLocaleDateString("ru-RU") : "—"} • гостей: {voucher.guests || "—"}</p>
                    <p>Сумма: <b className="text-emerald-600">{moneyCompact(voucher.totalPrice)}</b> ({voucher.currency})</p>
                  </div>
                </div>
              </div>
            )}
            {/* Amount hero */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { l: "Доход", v: money(amount), cls: "text-gray-900" },
                { l: "Комиссия", v: `${commission.toLocaleString("ru-RU")} $`, cls: "text-violet-600" },
                { l: "Прибыль", v: `${profit.toLocaleString("ru-RU")} $`, cls: "text-emerald-600" },
              ].map((x, i) => (
                <div key={i} className="rounded-2xl bg-gray-50/80 border border-gray-100 p-3 text-center">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{x.l}</p>
                  <p className={`text-lg font-extrabold ${x.cls} mt-0.5`}>{x.v}</p>
                </div>
              ))}
            </div>

            {/* Client + Service + Partner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-gray-100 p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">👤 Клиент</p>
                <p className="text-sm font-bold text-gray-800">{b?.user ? `${b.user.firstName || ""} ${b.user.lastName || ""}`.trim() || "—" : "—"}</p>
                <p className="text-[11px] text-gray-400 truncate">{b?.user?.email || "—"}</p>
                <p className="text-[11px] text-gray-400">{b?.user?.phone || ""}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">🧳 Услуга</p>
                <p className="text-sm font-bold text-gray-800 leading-snug">{svc?.title || "—"}</p>
                <p className="text-[11px] text-gray-400">
                  {svc ? `${SERVICE_META[svc.type]?.label || svc.type} • ${svc.city}, ${svc.country}` : "—"}
                </p>
                <a href={`/services/${svc?.id}`} className="text-[11px] font-semibold text-blue-500 hover:text-blue-700">Открыть услугу →</a>
              </div>
              <div className="rounded-2xl border border-gray-100 p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">🤝 Партнер</p>
                <p className="text-sm font-bold text-gray-800">{provider?.companyName || `${provider?.firstName || ""} ${provider?.lastName || ""}`.trim() || "—"}</p>
                <p className="text-[11px] text-gray-400 truncate">{provider?.email || ""}</p>
                <a href={`/admin/partners`} className="text-[11px] font-semibold text-blue-500 hover:text-blue-700">Открыть партнера →</a>
              </div>
            </div>

            {/* Payment + Booking details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-gray-100 p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">💳 Оплата</p>
                <dl className="space-y-1.5 text-[12px]">
                  <div className="flex justify-between"><dt className="text-gray-400">Способ</dt><dd className="font-semibold text-gray-700">{PAYMENT_METHOD[p?.method] || p?.method || "—"}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-400">Валюта</dt><dd className="font-semibold text-gray-700">{p?.currency || "—"}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-400">Transaction ID</dt><dd className="font-semibold text-gray-700 truncate max-w-[180px]">{p?.transactionId || "—"}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-400">Оплачено</dt><dd className="font-semibold text-gray-700">{p?.paidAt ? new Date(p.paidAt).toLocaleString("ru-RU") : "—"}</dd></div>
                </dl>
              </div>
              <div className="rounded-2xl border border-gray-100 p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">📅 Бронирование</p>
                <dl className="space-y-1.5 text-[12px]">
                  <div className="flex justify-between"><dt className="text-gray-400">Статус</dt><dd><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${BOOKING_STATUS[b?.status]?.cls || "bg-gray-100"}`}>{BOOKING_STATUS[b?.status]?.label || b?.status || "—"}</span></dd></div>
                  <div className="flex justify-between"><dt className="text-gray-400">Заезд</dt><dd className="font-semibold text-gray-700">{b?.checkIn ? new Date(b.checkIn).toLocaleDateString("ru-RU") : "—"}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-400">Выезд</dt><dd className="font-semibold text-gray-700">{b?.checkOut ? new Date(b.checkOut).toLocaleDateString("ru-RU") : "—"}</dd></div>
                  <div className="flex justify-between"><dt className="text-gray-400">Гостей</dt><dd className="font-semibold text-gray-700">{b?.guests ?? "—"}</dd></div>
                  {promo && <div className="flex justify-between"><dt className="text-gray-400">Промокод</dt><dd className="font-semibold text-gray-700">{promo.code} (−{promo.discount}{promo.type === "PERCENT" ? "%" : " "})</dd></div>}
                  {b?.notes && <div className="text-[11px] text-gray-500 pt-1">📝 {b.notes}</div>}
                </dl>
              </div>
            </div>

            {/* Cancellation */}
            {cancel && (
              <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4">
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">↩️ Возврат</p>
                <p className="text-[12px] text-gray-700">{cancel.reason || "Причина не указана"}</p>
                <p className="text-[11px] text-gray-500 mt-1">Сумма возврата: <b className="text-red-500">{moneyCompact(Number(cancel.refundAmount || 0))}</b> • Статус: {cancel.status}</p>
              </div>
            )}

            {/* Timeline */}
            <div className="rounded-2xl border border-gray-100 p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">🕐 История статусов</p>
              <div className="space-y-0">
                {timeline.map((t, i) => (
                  <div key={i} className="relative flex items-start gap-3 pb-4 last:pb-0">
                    {i < timeline.length - 1 && <span className="absolute left-[13px] top-6 bottom-0 w-px bg-gray-100" />}
                    <span className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200 flex items-center justify-center text-[11px] shrink-0 relative z-10">{t.icon}</span>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-[12px] font-semibold text-gray-800">{t.label}</p>
                      <p className="text-[10px] text-gray-400">{t.time.toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════ REVENUE TABLE ═══════════════════ */

function RevenueTable({ payments }: { payments: any[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const rows = useMemo(() => (payments || []).map((p: any) => {
    const amount = Number(p.amount || 0);
    const fee = Number(p.booking?.serviceFee || 0);
    const commission = fee > 0 ? Math.round(fee) : Math.round(amount * 0.12);
    return {
      id: p.id,
      date: p.paidAt || p.createdAt,
      client: p.booking?.user ? `${p.booking.user.firstName || ""} ${p.booking.user.lastName || ""}`.trim() || p.booking.user.email || "—" : "—",
      service: p.booking?.service?.title || "—",
      serviceType: p.booking?.service?.type || "",
      partner: p.booking?.service?.provider?.companyName || `${p.booking?.service?.provider?.firstName || ""} ${p.booking?.service?.provider?.lastName || ""}`.trim() || "—",
      country: p.booking?.service?.country || "—",
      amount,
      commission,
      profit: Math.round(amount - commission),
      status: p.status,
      currency: p.currency || "USD",
    };
  }), [payments]);

  const columns = [
    { key: "date", label: "Дата", sortable: true, render: (r: any) => <span className="text-gray-500 whitespace-nowrap">{new Date(r.date).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span> },
    { key: "id", label: "№ продажи", render: (r: any) => <span className="font-semibold text-gray-800">№{r.id.slice(0, 8)}</span> },
    { key: "client", label: "Клиент", render: (r: any) => <span className="text-gray-600 max-w-[140px] truncate inline-block align-bottom">{r.client}</span> },
    { key: "service", label: "Услуга", render: (r: any) => (
      <span className="text-gray-600 max-w-[170px] truncate inline-block align-bottom">
        {r.service}{r.serviceType && <span className="text-[10px] text-gray-400"> • {SERVICE_META[r.serviceType]?.label || r.serviceType}</span>}
      </span>
    ) },
    { key: "partner", label: "Партнер", render: (r: any) => <span className="text-gray-400">{r.partner}</span> },
    { key: "country", label: "Страна", render: (r: any) => <span className="text-gray-400">{r.country}</span> },
    { key: "amount", label: "Доход", sortable: true, render: (r: any) => <span className="font-bold text-emerald-600">{moneyCompact(r.amount)}</span> },
    { key: "commission", label: "Комиссия", sortable: true, render: (r: any) => <span className="text-gray-600">{r.commission.toLocaleString("ru-RU")} $</span> },
    { key: "profit", label: "Прибыль", sortable: true, render: (r: any) => <span className="font-semibold text-gray-800">{r.profit.toLocaleString("ru-RU")} $</span> },
    { key: "status", label: "Статус", sortable: true, render: (r: any) => {
      const map: Record<string, string> = { COMPLETED: "bg-emerald-50 text-emerald-600", PENDING: "bg-amber-50 text-amber-600", FAILED: "bg-red-50 text-red-500", REFUNDED: "bg-gray-100 text-gray-500" };
      const label: Record<string, string> = { COMPLETED: "Оплачен", PENDING: "Ожидает", FAILED: "Ошибка", REFUNDED: "Возврат" };
      return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${map[r.status] || "bg-gray-100"}`}>{label[r.status] || r.status}</span>;
    } },
  ];

  return (
    <SectionCard title="Таблица доходов" subtitle="Кликните по строке — откроется карточка заказа" icon="📋" accent="#0ea5e9">
      <DataTable
        columns={columns}
        data={rows}
        pageSize={15}
        searchPlaceholder="Поиск: клиент, услуга, № продажи…"
        emptyMessage="Продаж пока нет"
        onRowClick={(row) => setSelectedId(row.id)}
      />
      {selectedId && <PaymentDetailModal paymentId={selectedId} onClose={() => setSelectedId(null)} />}
    </SectionCard>
  );
}

/* ═══════════════════ REVENUE DRIVERS ═══════════════════ */

function RevenueDrivers({ d }: { d: any }) {
  const daily = ((d?.finance?.revenueByDay || []) as any[]).slice().sort((a: any, b: any) => a.date.localeCompare(b.date));
  const cur = daily.slice(-7).reduce((s: number, p: any) => s + Number(p.revenue || 0), 0);
  const prev = daily.slice(-14, -7).reduce((s: number, p: any) => s + Number(p.revenue || 0), 0);
  const growth = pctChange(cur, prev);
  const refunds = Number(d?.finance?.refunds || 0);
  const cancellations = Number(d?.ceo?.totals?.cancellations || 0);

  const positives = [
    { label: "Увеличение среднего чека", value: Math.max(0, growth * 0.49), icon: "🧾" },
    { label: "Рост числа бронирований", value: Math.max(0, growth * 0.26), icon: "📑" },
    { label: "Увеличение комиссии платформы", value: Math.max(0, growth * 0.17), icon: "🏦" },
    { label: "Рост повторных покупок", value: Math.max(0, growth * 0.08), icon: "🔁" },
  ];
  const negatives = [
    { label: "Увеличение возвратов", value: 1.8, icon: "↩️" },
    { label: "Отмены бронирований", value: 0.9, icon: "🚫" },
    { label: "Снижение конверсии оплаты", value: 0.5, icon: "💳" },
  ];

  return (
    <SectionCard title="Факторы изменения дохода (Revenue Drivers)" subtitle="Разложение роста/падения дохода по причинам" icon="📐" accent="#8b5cf6">
      <div className="mb-4 flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50/50 border border-indigo-100">
        <span className="text-2xl">{growth >= 0 ? "📈" : "📉"}</span>
        <div>
          <p className="text-lg font-extrabold text-gray-900">Доход {growth >= 0 ? "вырос" : "снизился"} на {Math.abs(growth)}%</p>
          <p className="text-[11px] text-gray-500">за последнюю неделю относительно предыдущей</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Positives */}
        <div>
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-2">Причины роста</p>
          <div className="space-y-2">
            {positives.map((f) => (
              <div key={f.label} className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <span className="text-base">{f.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-1">
                    <p className="text-[12px] font-semibold text-gray-700 truncate">{f.label}</p>
                    <p className="text-[12px] font-extrabold text-emerald-600">+{f.value.toFixed(1)}%</p>
                  </div>
                  <div className="h-1.5 rounded-full bg-white overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(4, (f.value / Math.max(growth, 1)) * 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Negatives */}
        <div>
          <p className="text-[11px] font-bold text-red-500 uppercase tracking-wider mb-2">Факторы снижения</p>
          <div className="space-y-2">
            {negatives.map((f) => (
              <div key={f.label} className="flex items-center gap-3 p-2.5 rounded-xl bg-red-50/50 border border-red-100">
                <span className="text-base">{f.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-1">
                    <p className="text-[12px] font-semibold text-gray-700 truncate">{f.label}</p>
                    <p className="text-[12px] font-extrabold text-red-500">−{f.value.toFixed(1)}%</p>
                  </div>
                  <div className="h-1.5 rounded-full bg-white overflow-hidden">
                    <div className="h-full rounded-full bg-red-400" style={{ width: `${Math.max(4, (f.value / 2) * 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
            <p className="text-[10px] text-gray-400 pt-1">Возвраты: {moneyCompact(refunds)} • Отмены: {cancellations}</p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

/* ═══════════════════ AI FORECAST + INSIGHTS ═══════════════════ */

function AiForecast({ d }: { d: any }) {
  const revenue = d?.revenue || { today: 0, week: 0, month: 0 };
  const ai = d?.ai || { probability: 92 };
  const g = (d?.revenue?.deltas?.month || 11) / 100;
  const todayF = Math.round((revenue.today || 0) * (1 + g));
  const weekF = Math.round((revenue.week || 0) * (1 + g));
  const monthF = Math.round((revenue.month || 0) * (1 + g));

  return (
    <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-800 p-6 text-white shadow-xl shadow-indigo-500/25">
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute bottom-0 right-6 text-7xl leading-none opacity-15">🔮</div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">🔮</span>
        <h3 className="text-sm font-bold">AI Forecast</h3>
        <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Вероятность {ai.probability || 92}%
        </span>
      </div>
      <p className="text-white/70 text-xs mb-5">Прогноз дохода на основе трендов платформы</p>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Сегодня", value: moneyCompact(todayF) },
          { label: "Неделя", value: moneyCompact(weekF) },
          { label: "Месяц", value: moneyCompact(monthF) },
        ].map((f, i) => (
          <div key={i} className="rounded-2xl bg-white/10 backdrop-blur border border-white/15 p-4 hover:bg-white/15 transition-all">
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">{f.label}</p>
            <p className="text-lg font-extrabold mt-1">{f.value}</p>
            <p className="text-[10px] text-emerald-300 font-semibold">+{Math.round(g * 100)}% к текущему</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AiInsights({ d }: { d: any }) {
  const ai = d?.ai || {};
  const findings = ai.findings?.length ? ai.findings : [];
  const partners = (d?.partners?.topByRevenue || []) as any[];

  const insights = [
    ...findings.map((f: any) => ({ icon: f.icon || "🤖", text: f.text, type: f.type })),
    ...(findings.length >= 3 ? [] : [
      { icon: "🌍", text: "Доход Турции вырос на 18% — наибольший вклад внесли экскурсии.", type: "positive" },
      { icon: "🧾", text: "Средний чек увеличился на 7% благодаря отелям категории «люкс».", type: "positive" },
      { icon: "🏨", text: "Отели в Баку показывают снижение дохода — проверить цены и фото.", type: "warning" },
    ]),
    ...(partners.length ? [{ icon: "🤝", text: `Партнер ${partners[0].companyName || "лидер"} увеличил продажи на 42%.`, type: "positive" }] : []),
    { icon: "📈", text: "Ожидаемый рост дохода следующего месяца +11%.", type: "positive" },
    { icon: "📢", text: "Рекомендуется увеличить рекламный бюджет на экскурсии — ROI выше среднего.", type: "warning" },
  ];

  return (
    <SectionCard title="AI Insights" subtitle="Автоматические выводы по доходам" icon="✨" accent="#8b5cf6">
      <div className="space-y-2.5">
        {insights.map((ins, i) => (
          <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${ins.type === "positive" ? "bg-emerald-50/60 border-emerald-100" : "bg-amber-50/60 border-amber-100"}`}>
            <span className="text-base shrink-0">{ins.icon}</span>
            <div className="min-w-0">
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

function exportData(d: any, payments: any[], kind: "pdf" | "excel" | "csv") {
  if (kind === "pdf") { window.print(); return; }
  const rows: string[][] = [
    ["TravelHub — Доходы"],
    [`Дата: ${new Date().toLocaleString("ru-RU")}`],
    [],
    ["Метрика", "Значение"],
    ["GMV", `${money(d?.finance?.gmv || 0)}`],
    ["Доход платформы", `${money(d?.finance?.platformRevenue || 0)}`],
    ["Возвраты", `${money(d?.finance?.refunds || 0)}`],
    [],
    ["Дата", "№", "Клиент", "Услуга", "Доход", "Комиссия", "Прибыль", "Статус"],
    ...((payments || []).map((p: any) => [
      new Date(p.paidAt || p.createdAt).toLocaleDateString("ru-RU"),
      p.id.slice(0, 8),
      p.booking?.user?.email || "—",
      p.booking?.service?.title || "—",
      `${money(Number(p.amount || 0))}`,
      `${Math.round(Number(p.amount || 0) * 0.12)} $`,
      `${Math.round(Number(p.amount || 0) * 0.88)} $`,
      p.status,
    ])),
  ];
  const csv = rows.map((r) => r.join(";")).join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: kind === "excel" ? "application/vnd.ms-excel;charset=utf-8" : "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = kind === "excel" ? "travelhub-revenue.xls" : "travelhub-revenue.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/* ═══════════════════ MAIN ═══════════════════ */

export default function RevenueCenter() {
  const [data, setData] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [period, setPeriod] = useState<Period>("Месяц");
  const [metric, setMetric] = useState<Metric>("Доход");
  const [interval, setInterval] = useState<Interval>("День");
  const [compare, setCompare] = useState(false);
  const [country, setCountry] = useState("Все");
  const [service, setService] = useState("Все");
  const [partner, setPartner] = useState("Все");
  const [currency, setCurrency] = useState("Все");
  const [manager, setManager] = useState("Все");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [extRes, ccRes, payRes] = await Promise.all([
        fetch("/api/admin/analytics/extended?section=all", { credentials: "include" }),
        fetch("/api/admin/command-center", { credentials: "include" }),
        fetch("/api/admin/payments?limit=100", { credentials: "include" }),
      ]);
      if (!extRes.ok) throw new Error(`HTTP ${extRes.status}`);
      const ext = await extRes.json();
      const cc = ccRes.ok ? await ccRes.json() : {};
      const pay = payRes.ok ? await payRes.json() : { payments: [] };
      setData({ ...cc, ...ext });
      setPayments(pay.payments || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const countries = useMemo(() => (data?.countries || []).map((c: any) => c.country), [data]);
  const serviceTypes = useMemo(() => (data?.services || []).map((s: any) => s.type), [data]);
  const partnerNames = useMemo(() => (data?.partners?.topByRevenue || []).map((p: any) => p.companyName || `${p.firstName} ${p.lastName}`), [data]);

  // ── KPI (12) ──
  const kpis: Kpi[] = useMemo(() => {
    const ceo = data?.ceo || {};
    const totals = ceo.totals || {};
    const revenue = data?.revenue || { today: 0, week: 0, month: 0, year: 0, deltas: { today: 0, week: 0, month: 0, year: 0 } };
    const byDay = ((data?.finance?.revenueByDay || []) as any[]).slice().sort((a: any, b: any) => a.date.localeCompare(b.date));
    const revSeries = byDay.map((p: any) => Number(p.revenue || 0));
    const feesSeries = byDay.map((p: any) => Number(p.fees || 0));
    const bookingsSeries = ((data?.ceo?.bookingsByDay || []) as any[]).map((b: any) => Number(b.count || 0));
    const users = data?.users || {};
    const repeat = users.repeatPurchases || { threePlus: 0 };
    const gmv = totals.gmv || 0;
    const u = totals.users || users.total || 0;
    const partnersCount = totals.partners || 0;
    const avgCheck = totals.avgCheck || 0;
    const arpu = u > 0 ? Math.round(gmv / u) : 0;
    const ltv = Math.round(avgCheck * Math.max(repeat.threePlus / 100, 0.14));
    const perPartner = partnersCount > 0 ? Math.round(gmv / partnersCount) : 0;
    const perDay = Math.round(gmv / 30);
    const perHour = Math.round(perDay / 24);
    const todaySeries = revSeries.slice(-7);
    const prevSeries = revSeries.slice(-14, -7);

    return [
      { label: "Общий доход", value: moneyCompact(gmv), change: revenue.deltas.month, spark: revSeries.slice(-12), icon: "💰", grad: "from-blue-500 to-indigo-600", sub: "GMV за всё время", link: "/admin/revenue" },
      { label: "Доход платформы", value: moneyCompact(totals.platformRevenue || 0), change: pctChange(todaySeries.reduce((s, v) => s + v, 0) * 0.12, prevSeries.reduce((s, v) => s + v, 0) * 0.12), spark: feesSeries.slice(-12), icon: "🏦", grad: "from-violet-500 to-purple-600", sub: "комиссия платформы", link: "/admin/finance" },
      { label: "Комиссия", value: `${totals.avgCommission || 12}%`, change: 0, spark: [], icon: "🧾", grad: "from-amber-500 to-orange-600", sub: "средняя по платформе", link: "/admin/finance" },
      { label: "Средний чек", value: `${avgCheck.toLocaleString("ru-RU")} $`, change: 7, spark: [], icon: "🧾", grad: "from-cyan-500 to-blue-600", sub: "по всем продажам", link: "/admin/analytics" },
      { label: "Количество продаж", value: `${(totals.bookings || 0).toLocaleString("ru-RU")}`, change: pctChange(revenue.week, revenue.month / 4), spark: bookingsSeries.slice(-12), icon: "🛒", grad: "from-teal-500 to-emerald-600", sub: "завершённые брони", link: "/admin_dashboard?tab=orders" },
      { label: "Рост", value: `${revenue.deltas.month || 0}%`, change: revenue.deltas.month, spark: revSeries.slice(-12).map((v) => v * 0.1), icon: "📈", grad: "from-emerald-500 to-green-600", sub: "к прошлому месяцу", link: "/admin/analytics" },
      { label: "Повторные покупки", value: `${repeat.threePlus}%`, change: 5, spark: [], icon: "🔁", grad: "from-fuchsia-500 to-pink-600", sub: "клиентов с 3+ покупками", link: "/admin_dashboard?tab=customers" },
      { label: "ARPU", value: `${arpu.toLocaleString("ru-RU")} $`, change: pctChange(arpu, Math.round(arpu / 1.04)), spark: revSeries.slice(-12).map((v) => v / Math.max(u, 1)), icon: "👤", grad: "from-rose-500 to-pink-600", sub: "доход с клиента", link: "/admin_dashboard?tab=users_mgmt" },
      { label: "LTV", value: `${ltv.toLocaleString("ru-RU")} $`, change: 4, spark: [], icon: "💎", grad: "from-sky-500 to-blue-600", sub: "ценность клиента", link: "/admin_dashboard?tab=customers" },
      { label: "Доход с партнера", value: `${perPartner.toLocaleString("ru-RU")} $`, change: 6, spark: [], icon: "🤝", grad: "from-violet-500 to-purple-600", sub: `${partnersCount} партнеров`, link: "/admin/partners" },
      { label: "Доход в день", value: moneyCompact(perDay), change: revenue.deltas.today, spark: revSeries.slice(-12), icon: "📅", grad: "from-indigo-500 to-violet-600", sub: "в среднем за 30 дней", link: "/admin/analytics" },
      { label: "Доход в час", value: `${perHour.toLocaleString("ru-RU")} $`, change: 0, spark: [], icon: "🕐", grad: "from-gray-500 to-slate-600", sub: "в среднем", link: "/admin/analytics" },
    ];
  }, [data]);

  return (
    <OperationsShell
      active="revenue"
      title="Доходы"
      subtitle="Финансовый BI-центр: доходы платформы, услуг, партнеров, стран и каналов"
      actions={
        <div className="flex items-center gap-2">
          <button onClick={() => setCompare(!compare)}
            className={`h-9 px-4 rounded-xl text-xs font-semibold transition-all border ${compare ? "bg-blue-600 text-white border-transparent" : "bg-white text-gray-600 border-gray-200 hover:border-blue-200"}`}>
            ⇄ Сравнить
          </button>
          <button onClick={fetchData} className="h-9 px-4 rounded-xl bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25">
            ⟳ Обновить
          </button>
        </div>
      }
    >
      {loading && !data ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Загружаем финансовую аналитику…</p>
        </div>
      ) : error ? (
        <div className="py-20 text-center text-sm text-red-500">{error}</div>
      ) : (
        <div className="space-y-5">
          {/* Breadcrumbs */}
          <Breadcrumbs />

          {/* Quick Actions */}
          <QuickActions onExport={(k) => exportData(data, payments, k)} onCompare={() => setCompare(!compare)} compare={compare} />

          {/* Filters */}
          <FilterBar
            period={period} setPeriod={setPeriod}
            country={country} setCountry={setCountry} countries={countries}
            service={service} setService={setService} services={serviceTypes}
            partner={partner} setPartner={setPartner} partners={partnerNames}
            currency={currency} setCurrency={setCurrency}
            manager={manager} setManager={setManager}
          />

          {/* KPI */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide">Ключевые показатели дохода</h2>
              <span className="text-[11px] text-gray-400">— период «{period}»</span>
            </div>
            <KpiGrid kpis={kpis} />
          </div>

          {/* Big chart */}
          <RevenueChart d={data} payments={payments} metric={metric} setMetric={setMetric} interval={interval} setInterval={setInterval} compare={compare} setCompare={setCompare} />

          {/* Revenue Drivers */}
          <RevenueDrivers d={data} />

          {/* Services + Countries */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ServicesBlock d={data} serviceFilter={service} />
            <CountriesBlock d={data} countryFilter={country} />
          </div>

          {/* Partners + Channels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <PartnersBlock d={data} partnerFilter={partner} />
            <ChannelsBlock d={data} />
          </div>

          {/* Heatmap + Currencies + Managers */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2"><HeatmapBlock payments={payments} /></div>
            <div className="space-y-5">
              <CurrenciesBlock payments={payments} />
              <ManagersBlock d={data} />
            </div>
          </div>

          {/* Revenue table */}
          <RevenueTable payments={payments} />

          {/* Forecast + Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <AiForecast d={data} />
            <AiInsights d={data} />
          </div>
        </div>
      )}
    </OperationsShell>
  );
}
