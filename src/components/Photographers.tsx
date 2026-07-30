"use client";

import { useI18n } from "@/lib/i18n-context";
import { flagMap } from "@/lib/flags";
import type { ProviderInfo } from "@/lib/types";
import { getProviderName } from "@/lib/types";
import { useFetch } from "@/lib/useFetch";

interface PhotoData {
  id: string;
  title: string;
  city: string;
  country: string;
  countryCode: string;
  price: number;
  rating: number;
  reviewCount: number;
  images: string[];
  provider?: ProviderInfo;
}

interface ServicesResponse {
  services: PhotoData[];
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-5 space-y-2">
        <div className="h-5 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-200 rounded w-1/4" />
        <div className="pt-3 border-t border-gray-50 flex justify-between"><div className="h-5 bg-gray-200 rounded w-24" /><div className="h-3 bg-gray-200 rounded w-16" /></div>
      </div>
    </div>
  );
}

export default function Photographers() {
  const { t } = useI18n();
  const { data, loading, error } = useFetch<ServicesResponse>(
    "/api/services?type=PHOTOGRAPHER&limit=4&sort=popular",
    { retries: 1, retryDelay: 2000 },
  );

  const photographers = data?.services ?? [];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-secondary mb-3">{t("photographers.title")}</h2>
            <p className="text-gray-500 text-lg">{t("photographers.subtitle")}</p>
          </div>
          <a href="/photographers" className="hidden md:inline-flex items-center gap-1 text-primary font-medium hover:text-primary-dark transition-colors">{t("photographers.viewAll")}</a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : error ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">⚠️</p>
              <p>{t("common.loadingError")}</p>
            </div>
          ) : photographers.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">📷</p>
              <p>{t("common.noData")}</p>
            </div>
          ) : (
            photographers.map((p) => (
              <a key={p.id} href={`/photographers/${p.id}`} className="group card-hover bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-pink-300">
                <div className="relative h-48 overflow-hidden">
                  <img src={p.images?.[0] || "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80"} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  {p.images?.[1] && <div className="absolute top-3 right-3"><img src={p.images[1]} alt={p.title} className="w-12 h-12 rounded-full border-2 border-white object-cover" /></div>}
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-secondary text-lg group-hover:text-pink-500 transition-colors">{p.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">📍 {p.city}, {p.country}</p>
                  {p.provider && (
                    <p className="text-xs text-gray-400 mb-2">🏢 {getProviderName(p.provider)}</p>
                  )}
                  <div className="flex items-center gap-1 mb-3">
                    <span className="text-xs font-semibold text-secondary">{p.rating}</span>
                    <span className="text-xs text-gray-400">({p.reviewCount || 0})</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <span className="text-xl font-bold text-primary">{t("common.from")} {p.price} AZN</span>
                    <span className="text-xs text-primary font-medium group-hover:translate-x-1 transition-transform">{t("photographers.order")}</span>
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
