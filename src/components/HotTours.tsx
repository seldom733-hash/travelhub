"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { flagMap } from "@/lib/flags";
import type { ProviderInfo } from "@/lib/types";
import { getProviderName } from "@/lib/types";
import { useFetch } from "@/lib/useFetch";

interface HotTourData {
  id: string;
  title: string;
  city: string;
  country: string;
  countryCode: string;
  price: number;
  discountPrice: number | null;
  hotDiscount: number | null;
  rating: number;
  reviewCount: number;
  images: string[];
  duration: string | null;
  provider?: ProviderInfo;
}

interface ServicesResponse {
  services: HotTourData[];
}

function CountdownTimer() {
  const [time, setTime] = useState({ hours: 4, minutes: 18, seconds: 32 });
  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prev) => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) return { hours: 23, minutes: 59, seconds: 59 };
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1">
        <span className="font-mono font-bold text-white text-lg">{pad(time.hours)}</span>
        <span className="text-white/50">:</span>
        <span className="font-mono font-bold text-white text-lg">{pad(time.minutes)}</span>
        <span className="text-white/50">:</span>
        <span className="font-mono font-bold text-white text-lg">{pad(time.seconds)}</span>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white/10 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-48 bg-white/10" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-white/10 rounded w-1/2" />
        <div className="h-4 bg-white/10 rounded w-2/3" />
        <div className="h-3 bg-white/10 rounded w-1/3" />
        <div className="h-5 bg-white/10 rounded w-1/4" />
      </div>
    </div>
  );
}

export default function HotTours() {
  const { t } = useI18n();
  const { data, loading, error } = useFetch<ServicesResponse>(
    "/api/services?type=TOUR&limit=20&sort=popular",
    { retries: 1, retryDelay: 2000 },
  );

  const hotTours = (data?.services ?? [])
    .filter((s) => s.hotDiscount && s.hotDiscount > 0)
    .slice(0, 4);

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-secondary via-gray-900 to-secondary">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-danger/20 rounded-full px-4 py-1.5 mb-4">
                <span className="w-2 h-2 bg-danger rounded-full animate-pulse" />
                <span className="text-danger text-sm font-semibold">{t("hotTours.badge")}</span>
              </div>
              <div className="h-9 bg-white/10 rounded w-64 mb-3 animate-pulse" />
              <div className="h-5 bg-white/10 rounded w-80 animate-pulse" />
            </div>
            <div className="mt-4 md:mt-0"><CountdownTimer /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </section>
    );
  }

  if (error || hotTours.length === 0) return null;

  return (
    <section className="py-16 bg-gradient-to-br from-secondary via-gray-900 to-secondary">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-danger/20 rounded-full px-4 py-1.5 mb-4">
              <span className="w-2 h-2 bg-danger rounded-full animate-pulse" />
              <span className="text-danger text-sm font-semibold">{t("hotTours.badge")}</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">{t("hotTours.title")} <span className="text-primary">-{hotTours[0]?.hotDiscount || 45}%</span></h2>
            <p className="text-gray-400 text-lg">{t("hotTours.subtitle")}</p>
          </div>
          <div className="mt-4 md:mt-0"><CountdownTimer /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {hotTours.map((tour) => (
            <a key={tour.id} href={`/tours/${tour.id}`} className="group relative bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-primary/50 transition-all">
              {tour.hotDiscount && (
                <div className="absolute top-3 left-3 z-10 bg-danger text-white text-sm font-bold px-3 py-1 rounded-full badge-pulse">
                  -{tour.hotDiscount}%
                </div>
              )}
              <div className="relative h-48 overflow-hidden">
                <img src={tour.images?.[0] || "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&q=80"} alt={tour.city} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-1 text-sm text-gray-300 mb-1">
                  <span>{flagMap[tour.countryCode] || "🏳"}</span>
                  <span>{tour.country}</span>
                </div>
                <h3 className="font-bold text-white text-lg mb-1 group-hover:text-primary transition-colors">{tour.city}</h3>
                <p className="text-gray-400 text-sm mb-2">{tour.title} · {tour.duration}</p>
                {tour.provider && (
                  <p className="text-xs text-gray-500 mb-2">🏢 {getProviderName(tour.provider)}</p>
                )}
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, j) => (<span key={j} className="text-star text-xs">★</span>))}
                  <span className="text-xs text-white font-semibold">{tour.rating}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 line-through text-sm">{tour.price}</span>
                  <span className="text-xl font-bold text-primary">{tour.discountPrice || tour.price}</span>
                  <span className="text-xs text-gray-400">AZN</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
