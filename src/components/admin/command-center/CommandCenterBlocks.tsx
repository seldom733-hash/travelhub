"use client";

import { useI18n } from "@/lib/i18n-context";
import { CommandCenterData, money } from "./types";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

/* ═══════════════ BLOCK 1 — PLATFORM STATE ═══════════════ */

function PlatformState({ data }: { data: CommandCenterData }) {
  const { t } = useI18n();
  const s = data.status;
  const levelText = s.level === "excellent" ? t("commandCenter.excellent") : s.level === "good" ? t("commandCenter.good") : t("commandCenter.attention");
  const levelColor = s.level === "excellent" ? "text-emerald-600" : s.level === "good" ? "text-amber-600" : "text-red-500";

  return (
    <div className="bg-white/90 rounded-[20px] border border-gray-100 p-5 shadow-sm hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <h3 className="text-sm font-bold text-gray-900">{t("commandCenter.platformState")}</h3>
      </div>

      {/* Health score */}
      <div className="flex items-center gap-4 mb-5">
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="10" />
            <circle
              cx="50" cy="50" r="42" fill="none" stroke="#22c55e" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${(s.healthScore / 100) * 264} 264`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-extrabold text-gray-900 leading-none">{s.healthScore}</span>
            <span className="text-[8px] text-gray-400 font-medium mt-0.5">/100</span>
          </div>
        </div>
        <div>
          <p className={`text-2xl font-extrabold ${levelColor} leading-tight`}>🟢 {levelText}</p>
          <p className="text-xs text-gray-400 font-medium">{t("commandCenter.healthScore")}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {[
          { label: t("commandCenter.onlineUsers"), value: s.onlineUsers.toLocaleString(), icon: "👥", color: "from-blue-500 to-cyan-500" },
          { label: t("commandCenter.activePartners"), value: s.activePartners.toLocaleString(), icon: "🤝", color: "from-green-500 to-emerald-500" },
          { label: t("commandCenter.ordersToday"), value: s.todayBookings.toLocaleString(), icon: "🧾", color: "from-violet-500 to-purple-500" },
          { label: t("commandCenter.revenueToday"), value: money(s.todayRevenue), icon: "💰", color: "from-amber-500 to-orange-500" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 transition-colors">
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-base shrink-0 shadow-sm`}>
              {item.icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-gray-900 leading-tight">{item.value}</p>
              <p className="text-[10px] text-gray-400 font-medium truncate">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* System status */}
      <div className="mt-4 pt-3 border-t border-gray-50 grid grid-cols-3 gap-2">
        <div className="text-center">
          <p className="flex items-center justify-center gap-1 text-xs font-bold text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {t("commandCenter.api")}
          </p>
          <p className="text-[10px] text-gray-400">{t("commandCenter.working")}</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-gray-700">🖥 {s.serverLoad}%</p>
          <p className="text-[10px] text-gray-400">{t("commandCenter.server")}</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-bold text-gray-700">🗄 {s.dbLatency} ms</p>
          <p className="text-[10px] text-gray-400">{t("commandCenter.database")}</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ BLOCK 2 — NEEDS ATTENTION ═══════════════ */

const SEVERITY_STYLES: Record<string, { border: string; badge: string }> = {
  critical: { border: "hover:border-red-300/60", badge: "bg-red-50 text-red-500" },
  warning: { border: "hover:border-amber-300/60", badge: "bg-amber-50 text-amber-600" },
  info: { border: "hover:border-blue-300/60", badge: "bg-blue-50 text-blue-500" },
};

function NeedsAttention({ data }: { data: CommandCenterData }) {
  const { t } = useI18n();
  return (
    <div className="bg-white/90 rounded-[20px] border border-gray-100 p-5 shadow-sm hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h3 className="text-sm font-bold text-gray-900">{t("commandCenter.needsAttention")}</h3>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500">{data.attention.length}</span>
      </div>

      <div className="space-y-2">
        {data.attention.slice(0, 7).map((item) => {
          const style = SEVERITY_STYLES[item.severity] || SEVERITY_STYLES.info;
          return (
            <a
              key={item.id}
              href={item.link}
              className={`flex items-start gap-3 p-2.5 rounded-xl bg-gray-50/70 hover:bg-white ${style.border} border border-transparent transition-all group`}
            >
              <span className="text-base mt-0.5 shrink-0">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-800 leading-snug group-hover:text-gray-900">{item.text}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${style.badge}`}>{item.meta}</span>
            </a>
          );
        })}
      </div>

      <a href="/admin_dashboard?tab=moderation" className="mt-4 block text-center text-xs font-semibold text-blue-600 hover:text-blue-700 py-2 rounded-xl bg-blue-50/50 hover:bg-blue-50 transition-colors">
        {t("commandCenter.viewAll")} →
      </a>
    </div>
  );
}

/* ═══════════════ BLOCK 3 — REVENUE ═══════════════ */

function RevenueBlock({ data }: { data: CommandCenterData }) {
  const { t } = useI18n();
  const r = data.revenue;
  const periods = [
    { label: t("commandCenter.today"), value: r.today, delta: r.deltas.today },
    { label: t("commandCenter.week"), value: r.week, delta: r.deltas.week },
    { label: t("commandCenter.month"), value: r.month, delta: r.deltas.month },
    { label: t("commandCenter.year"), value: r.year, delta: r.deltas.year },
  ];

  return (
    <div className="bg-white/90 rounded-[20px] border border-gray-100 p-5 shadow-sm hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <h3 className="text-sm font-bold text-gray-900">{t("commandCenter.revenue")}</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
        {periods.map((p) => (
          <div key={p.label} className="p-3 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/60 hover:from-blue-50 hover:to-cyan-50/60 border border-gray-100 transition-all">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">{p.label}</p>
            <p className="text-[15px] font-extrabold text-gray-900 leading-tight">{money(p.value)}</p>
            <p className={`text-[11px] font-bold mt-1 ${p.delta >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {p.delta >= 0 ? "↑" : "↓"} {Math.abs(p.delta)}%
            </p>
          </div>
        ))}
      </div>

      {/* Line chart */}
      <div className="h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={r.byDay} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="ccRevGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#94a3b8" }} tickFormatter={(v: string) => v.slice(5)} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))} axisLine={false} tickLine={false} width={32} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: 12 }}
              formatter={(value: any) => [money(Number(value ?? 0)), "$"]}
              labelFormatter={(l) => String(l)}
            />
            <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#ccRevGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ═══════════════ BLOCK 4 — AI ═══════════════ */

function AIBlock({ data }: { data: CommandCenterData }) {
  const { t } = useI18n();
  const ai = data.ai;
  const badgeColor: Record<string, string> = {
    positive: "bg-emerald-50 text-emerald-600",
    negative: "bg-red-50 text-red-500",
    action: "bg-blue-50 text-blue-600",
  };

  return (
    <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 rounded-[20px] p-5 text-white shadow-xl shadow-indigo-500/20 overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute -bottom-20 -left-10 w-48 h-48 bg-cyan-300/20 rounded-full blur-2xl" />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center text-lg">🤖</span>
            <h3 className="text-sm font-bold">{t("commandCenter.aiTodayFound")}</h3>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/15 backdrop-blur">{t("commandCenter.aiPanel")}</span>
        </div>

        <div className="space-y-2">
          {ai.findings.map((f, i) => (
            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/15 transition-colors">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 bg-white/20">
                {f.icon}
              </span>
              <p className="text-[13px] font-medium leading-snug">{f.text}</p>
            </div>
          ))}
        </div>

        {/* Probability */}
        <div className="mt-4 p-3 rounded-xl bg-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-white/70 font-medium">{t("commandCenter.nextWeekGrowth")}</span>
            <span className="text-xs font-extrabold text-emerald-300">+{ai.probability}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300 transition-all duration-1000" style={{ width: `${Math.min(100, ai.probability + 40)}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export { PlatformState, NeedsAttention, RevenueBlock, AIBlock };
