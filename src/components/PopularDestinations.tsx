"use client";

import { useI18n } from "@/lib/i18n-context";
import { flagMap } from "@/lib/flags";
import { useFetch } from "@/lib/useFetch";

interface DestinationData {
  id: string;
  country: string;
  countryCode: string;
  city: string;
  tours: number;
  price: number;
  image: string;
}

interface RawService {
  id: string;
  country: string;
  countryCode: string;
  city: string;
  price: number;
  discountPrice: number | null;
  images: string[];
}

interface ServicesResponse {
  services: RawService[];
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

function transformDestinations(json: unknown): DestinationData[] {
  const data = json as ServicesResponse | null;
  if (!data?.services?.length) return [];

  const map = new Map<string, DestinationData>();
  for (const s of data.services) {
    const key = s.country;
    if (map.has(key)) {
      const existing = map.get(key)!;
      existing.tours++;
      if (s.price < existing.price) existing.price = s.price;
    } else {
      map.set(key, {
        id: s.id || "",
        country: s.country,
        countryCode: s.countryCode,
        city: s.city,
        tours: 1,
        price: s.discountPrice || s.price,
        image: s.images?.[0] || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.tours - a.tours).slice(0, 4);
}

export default function PopularDestinations() {
  const { t } = useI18n();
  const { data: destinations, loading, error } = useFetch<DestinationData[]>(
    "/api/services?type=TOUR&limit=30&sort=popular",
    { retries: 1, retryDelay: 2000, transform: transformDestinations },
  );

  if (loading) {
    return (
      <section id="popular" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="h-9 bg-gray-200 rounded w-64 mb-3 animate-pulse" />
              <div className="h-5 bg-gray-200 rounded w-80 animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </section>
    );
  }

  if (error || !destinations || destinations.length === 0) return null;

  return (
    <section id="popular" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="inline-block bg-accent/10 text-accent text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              🌍 {t("popularDestinations.badge") || "Направления"}
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-secondary mb-3">{t("popularDestinations.title")}</h2>
            <p className="text-gray-500 text-lg max-w-xl">{t("popularDestinations.subtitle")}</p>
          </div>
          <a href="/tours" className="hidden md:inline-flex items-center gap-1.5 text-primary font-semibold hover:text-primary-dark transition-colors group">
            {t("popularDestinations.viewAll")}
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {destinations.map((dest) => (
            <a
              key={dest.country + dest.city}
              href={dest.id ? `/tours/${dest.id}` : `/tours?destination=${encodeURIComponent(dest.city)}`}
              className="group card-hover bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-primary/30"
            >
              <div className="relative h-48 overflow-hidden">
                <img src={dest.image} alt={dest.city} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs font-semibold text-secondary">{flagMap[dest.countryCode] || "🏳"} {dest.country}</div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-secondary mb-1 group-hover:text-primary transition-colors line-clamp-1">{dest.city}</h3>
                <p className="text-sm text-gray-500 mb-2">{dest.tours.toLocaleString()} {t("popularDestinations.tours")}</p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <div>
                    <span className="text-xs text-gray-400">{t("popularDestinations.from")}</span>
                    <span className="text-xl font-bold text-primary ml-1">{dest.price} AZN</span>
                  </div>
                  <span className="text-xs text-primary font-medium group-hover:translate-x-1 transition-transform">{t("popularDestinations.view")}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
