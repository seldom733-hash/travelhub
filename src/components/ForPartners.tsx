"use client";

import { useI18n } from "@/lib/i18n-context";

export default function ForPartners() {
  const { t } = useI18n();

  const partnerTypeKeys = [
    { icon: "🏢", key: "tourOperator" },
    { icon: "🏨", key: "hotel" },
    { icon: "🏥", key: "sanatorium" },
    { icon: "🧭", key: "guide" },
    { icon: "📷", key: "photographer" },
    { icon: "🚐", key: "transporter" },
    { icon: "🏛", key: "excursionOrg" },
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
            <a href="/partners" className="inline-flex items-center gap-2 h-14 px-8 bg-white text-primary rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all hover:shadow-lg active:scale-95">{t("forPartners.cta")}</a>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/15 backdrop-blur-md rounded-3xl p-8 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-6">{t("forPartners.stats.title")}</h3>
              <div className="space-y-4">
                {[
                  { key: "partners", value: "8 500+", trend: "+12%" },
                  { key: "orders", value: "25 000+", trend: "+28%" },
                  { key: "income", value: "15 000 AZN", trend: "+15%" },
                  { key: "rating", value: "4.8 ★", trend: "+0.2" },
                ].map((stat) => (
                  <div key={stat.key} className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
                    <span className="text-white/70 text-sm">{t(`forPartners.stats.${stat.key}`)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{stat.value}</span>
                      <span className="text-success text-xs font-semibold bg-success/20 px-2 py-0.5 rounded-full">{stat.trend}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
