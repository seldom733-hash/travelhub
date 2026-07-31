"use client";

import { useI18n } from "@/lib/i18n-context";
import type { ProviderInfo } from "@/lib/types";
import { getProviderName } from "@/lib/types";
import { useFetch } from "@/lib/useFetch";

interface GuideData {
  id: string;
  title: string;
  city: string;
  country: string;
  rating: number;
  reviewCount: number;
  price: number;
  image: string;
  languages: string[];
  provider?: ProviderInfo;
}

interface ServicesResponse {
  services: Array<Record<string, unknown>>;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="pt-3 border-t border-gray-50 flex justify-between"><div className="h-5 bg-gray-200 rounded w-16" /><div className="h-3 bg-gray-200 rounded w-20" /></div>
      </div>
    </div>
  );
}

function transformGuides(json: unknown): GuideData[] {
  const data = json as ServicesResponse | null;
  if (!data?.services?.length) return [];
  return data.services.map((s) => ({
    id: s.id as string,
    title: s.title as string,
    city: s.city as string,
    country: s.country as string,
    rating: s.rating as number,
    reviewCount: (s._count as { reviews: number })?.reviews || 0,
    price: Number(s.discountPrice || s.price),
    image: (typeof s.images === "string" ? s.images.split(",").filter(Boolean) : s.images as string[])?.[0] || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    languages: Array.isArray(s.languages)
      ? (s.languages as string[])
      : typeof s.languages === "string"
        ? (s.languages as string).split(",")
        : ["EN", "RU"],
    provider: s.provider as ProviderInfo | undefined,
  }));
}

export default function Guides() {
  const { t } = useI18n();
  const { data: guides, loading, error } = useFetch<GuideData[]>(
    "/api/services?type=GUIDE&limit=4&sort=popular",
    { retries: 1, retryDelay: 2000, transform: transformGuides },
  );

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-secondary mb-3">{t("guides.title")}</h2>
            <p className="text-gray-500 text-lg">{t("guides.subtitle")}</p>
          </div>
          <a href="/guides" className="hidden md:inline-flex items-center gap-1 text-primary font-medium hover:text-primary-dark transition-colors">{t("guides.viewAll")}</a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : error ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">⚠️</p>
              <p>{t("common.loadingError")}</p>
            </div>
          ) : !guides || guides.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">🧭</p>
              <p>{t("common.noData")}</p>
            </div>
          ) : (
            guides.map((guide) => (
              <a key={guide.id} href={`/guides/${guide.id}`} className="group card-hover bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-primary/30">
                <div className="relative h-48 overflow-hidden">
                  <img src={guide.image} alt={guide.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute top-3 right-3 bg-success text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">✓ {t("guides.hasLicense")}</div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-secondary mb-1 group-hover:text-primary transition-colors line-clamp-1">{guide.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">📍 {guide.city}, {guide.country}</p>
                  {guide.provider && (
                    <p className="text-xs text-gray-400 mb-2">🏢 {getProviderName(guide.provider)}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {guide.languages.map((lang) => (<span key={lang} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">{lang.trim()}</span>))}
                  </div>
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (<span key={i} className="text-star text-xs">★</span>))}
                    <span className="text-xs font-semibold text-secondary">{guide.rating}</span>
                    <span className="text-xs text-gray-400">({guide.reviewCount})</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <span className="text-xl font-bold text-primary">{guide.price} AZN</span>
                    <span className="text-xs text-primary font-medium group-hover:translate-x-1 transition-transform">{t("guides.message")} →</span>
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
