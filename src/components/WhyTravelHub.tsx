"use client";

import { useI18n } from "@/lib/i18n-context";

const statsKeys = [
  { icon: "🏖", value: "35 000+", key: "tours", color: "from-primary to-orange-500" },
  { icon: "🏨", value: "42 000+", key: "hotels", color: "from-blue-500 to-blue-600" },
  { icon: "🏛", value: "12 000+", key: "excursions", color: "from-emerald-500 to-emerald-600" },
  { icon: "🧭", value: "2 500+", key: "guides", color: "from-violet-500 to-violet-600" },
  { icon: "📷", value: "1 800+", key: "photographers", color: "from-pink-500 to-pink-600" },
  { icon: "🚐", value: "4 000+", key: "transfers", color: "from-amber-500 to-amber-600" },
];

const badgeKeys = [
  { icon: "🔒", titleKey: "payment", descKey: "paymentDesc" },
  { icon: "💰", titleKey: "refund", descKey: "refundDesc" },
  { icon: "⭐", titleKey: "reviews", descKey: "reviewsDesc" },
  { icon: "📞", titleKey: "support", descKey: "supportDesc" },
];

export default function WhyTravelHub() {
  const { t } = useI18n();
  return (
    <section className="py-20 bg-gradient-to-br from-secondary via-gray-900 to-secondary overflow-hidden relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t("whyTravelHub.title")} <span className="text-primary">{t("whyTravelHub.titleEnd")}</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">{t("whyTravelHub.subtitle")}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {statsKeys.map((stat) => (
            <div key={stat.key} className="group text-center p-6 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-primary/40 transition-all card-hover">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-3xl group-hover:scale-110 transition-transform`}>{stat.icon}</div>
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{t(`whyTravelHub.stats.${stat.key}`)}</div>
            </div>
          ))}
        </div>
        <div className="mt-14 pt-10 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {badgeKeys.map((badge) => (
            <div key={badge.titleKey} className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-2xl shrink-0">{badge.icon}</div>
              <div>
                <p className="text-sm font-semibold text-white">{t(`whyTravelHub.badges.${badge.titleKey}`)}</p>
                <p className="text-xs text-gray-400">{t(`whyTravelHub.badges.${badge.descKey}`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
