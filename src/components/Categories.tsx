"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";

interface Stats {
  services: { tours: number; hotels: number; sanatoriums: number; excursions: number; flights: number; trains: number; guides: number; photographers: number; transfers: number };
}

function formatCount(n: number): string {
  if (n >= 1000) return `${Math.floor(n / 1000)} 000+`;
  return `${n}+`;
}

const categoryKeys = [
  { icon: "🏖", key: "tours", href: "/tours", bgLight: "bg-orange-50", accent: "from-orange-500 to-orange-600", apiType: "tours" as const },
  { icon: "🏨", key: "hotels", href: "/hotels", bgLight: "bg-blue-50", accent: "from-blue-500 to-blue-600", apiType: "hotels" as const },
  { icon: "🏥", key: "sanatoriums", href: "/sanatoriums", bgLight: "bg-teal-50", accent: "from-teal-500 to-teal-600", apiType: "sanatoriums" as const },
  { icon: "✈", key: "flights", href: "/flights", bgLight: "bg-sky-50", accent: "from-sky-500 to-sky-600", apiType: "flights" as const },
  { icon: "🚂", key: "trains", href: "/trains", bgLight: "bg-amber-50", accent: "from-amber-600 to-amber-700", apiType: "trains" as const },
  { icon: "🏛", key: "excursions", href: "/excursions", bgLight: "bg-emerald-50", accent: "from-emerald-500 to-emerald-600", apiType: "excursions" as const },
  { icon: "🧭", key: "guides", href: "/guides", bgLight: "bg-violet-50", accent: "from-violet-500 to-violet-600", apiType: "guides" as const },
  { icon: "📷", key: "photographers", href: "/photographers", bgLight: "bg-pink-50", accent: "from-pink-500 to-pink-600", apiType: "photographers" as const },
  { icon: "🚐", key: "transfers", href: "/transfers", bgLight: "bg-amber-50", accent: "from-amber-500 to-amber-600", apiType: "transfers" as const },
];

export default function Categories() {
  const { t } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {});
  }, []);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            {t("categories.badge") || "🌍 Каталог услуг"}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-secondary mb-3">
            {t("categories.title")}
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            {t("categories.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {categoryKeys.map((cat) => {
            const count = stats?.services[cat.apiType];
            return (
              <a
                key={cat.key}
                href={cat.href}
                className="group relative bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 hover:border-transparent hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.accent} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300`} />
                
                <div
                  className={`w-14 h-14 ${cat.bgLight} rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}
                >
                  {cat.icon}
                </div>
                <h3 className="font-bold text-secondary text-base mb-1 group-hover:text-primary transition-colors">
                  {t(`categories.items.${cat.key}`)}
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                  {count !== undefined ? `${formatCount(count)} ${t(`categories.items.${cat.key}Count`).split(" ").slice(1).join(" ")}` : t(`categories.items.${cat.key}Count`)}
                </p>

                <div className="flex items-center gap-1.5 pt-3 border-t border-gray-50">
                  <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
                  <span className="text-[11px] text-gray-400">
                    {t("categories.lastBooking")}
                  </span>
                </div>

                <div className="mt-3 text-xs font-semibold text-primary flex items-center gap-1 group-hover:translate-x-1.5 transition-transform duration-300">
                  {t("categories.moreDetails")}
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
