"use client";

import { useI18n } from "@/lib/i18n-context";

const categoryKeys = [
  { icon: "🏨", key: "hotels", href: "/hotels", bgLight: "bg-blue-50" },
  { icon: "🏖", key: "tours", href: "/tours", bgLight: "bg-orange-50" },
  { icon: "🏛", key: "excursions", href: "/excursions", bgLight: "bg-emerald-50" },
  { icon: "✈", key: "flights", href: "/flights", bgLight: "bg-sky-50" },
  { icon: "🧭", key: "guides", href: "/guides", bgLight: "bg-violet-50" },
  { icon: "📷", key: "photographers", href: "/photographers", bgLight: "bg-pink-50" },
  { icon: "🚐", key: "transfers", href: "/transfers", bgLight: "bg-amber-50" },
  { icon: "🏥", key: "sanatoriums", href: "/sanatoriums", bgLight: "bg-teal-50" },
];

export default function Categories() {
  const { t } = useI18n();

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-secondary mb-3">
            {t("categories.title")}
          </h2>
          <p className="text-gray-500 text-lg">
            {t("categories.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categoryKeys.map((cat) => (
            <a
              key={cat.key}
              href={cat.href}
              className="group card-hover bg-white rounded-2xl border border-gray-100 p-5 hover:border-primary/30"
            >
              <div
                className={`w-14 h-14 ${cat.bgLight} rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform`}
              >
                {cat.icon}
              </div>
              <h3 className="font-semibold text-secondary text-sm mb-1">
                {t(`categories.items.${cat.key}`)}
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                {t(`categories.items.${cat.key}Count`)}
              </p>

              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-star text-xs">★</span>
                ))}
                <span className="text-xs font-semibold text-secondary ml-1">
                  4.8
                </span>
              </div>

              <div className="flex items-center gap-1.5 pt-3 border-t border-gray-50">
                <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                <span className="text-[11px] text-gray-400">
                  {t("categories.lastBooking")}
                </span>
              </div>

              <div className="mt-3 text-xs font-medium text-primary group-hover:translate-x-1 transition-transform">
                {t("categories.moreDetails")}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
