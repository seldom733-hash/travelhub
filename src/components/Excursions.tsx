"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { flagMap } from "@/lib/flags";
import type { ProviderInfo } from "@/lib/types";
import { getProviderName } from "@/lib/types";
import { useFetch } from "@/lib/useFetch";

interface ExcursionData {
  id: string;
  title: string;
  city: string;
  country: string;
  countryCode: string;
  price: number;
  rating: number;
  reviewCount: number;
  images: string[];
  duration: string | null;
  provider?: ProviderInfo;
}

interface ServicesResponse {
  services: ExcursionData[];
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

export default function Excursions() {
  const { t } = useI18n();
  const { data, loading, error } = useFetch<ServicesResponse>(
    "/api/services?type=EXCURSION&limit=4&sort=popular",
    { retries: 1, retryDelay: 2000 },
  );

  const excursions = data?.services ?? [];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-secondary mb-3">{t("excursions.title")}</h2>
            <p className="text-gray-500 text-lg">{t("excursions.subtitle")}</p>
          </div>
          <a href="/excursions" className="hidden md:inline-flex items-center gap-1 text-primary font-medium hover:text-primary-dark transition-colors">{t("excursions.viewAll")}</a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : error ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">⚠️</p>
              <p>{t("common.loadingError")}</p>
            </div>
          ) : excursions.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">🏛</p>
              <p>{t("common.noData")}</p>
            </div>
          ) : (
            excursions.map((exc) => (
              <a key={exc.id} href={`/excursions/${exc.id}`} className="group card-hover bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-primary/30">
                <div className="relative h-48 overflow-hidden">
                  <img src={exc.images?.[0] || "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80"} alt={exc.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  {exc.duration && <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium text-secondary">⏱ {exc.duration}</div>}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-secondary mb-1 group-hover:text-primary transition-colors">{exc.title}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-500 mb-2"><span>{flagMap[exc.countryCode] || "🏳"}</span><span>{exc.city}</span></div>
                  {exc.provider && (
                    <p className="text-xs text-gray-400 mb-2">🏢 {getProviderName(exc.provider)}</p>
                  )}
                  <div className="flex items-center gap-1 mb-3">
                    <span className="text-xs font-semibold text-secondary">{exc.rating}</span>
                    <span className="text-xs text-gray-400">({exc.reviewCount || 0})</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <span className="text-xl font-bold text-primary">{exc.price} AZN</span>
                    <span className="text-xs text-primary font-medium group-hover:translate-x-1 transition-transform">{t("excursions.moreDetails")}</span>
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
