"use client";

import { useI18n } from "@/lib/i18n-context";
import { useFetch } from "@/lib/useFetch";

type PartnerStats = {
  partners: number;
  orders: number;
  revenue: number;
  rating: number;
  services: number;
  reviews: number;
  conversion: number;
  avgCheck: number;
  popularDestinations: { city: string; country: string; count: number }[];
  conversionByType: { type: string; total: number; confirmed: number; conversion: number }[];
  topDestinationsByAvgCheck: { city: string; country: string; avgCheck: number; bookings: number }[];
  trends: {
    partners: number | null;
    orders: number | null;
    revenue: number | null;
    rating: number | null;
    services: number | null;
    reviews: number | null;
    conversion: number | null;
    avgCheck: number | null;
  };
};

function formatNumber(n: number): string {
  if (n >= 1000) {
    return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "K";
  }
  return String(n);
}

function formatValue(key: string, val: number): string {
  switch (key) {
    case "rating": return val > 0 ? `${val} ★` : "—";
    case "income": return `${formatNumber(val)} AZN`;
    case "conversion": return `${val}%`;
    case "avgCheck": return `${formatNumber(val)} AZN`;
    default: return `${formatNumber(val)}+`;
  }
}

export default function ForPartners() {
  const { t } = useI18n();
  const { data: stats } = useFetch<PartnerStats>("/api/partner/stats");

  const partnerTypeKeys = [
    { icon: "🏢", key: "tourOperator" },
    { icon: "🏨", key: "hotel" },
    { icon: "🏥", key: "sanatorium" },
    { icon: "🧭", key: "guide" },
    { icon: "📷", key: "photographer" },
    { icon: "🚐", key: "transporter" },
    { icon: "🏛", key: "excursionOrg" },
  ];

  const statItems = [
    { key: "partners", dbKey: "partners" as keyof PartnerStats, trendKey: "partners" as const },
    { key: "orders", dbKey: "orders" as keyof PartnerStats, trendKey: "orders" as const },
    { key: "income", dbKey: "revenue" as keyof PartnerStats, trendKey: "revenue" as const },
    { key: "rating", dbKey: "rating" as keyof PartnerStats, trendKey: "rating" as const },
    { key: "services", dbKey: "services" as keyof PartnerStats, trendKey: "services" as const },
    { key: "reviews", dbKey: "reviews" as keyof PartnerStats, trendKey: "reviews" as const },
    { key: "conversion", dbKey: "conversion" as keyof PartnerStats, trendKey: "conversion" as const },
    { key: "avgCheck", dbKey: "avgCheck" as keyof PartnerStats, trendKey: "avgCheck" as const },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-primary via-orange-500 to-primary-dark overflow-hidden relative">
      <div className="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <span className="text-sm font-medium text-white">{t("forPartners.badge")}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t("forPartners.title")}</h2>
            <p className="text-white/80 text-lg mb-8 max-w-lg">{t("forPartners.subtitle")}</p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {partnerTypeKeys.map((type) => (
                <div key={type.key} className="flex items-center gap-2 text-white/90">
                  <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-xs">{type.icon}</span>
                  <span className="text-sm font-medium">{t(`forPartners.types.${type.key}`)}</span>
                </div>
              ))}
            </div>
            <a href="/partner" className="inline-flex items-center gap-2 h-14 px-8 bg-white text-primary rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all hover:shadow-lg active:scale-95">{t("forPartners.cta")}</a>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/15 backdrop-blur-md rounded-3xl p-8 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-6">{t("forPartners.stats.title")}</h3>
              <div className="space-y-4">
                {statItems.map((stat) => {
                  const raw = stats?.[stat.dbKey];
                  const display = raw != null && typeof raw === "number" ? formatValue(stat.key, raw) : "—";
                  const trend = stat.trendKey ? stats?.trends?.[stat.trendKey] : null;
                  const isRating = stat.key === "rating";
                  return (
                    <div key={stat.key} className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
                      <span className="text-white/70 text-sm">{t(`forPartners.stats.${stat.key}`)}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">
                          {stats ? display : <span className="inline-block w-16 h-5 bg-white/20 rounded animate-pulse" />}
                        </span>
                        {stats && trend != null && (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trend >= 0 ? "text-success bg-success/20" : "text-danger bg-danger/20"}`}>
                            {isRating ? (trend > 0 ? "+" : "") + trend.toFixed(1) : (trend >= 0 ? "+" : "") + trend + "%"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {stats?.popularDestinations && stats.popularDestinations.length > 0 && (
                <div className="mt-6 pt-4 border-t border-white/10">
                  <h4 className="text-sm font-semibold text-white/60 mb-3">🌍 Популярные направления</h4>
                  <div className="space-y-2">
                    {stats.popularDestinations.map((dest, i) => (
                      <div key={dest.city} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-white/40 text-xs font-mono w-4">{i + 1}</span>
                          <span className="text-white text-sm">{dest.city}</span>
                          <span className="text-white/40 text-xs">{dest.country}</span>
                        </div>
                        <span className="text-white/60 text-xs bg-white/10 px-2 py-0.5 rounded-full">{dest.count} услуг</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {stats?.conversionByType && stats.conversionByType.length > 0 && (
                <div className="mt-6 pt-4 border-t border-white/10">
                  <h4 className="text-sm font-semibold text-white/60 mb-3">📊 Конверсия по типам услуг</h4>
                  <div className="space-y-2">
                    {stats.conversionByType.map((item) => (
                      <div key={item.type} className="flex items-center gap-3">
                        <span className="text-white/70 text-xs w-28 shrink-0 truncate">
                          {item.type === "TOUR" ? "🏖 Туры" : item.type === "HOTEL" ? "🏨 Отели" : item.type === "SANATORIUM" ? "🏥 Санатории" : item.type === "EXCURSION" ? "🏛 Экскурсии" : item.type === "GUIDE" ? "🧭 Гиды" : item.type === "PHOTOGRAPHER" ? "📷 Фотографы" : item.type === "TRANSFER" ? "🚐 Трансферы" : "✈ Авиа"}
                        </span>
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-success rounded-full transition-all duration-700" style={{ width: `${item.conversion}%` }} />
                        </div>
                        <span className="text-white text-xs font-bold w-10 text-right">{item.conversion}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {stats?.topDestinationsByAvgCheck && stats.topDestinationsByAvgCheck.length > 0 && (
                <div className="mt-6 pt-4 border-t border-white/10">
                  <h4 className="text-sm font-semibold text-white/60 mb-3">💰 Средний чек по направлениям</h4>
                  <div className="space-y-2">
                    {stats.topDestinationsByAvgCheck.map((dest, i) => (
                      <div key={dest.city} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-white/40 text-xs font-mono w-4">{i + 1}</span>
                          <span className="text-white text-sm">{dest.city}</span>
                          <span className="text-white/40 text-xs">{dest.country}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-sm">{formatNumber(dest.avgCheck)} AZN</span>
                          <span className="text-white/40 text-xs">({dest.bookings})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
