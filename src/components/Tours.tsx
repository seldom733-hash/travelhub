"use client";

import { useI18n } from "@/lib/i18n-context";
import { flagMap } from "@/lib/flags";
import type { ProviderInfo } from "@/lib/types";
import { getProviderName } from "@/lib/types";
import { useFetch } from "@/lib/useFetch";

interface TourData {
  id: string;
  title: string;
  city: string;
  country: string;
  countryCode: string;
  price: number;
  discountPrice: number | null;
  rating: number;
  reviewCount: number;
  images: string[];
  duration: string | null;
  provider?: ProviderInfo;
}

interface ServicesResponse {
  services: TourData[];
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="pt-3 border-t border-gray-50 flex justify-between">
          <div className="h-5 bg-gray-200 rounded w-16" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
      </div>
    </div>
  );
}

export default function Tours() {
  const { t } = useI18n();
  const { data, loading, error } = useFetch<ServicesResponse>(
    "/api/services?type=TOUR&limit=4&sort=popular",
    { retries: 1, retryDelay: 2000 },
  );

  const tours = data?.services ?? [];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-secondary mb-3">{t("tours.title")}</h2>
            <p className="text-gray-500 text-lg">{t("tours.subtitle")}</p>
          </div>
          <a href="/tours" className="hidden md:inline-flex items-center gap-1 text-primary font-medium hover:text-primary-dark transition-colors">{t("tours.viewAll")}</a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : error ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">⚠️</p>
              <p>{t("common.loadingError")}</p>
            </div>
          ) : tours.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">🏖</p>
              <p>{t("common.noData")}</p>
            </div>
          ) : (
            tours.map((tour) => (
              <a key={tour.id} href={`/tours/${tour.id}`} className="group card-hover bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-primary/30">
                <div className="relative h-48 overflow-hidden">
                  <img src={tour.images?.[0] || "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&q=80"} alt={tour.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  {tour.duration && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs font-medium text-secondary">
                      {tour.duration.startsWith("1 ") ? `🗓 ${t("filter.oneDay")}` : `📅 ${t("filter.multiDay")}`} · {tour.duration}
                    </div>
                  )}
                  {tour.discountPrice && (
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-danger to-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg shadow-danger/30">
                      -{Math.round(((tour.price - tour.discountPrice) / tour.price) * 100)}%
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-secondary mb-1 group-hover:text-primary transition-colors line-clamp-1">{tour.title}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mb-2"><span>{flagMap[tour.countryCode] || "🏳"}</span><span>{tour.city}</span></div>
                  {tour.provider && (
                    <p className="text-xs text-gray-400 mb-2">🏢 {getProviderName(tour.provider)}</p>
                  )}
                  <div className="flex items-center gap-1 mb-3">
                    <span className="text-xs font-semibold text-secondary">{tour.rating}</span>
                    <span className="text-xs text-gray-400">({tour.reviewCount || 0})</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <div>
                      {tour.discountPrice && <span className="text-sm text-gray-400 line-through mr-2">{tour.price}</span>}
                      <span className="text-xl font-bold text-primary">{tour.discountPrice || tour.price} AZN</span>
                    </div>
                    <span className="text-xs text-primary font-medium group-hover:translate-x-1 transition-transform">{t("tours.perPerson")}</span>
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
        <div className="mt-6 text-center md:hidden">
          <a href="/tours" className="text-primary font-medium hover:text-primary-dark transition-colors">{t("tours.viewAll")}</a>
        </div>
      </div>
    </section>
  );
}
