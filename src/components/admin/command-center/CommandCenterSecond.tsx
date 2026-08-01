"use client";

import { useI18n } from "@/lib/i18n-context";
import { CommandCenterData, money, moneyCompact, CHART_COLORS } from "./types";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import dynamic from "next/dynamic";

const CcWorldMap = dynamic(() => import("./CcWorldMap"), { ssr: false });

/* ═══════════════ WHERE IS THE MONEY? (donut + TOP 10) ═══════════════ */

function MoneyDonut({ data }: { data: CommandCenterData }) {
  const { t } = useI18n();
  const total = data.byCategory.reduce((a, b) => a + b.revenue, 0);

  return (
    <div className="bg-white/90 rounded-[20px] border border-gray-100 p-5 shadow-sm hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <h3 className="text-sm font-bold text-gray-900">{t("commandCenter.whereMoney")}</h3>
        <span className="ml-auto text-xs font-bold text-emerald-600">{moneyCompact(total)}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Donut */}
        <div className="h-[220px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.byCategory}
                cx="50%" cy="50%" innerRadius={58} outerRadius={88} paddingAngle={2}
                dataKey="revenue" nameKey="label" strokeWidth={2} stroke="#fff"
              >
                {data.byCategory.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: 12 }}
                formatter={(value: any, _name: any, entry: any) => [`${money(Number(value ?? 0))} (${entry?.payload?.percentage || 0}%)`, entry?.payload?.label]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{t("commandCenter.platformRevenue")}</p>
            <p className="text-lg font-extrabold text-gray-900">{moneyCompact(total)}</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col justify-center gap-1.5">
          {data.byCategory.slice(0, 9).map((c, i) => (
            <div key={c.type} className="flex items-center gap-2.5 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
              <span className="text-sm font-medium text-gray-700 flex-1 truncate">{c.icon} {c.label}</span>
              <span className="text-xs font-bold text-gray-900">{c.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TopServices({ data }: { data: CommandCenterData }) {
  const { t } = useI18n();
  return (
    <div className="bg-white/90 rounded-[20px] border border-gray-100 p-5 shadow-sm hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-violet-500" />
        <h3 className="text-sm font-bold text-gray-900">{t("commandCenter.top10")}</h3>
      </div>
      <div className="space-y-2">
        {data.topServices.slice(0, 10).map((s, i) => (
          <div key={s.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 text-white bg-gradient-to-br from-gray-400 to-gray-500">
              {i + 1}
            </div>
            {s.image ? (
              <img src={s.image} alt={s.title} className="w-9 h-9 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-base shrink-0">{s.icon}</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-800 truncate">{s.title}</p>
              <p className="text-[10px] text-gray-400 truncate">{s.sold} {t("commandCenter.sold").toLowerCase()} • {s.city}, {s.country}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold text-emerald-600">{moneyCompact(s.revenue)}</p>
              <p className="text-[10px] text-gray-400">⭐ {Number(s.rating || 0).toFixed(1)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ WHERE ARE THE PROBLEMS? ═══════════════ */

function ProblemsBlock({ data }: { data: CommandCenterData }) {
  const { t } = useI18n();
  return (
    <div className="rounded-[20px] border border-red-200/70 bg-gradient-to-br from-red-50/90 via-white to-rose-50/70 p-5 shadow-sm hover:shadow-lg hover:shadow-red-200/40 transition-all duration-300">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <h3 className="text-sm font-bold text-red-700">{t("commandCenter.whereProblems")}</h3>
      </div>
      <p className="text-[11px] text-red-400/80 font-semibold mb-3">{t("commandCenter.biggestLosses")}</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        {data.problems.map((p) => (
          <a
            key={p.key}
            href={p.link}
            className={`p-3 rounded-xl bg-white/90 border transition-all hover:-translate-y-0.5 hover:shadow-md ${
              p.severity === "critical" ? "border-red-100 hover:border-red-300" : "border-amber-100 hover:border-amber-300"
            }`}
          >
            <p className={`text-sm font-extrabold ${p.severity === "critical" ? "text-red-600" : "text-amber-600"} leading-tight`}>{p.value}</p>
            <p className="text-[11px] font-semibold text-gray-700 mt-0.5">{p.title}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 truncate">{p.detail}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ WHAT SELLS BEST ═══════════════ */

const SELLER_CARD_GRADIENTS = [
  "from-amber-500 to-orange-600",
  "from-blue-500 to-indigo-600",
  "from-cyan-500 to-blue-600",
  "from-emerald-500 to-green-600",
  "from-violet-500 to-purple-600",
];

function BestSellers({ data }: { data: CommandCenterData }) {
  const { t } = useI18n();
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-amber-500" />
        <h3 className="text-sm font-bold text-gray-900">{t("commandCenter.bestSellers")}</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {data.topServices.slice(0, 5).map((s, i) => (
          <a
            key={s.id}
            href={`/services/${s.id}`}
            className="group relative bg-white/90 rounded-[18px] border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-200/60 hover:-translate-y-1 transition-all duration-300"
          >
            <div className={`h-20 bg-gradient-to-br ${SELLER_CARD_GRADIENTS[i % SELLER_CARD_GRADIENTS.length]} relative flex items-center justify-center`}>
              {s.image ? (
                <img src={s.image} alt={s.title} className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <span className="text-4xl drop-shadow-lg group-hover:scale-110 transition-transform duration-300">{s.icon}</span>
              )}
              {i === 0 && (
                <span className="absolute top-2 left-2 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/90 text-amber-600 shadow">🏆</span>
              )}
              <span className="absolute top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-black/40 text-white backdrop-blur">#{i + 1}</span>
            </div>
            <div className="p-3">
              <p className="text-[13px] font-bold text-gray-900 leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">{s.title}</p>
              <p className="text-[10px] text-gray-400 mt-1">{s.icon} {s.typeLabel} • {s.city}</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                <span className="text-[11px] text-gray-500">
                  <span className="font-bold text-gray-900">{s.sold}</span> {t("commandCenter.sold").toLowerCase()}
                </span>
                <span className="text-xs font-extrabold text-emerald-600">{moneyCompact(s.revenue)}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ Second screen export ═══════════════ */

export default function CommandCenterSecond({ data }: { data: CommandCenterData }) {
  const { t } = useI18n();
  const countryWord = data.countries.length === 1 ? "страна" : data.countries.length < 5 ? "страны" : "стран";

  return (
    <div className="space-y-5">
      {/* Where is the money? */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <MoneyDonut data={data} />
        <TopServices data={data} />
      </div>

      {/* Problems */}
      <ProblemsBlock data={data} />

      {/* World map */}
      <div className="bg-white/90 rounded-[20px] border border-gray-100 p-5 shadow-sm hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-cyan-500" />
          <h3 className="text-sm font-bold text-gray-900">{t("commandCenter.worldMap")}</h3>
          <span className="ml-auto text-[10px] text-gray-400 font-medium">🌍 {data.countries.length} {countryWord}</span>
        </div>
        <CcWorldMap countries={data.countries} />
      </div>

      {/* Best sellers */}
      <BestSellers data={data} />
    </div>
  );
}
