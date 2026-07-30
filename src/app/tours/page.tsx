"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import ServiceCatalogPage from "@/components/ServiceCatalogPage";
import type { Service } from "@/components/ServiceCard";
import type { FilterState } from "@/components/FilterSidebar";
import { useI18n } from "@/lib/i18n-context";
import type { ProviderInfo } from "@/lib/types";
import { getProviderName } from "@/lib/types";
import { flagMap } from "@/lib/flags";

const config = {
  serviceType: "TOUR",
  filterCategory: "tour",
  heroGradient: "from-orange-500 to-amber-500",
  heroIcon: "🌍",
  heroTitleKey: "nav.tours",
  heroSubtitleKey: "tours.subtitle",
  emptyIcon: "🔍",
  emptyTextKey: "filter.noResults",
  defaultImage: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&q=80",
  priceUnitKey: "catalog.perPerson",
};

/** Tours have different tags: isHot → "🔥", discountPrice → "-" */
function mapTourService(s: Record<string, unknown>, t: (key: string) => string): Service {
  return {
    id: s.id as string,
    name: s.title as string,
    image: (s.images as string[])?.[0] || config.defaultImage,
    city: s.city as string,
    country: s.country as string,
    flag: flagMap[s.countryCode as string] || "🌍",
    type: s.type as string,
    price: Number(s.discountPrice || s.price),
    priceUnit: t(config.priceUnitKey),
    rating: s.rating as number,
    reviews: (s._count as { reviews: number })?.reviews || 0,
    tags: s.isHot ? ["🔥"] : s.discountPrice ? ["-"] : undefined,
    amenities: (s.amenities as { name: string }[])?.map((a) => a.name).slice(0, 3),
    providerName: getProviderName(s.provider as ProviderInfo),
    duration: s.duration as string | null,
  };
}

export default function ToursPage() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [tourCategory, setTourCategory] = useState("");
  const [tourCounts, setTourCounts] = useState<{ all: number; oneDay: number; multiDay: number }>({ all: 0, oneDay: 0, multiDay: 0 });
  const [showFilters, setShowFilters] = useState(false);

  // Read destination from URL (stable initial state)
  const initialFilter = useMemo((): FilterState | undefined => {
    const destination = searchParams.get("destination");
    return destination ? { _cities: [destination] } : undefined;
  }, [searchParams]);

  // Stable extraParams reference via useMemo
  const extraParams = useMemo(
    () => (tourCategory ? { tourCategory } : undefined),
    [tourCategory],
  );

  // Capture tourCounts from API response
  const handleDataLoaded = useCallback((data: any) => {
    if (data?.tourCounts) {
      setTourCounts(data.tourCounts);
    }
  }, []);

  return (
    <ServiceCatalogPage
      config={config}
      mapService={mapTourService}
      extraParams={extraParams}
      initialFilterState={initialFilter}
      onDataLoaded={handleDataLoaded}
      aboveGrid={
        <>
          {/* Mobile filter toggle */}
          <div className="lg:hidden mb-4">
            <button onClick={() => setShowFilters(!showFilters)} className="w-full flex items-center justify-between bg-white rounded-2xl p-4 border border-gray-100">
              <span className="font-semibold text-secondary">🔧 {t('filter.title') || 'Фильтры'}</span>
              <span className="text-gray-400 transition-transform" style={{ transform: showFilters ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
            </button>
          </div>
          {/* Tour Category Tabs */}
          <div className="flex items-center gap-2 bg-white rounded-2xl p-2 border border-gray-100 mb-6">
            {[
              { value: "", label: `🌍 ${t("filter.all") || 'Все'} (${tourCounts.all})` },
              { value: "ONE_DAY", label: `☀️ ${t("filter.oneDay") || 'Однодневные'} — ${t("filter.tour.nights0") || '0 ночей'} (${tourCounts.oneDay})` },
              { value: "MULTI_DAY", label: `🗓 ${t("filter.multiDay") || 'Многодневные'} (${tourCounts.multiDay})` },
            ].map((tab) => (
              <button key={tab.value} onClick={() => { setTourCategory(tab.value); }}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${tourCategory === tab.value ? "bg-primary text-white shadow-md" : "text-gray-500 hover:bg-gray-100"}`}>
                {tab.label}
              </button>
            ))}
          </div>
        </>
      }
      emptyContent={
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-secondary mb-2">{t("filter.noResults")}</h2>
          <p className="text-gray-500 mb-6">{t("filter.tryAgain")}</p>
          <div className="flex items-center justify-center gap-3">
            <a href="/" className="h-11 px-6 border-2 border-gray-200 text-secondary rounded-xl font-medium hover:border-primary hover:text-primary transition-all">
              {t("common.backArrow")}
            </a>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-400 mb-3">{t("filter.similarDestinations")}</p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {[t("destinations.turkey"), t("destinations.uae"), t("destinations.italy"), t("destinations.spain"), t("destinations.greece")].map((dest, i) => (
                <a key={i} href={`/tours?destination=${encodeURIComponent(dest)}`} className="px-4 py-2 bg-gray-50 hover:bg-primary/5 text-secondary text-sm rounded-full border border-gray-200 hover:border-primary/30 transition-all">
                  {dest}
                </a>
              ))}
            </div>
          </div>
        </div>
      }
    />
  );
}
