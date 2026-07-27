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
    <div className="h-80 rounded-3xl overflow-hidden animate-pulse bg-gray-200" />
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
  return Array.from(map.values()).sort((a, b) => b.tours - a.tours).slice(0, 6);
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </section>
    );
  }

  if (error || !destinations || destinations.length === 0) return null;

  return (
    <section id="popular" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-secondary mb-3">{t("popularDestinations.title")}</h2>
            <p className="text-gray-500 text-lg">{t("popularDestinations.subtitle")}</p>
          </div>
          <a href="/tours" className="hidden md:inline-flex items-center gap-1 text-primary font-medium hover:text-primary-dark transition-colors">{t("popularDestinations.viewAll")}</a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((dest) => (
            <a
              key={dest.country + dest.city}
              href={dest.id ? `/tours/${dest.id}` : `/tours?destination=${encodeURIComponent(dest.city)}`}
              className="group relative h-80 rounded-3xl overflow-hidden card-hover"
            >
              <img src={dest.image} alt={dest.city} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-white">{flagMap[dest.countryCode] || "🏳"} {dest.country}</div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-2xl font-bold text-white mb-1">{dest.city}</h3>
                <p className="text-white/70 text-sm mb-3">{dest.tours.toLocaleString()} {t("popularDestinations.tours")}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-white/60 text-sm">{t("popularDestinations.from")}</span>
                    <span className="text-xl font-bold text-white ml-1">{dest.price} AZN</span>
                  </div>
                  <span className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium text-white group-hover:bg-primary transition-colors">{t("popularDestinations.view")}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
