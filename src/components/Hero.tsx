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
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
        <div className="absolute inset-0 bg-primary/5 mix-blend-overlay" />
      </div>

      <div className="absolute top-24 right-16 w-24 h-24 bg-primary/15 rounded-full blur-2xl animate-pulse-gentle hidden lg:block" />
      <div className="absolute bottom-32 right-36 w-40 h-40 bg-accent/10 rounded-full blur-3xl animate-pulse-gentle hidden lg:block" />
      <div className="absolute top-1/3 left-1/4 w-16 h-16 bg-white/5 rounded-full blur-xl animate-pulse-gentle hidden lg:block" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 bg-gradient-to-r from-white via-gray-100 to-white rounded-full px-5 py-2.5 mb-8 animate-fadeInUp shadow-2xl shadow-white/40" style={{ textShadow: "0 0 8px rgba(255,255,255,0.9), 0 0 16px rgba(255,255,255,0.5)" }}>
            <span className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse drop-shadow-lg" />
            <span className="text-primary text-[11px] sm:text-xs font-extrabold tracking-widest uppercase" style={{ textShadow: "0 0 8px rgba(255,255,255,0.9), 0 0 16px rgba(255,255,255,0.5)" }}>
              {t("hero.badge")}
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.2rem] font-extrabold text-secondary leading-[1.1] mb-7 animate-fadeInUp" style={{ textShadow: "0 0 40px rgba(255,255,255,0.9), 0 0 80px rgba(255,255,255,0.6), 0 0 120px rgba(255,255,255,0.3)" }}>
            <span className="block text-secondary" style={{ textShadow: "0 0 30px rgba(255,255,255,0.9), 0 0 60px rgba(255,255,255,0.6), 0 0 100px rgba(255,255,255,0.3)" }}>{t("hero.title")}</span>
            <span className="block mt-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-amber-400 to-primary" style={{ filter: "drop-shadow(0 0 24px rgba(255,255,255,0.9)) drop-shadow(0 0 48px rgba(255,200,0,0.6))" }}>
                {t("hero.titleHighlight")}
              </span>
              <span className="text-secondary" style={{ textShadow: "0 0 30px rgba(255,255,255,0.9), 0 0 60px rgba(255,255,255,0.6)" }}> {t("hero.titleEnd")}</span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-700 mb-10 max-w-xl animate-fadeInUp leading-relaxed font-medium" style={{ textShadow: "0 0 20px rgba(255,255,255,0.8), 0 0 40px rgba(255,255,255,0.5), 0 0 60px rgba(255,255,255,0.2)" }}>
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
          <div className="grid grid-cols-3 gap-6 sm:gap-8 mt-14 pt-8 border-t border-white/15" style={{ textShadow: "0 0 16px rgba(255,255,255,0.7), 0 0 32px rgba(255,255,255,0.4)" }}>
            {[
              { value: formatCount(stats?.services.tours ?? 35000), label: t("hero.statsTours"), icon: "🏖" },
              { value: formatCount(stats?.services.hotels ?? 42000), label: t("hero.statsHotels"), icon: "🏨" },
              { value: formatCount(stats?.services.excursions ?? 12000), label: t("hero.statsExcursions"), icon: "🏛" },
            ].map((stat) => (
              <div key={stat.label} className="group">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg group-hover:scale-110 transition-transform">{stat.icon}</span>
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-primary" style={{ textShadow: "0 0 24px rgba(255,255,255,0.9), 0 0 48px rgba(255,255,255,0.6), 0 0 80px rgba(255,255,255,0.3)" }}>
                    {stat.value}
                  </span>
                </div>
                <div className="text-sm text-gray-600 font-medium ml-8" style={{ textShadow: "0 0 12px rgba(255,255,255,0.6)" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
