"use client";

import { useI18n } from "@/lib/i18n-context";
import { flagMap } from "@/lib/flags";
import { useFetch } from "@/lib/useFetch";

interface TransferData {
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
  maxGuests: number | null;
  type: string;
}

interface ServicesResponse {
  services: TransferData[];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <span key={i} className={`text-xs ${i < Math.floor(rating) ? "text-star" : "text-gray-300"}`}>★</span>
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="pt-3 border-t border-gray-50 flex justify-between">
          <div className="h-6 bg-gray-200 rounded w-20" />
          <div className="h-4 bg-gray-200 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

export default function Transfers() {
  const { t } = useI18n();
  const { data, loading, error } = useFetch<ServicesResponse>(
    "/api/services?type=TRANSFER&limit=4&sort=popular",
    { retries: 1, retryDelay: 2000 },
  );

  const transfers = data?.services ?? [];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-secondary mb-3">🚐 {t("transfers.title")}</h2>
            <p className="text-gray-500 text-lg">{t("transfers.subtitle")}</p>
          </div>
          <a href="/transfers" className="hidden md:inline-flex items-center gap-1 text-primary font-medium hover:text-primary-dark transition-colors">{t("transfers.viewAll")}</a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : error ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">⚠️</p>
              <p>{t("common.loadingError")}</p>
            </div>
          ) : transfers.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">🚐</p>
              <p>{t("common.noData")}</p>
            </div>
          ) : (
            transfers.map((tr) => (
              <a key={tr.id} href={`/transfers/${tr.id}`} className="group card-hover bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-primary/30">
                <div className="relative h-48 overflow-hidden">
                  <img src={tr.images?.[0] || "https://images.unsplash.com/photo-1449965408869-ebd3fee19d3e?w=600&q=80"} alt={tr.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  {tr.duration && (
                    <div className="absolute top-3 left-3">
                      <span className="bg-white/90 backdrop-blur-sm text-secondary text-xs font-bold px-3 py-1.5 rounded-full">
                        ⏱ {tr.duration}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-secondary mb-1 group-hover:text-primary transition-colors text-sm leading-tight">{tr.title}</h3>
                  <p className="text-xs text-gray-500 mb-2">{flagMap[tr.countryCode] || "🏳"} {tr.city}</p>
                  <div className="flex items-center gap-1 mb-2">
                    <StarRating rating={tr.rating} />
                    <span className="text-xs text-gray-400">({tr.reviewCount || 0})</span>
                  </div>
                  {tr.maxGuests && (
                    <p className="text-xs text-gray-400 mb-2">👥 {t("transfers.upTo")} {tr.maxGuests} {t("transfers.persons")}</p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <div>
                      {tr.discountPrice && <span className="text-xs text-gray-400 line-through mr-1">{tr.price}</span>}
                      <span className="text-lg font-bold text-primary">{tr.discountPrice || tr.price} AZN</span>
                    </div>
                    <span className="text-xs text-gray-400">{t("transfers.perTrip")}</span>
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
