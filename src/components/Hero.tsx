"use client";

import { useI18n } from "@/lib/i18n-context";

export default function Hero() {
  const { t } = useI18n();

  return (
    <section className="relative min-h-[600px] lg:min-h-[700px] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div
          className="img-bg absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
             "url('/8c1f6b8a-ab32-4328-bd69-dc88fa854597.png')",
             //  "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 right-20 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse-gentle hidden lg:block" />
      <div className="absolute bottom-40 right-40 w-32 h-32 bg-primary/20 rounded-full blur-2xl animate-pulse-gentle hidden lg:block" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 w-full overflow-hidden">
        <div className="max-w-2xl overflow-hidden">
          <div className="flex items-start gap-2 bg-gradient-to-r from-primary to-primary-dark rounded-lg px-3 sm:px-4 py-2 mb-6 animate-fadeInUp shadow-md shadow-primary/30 max-w-full">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse shrink-0 mt-1" />
            <span className="text-white text-[10px] sm:text-[11px] md:text-xs lg:text-sm font-extrabold tracking-wide uppercase drop-shadow-md leading-tight">
              {t("hero.badge")}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white leading-tight mb-6 animate-fadeInUp drop-shadow-xl">
            {t("hero.title")}
            <br />
            <span className="text-primary drop-shadow-lg">{t("hero.titleHighlight")}</span>{" "}
            {t("hero.titleEnd")}
          </h1>

          <p className="text-lg md:text-xl text-white/95 mb-10 max-w-xl animate-fadeInUp leading-relaxed drop-shadow-md font-medium">
            {t("hero.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-fadeInUp">
            <a
              href="#search"
              className="inline-flex items-center justify-center gap-2 h-14 px-8 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold text-lg transition-all hover:shadow-lg hover:shadow-primary/40 active:scale-95 drop-shadow-md"
            >
              {t("hero.searchButton")}
            </a>
            <a
              href="#popular"
              className="inline-flex items-center justify-center gap-2 h-14 px-8 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-2xl font-bold text-lg transition-all border border-white/30 drop-shadow-md"
            >
              {t("hero.viewPopular")}
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/20">
            {[
              { value: "35 000+", label: t("hero.statsTours") },
              { value: "42 000+", label: t("hero.statsHotels") },
              { value: "12 000+", label: t("hero.statsExcursions") },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl md:text-3xl font-extrabold text-white drop-shadow-lg">
                  {stat.value}
                </div>
                <div className="text-sm text-white/80 mt-1 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
