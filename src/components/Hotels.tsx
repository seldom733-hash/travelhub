"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { flagMap } from "@/lib/flags";
import type { ProviderInfo } from "@/lib/types";
import { getProviderName } from "@/lib/types";

interface HotelData {
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
  amenities: { name: string }[];
  type: string;
  provider?: ProviderInfo;
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
      <div className="h-52 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="flex gap-2"><div className="h-5 bg-gray-200 rounded w-12" /><div className="h-5 bg-gray-200 rounded w-12" /></div>
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="pt-3 border-t border-gray-50 flex justify-between"><div className="h-6 bg-gray-200 rounded w-20" /><div className="h-4 bg-gray-200 rounded w-16" /></div>
      </div>
    </div>
  );
}

export default function Hotels() {
  const { t } = useI18n();
  const [hotels, setHotels] = useState<HotelData[]>([]);
  const [sanatoriums, setSanatoriums] = useState<HotelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [hotelRes, sanRes] = await Promise.all([
          fetch("/api/services?type=HOTEL&limit=3&sort=popular"),
          fetch("/api/services?type=SANATORIUM&limit=3&sort=popular"),
        ]);
        if (hotelRes.ok) {
          const hd = await hotelRes.json();
          if (hd.services?.length) setHotels(hd.services);
        }
        if (sanRes.ok) {
          const sd = await sanRes.json();
          if (sd.services?.length) setSanatoriums(sd.services);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Hotels */}
        <div className="mb-16">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-secondary mb-3">{t("hotels.title")}</h2>
              <p className="text-gray-500 text-lg">{t("hotels.subtitle")}</p>
            </div>
            <a href="/hotels" className="hidden md:inline-flex items-center gap-1 text-primary font-medium hover:text-primary-dark transition-colors">{t("hotels.viewAll")}</a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : error ? (
              <div className="col-span-full text-center py-12 text-gray-400">
                <p className="text-4xl mb-3">⚠️</p>
                <p>{t("common.loadingError")}</p>
              </div>
            ) : hotels.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-400">
                <p className="text-4xl mb-3">🏨</p>
                <p>{t("common.noData")}</p>
              </div>
            ) : (
              hotels.map((h) => (
                <a key={h.id} href={`/hotels/${h.id}`} className="group card-hover bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-primary/30">
                  <div className="relative h-52 overflow-hidden">
                    <img src={h.images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80"} alt={h.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-3 left-3"><StarRating rating={h.rating} /></div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-secondary text-lg mb-1 group-hover:text-primary transition-colors">{h.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">{flagMap[h.countryCode] || "🏳"} {h.city}</p>
                    {h.provider && (
                      <p className="text-xs text-gray-400 mb-2">🏢 {getProviderName(h.provider)}</p>
                    )}
                    {h.amenities?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {h.amenities.slice(0, 3).map((a) => (<span key={a.name} className="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full font-medium">{a.name}</span>))}
                      </div>
                    )}
                    <div className="flex items-center gap-1 mb-3">
                      <span className="text-xs font-semibold text-secondary">{h.rating}</span>
                      <span className="text-xs text-gray-400">({h.reviewCount || 0})</span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      <div>
                        {h.discountPrice && <span className="text-sm text-gray-400 line-through mr-2">{h.price}</span>}
                        <span className="text-xl font-bold text-primary">{h.discountPrice || h.price} AZN</span>
                      </div>
                      <span className="text-xs text-gray-400">{t("hotels.perNight")}</span>
                    </div>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>

        {/* Sanatoriums */}
        <div>
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-secondary mb-3">{t("sanatoriums.title")}</h2>
              <p className="text-gray-500 text-lg">{t("sanatoriums.subtitle")}</p>
            </div>
            <a href="/sanatoriums" className="hidden md:inline-flex items-center gap-1 text-primary font-medium hover:text-primary-dark transition-colors">{t("sanatoriums.viewAll")}</a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : error ? (
              <div className="col-span-full text-center py-12 text-gray-400">
                <p className="text-4xl mb-3">⚠️</p>
                <p>{t("common.loadingError")}</p>
              </div>
            ) : sanatoriums.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-400">
                <p className="text-4xl mb-3">🏥</p>
                <p>{t("common.noData")}</p>
              </div>
            ) : (
              sanatoriums.map((s) => (
                <a key={s.id} href={`/sanatoriums/${s.id}`} className="group card-hover bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-accent/30">
                  <div className="relative h-52 overflow-hidden">
                    <img src={s.images?.[0] || "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=80"} alt={s.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-secondary text-lg mb-1 group-hover:text-primary transition-colors">{s.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">{flagMap[s.countryCode] || "🏳"} {s.city}</p>
                    {s.provider && (
                      <p className="text-xs text-gray-400 mb-2">🏢 {getProviderName(s.provider)}</p>
                    )}
                    <div className="flex items-center gap-1 mb-3">
                      <span className="text-xs font-semibold text-secondary">{s.rating}</span>
                      <span className="text-xs text-gray-400">({s.reviewCount || 0})</span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      <span className="text-xl font-bold text-primary">{s.price} AZN</span>
                      <span className="text-xs text-gray-400">{t("sanatoriums.perDay")}</span>
                    </div>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
