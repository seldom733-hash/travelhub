"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";

interface Stats {
  services: { tours: number; hotels: number; sanatoriums: number; excursions: number; flights: number; trains: number; guides: number; photographers: number; transfers: number };
  users: number;
  partners: number;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${Math.floor(n / 1000)} 000+`;
  return `${n}+`;
}

export default function Hero() {
  const { t } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {});
  }, []);

  const totalServices = stats
    ? stats.services.tours + stats.services.hotels + stats.services.sanatoriums + stats.services.excursions + stats.services.flights + stats.services.trains + stats.services.guides + stats.services.photographers + stats.services.transfers
    : 0;

  return (
    <section className="relative min-h-[600px] lg:min-h-[720px] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div
          className="img-bg absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('/8c1f6b8a-ab32-4328-bd69-dc88fa854597.png')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/5" />
      </div>



      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-sm rounded-full px-5 py-2.5 mb-8 animate-fadeInUp border border-white/20">
            <span className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
            <span className="text-white text-[11px] sm:text-xs font-extrabold tracking-widest uppercase">
              {t("hero.badge")}
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-extrabold text-white leading-[1.15] mb-7 animate-fadeInUp">
            <span className="block text-white">{t("hero.title")}</span>
            <span className="block mt-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-400 to-primary">
                {t("hero.titleHighlight")}
              </span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-xl animate-fadeInUp leading-relaxed font-medium">
            {t("hero.subtitle")}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fadeInUp">
            <a
              href="#search"
              className="group inline-flex items-center justify-center gap-3 h-14 px-8 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white rounded-2xl font-bold text-lg transition-all duration-300 shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/50 active:scale-95"
            >
              <span className="text-xl group-hover:rotate-12 transition-transform duration-300">🔍</span>
              {t("hero.searchButton")}
            </a>
            <a
              href="#popular"
              className="group inline-flex items-center justify-center gap-3 h-14 px-8 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white rounded-2xl font-bold text-lg transition-all duration-300 border border-white/25 hover:border-white/40 shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30"
            >
              <span className="text-xl group-hover:scale-110 transition-transform duration-300">🌍</span>
              {t("hero.viewPopular")}
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 sm:gap-8 mt-14 pt-8 border-t border-white/20">
            {[
              { value: stats ? formatCount(stats.services.tours) : null, label: t("hero.statsTours"), icon: "🏖" },
              { value: stats ? formatCount(stats.services.hotels) : null, label: t("hero.statsHotels"), icon: "🏨" },
              { value: stats ? formatCount(stats.services.excursions) : null, label: t("hero.statsExcursions"), icon: "🏛" },
            ].map((stat) => (
              <div key={stat.label} className="group">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg group-hover:scale-110 transition-transform">{stat.icon}</span>
                  {stat.value ? (
                    <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-primary transition-opacity duration-500">
                      {stat.value}
                    </span>
                  ) : (
                    <span className="inline-block w-24 h-8 bg-white/10 rounded-lg animate-pulse" />
                  )}
                </div>
                <div className="text-sm text-white/70 font-medium ml-8">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
