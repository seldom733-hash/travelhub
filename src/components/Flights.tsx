"use client";

import { useI18n } from "@/lib/i18n-context";
import { useFetch } from "@/lib/useFetch";

interface FlightData {
  id: string;
  title: string;
  city: string;
  country: string;
  price: number;
  duration: string | null;
  images: string[];
}

interface ServicesResponse {
  services: FlightData[];
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6 animate-pulse">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-3 md:w-40">
          <div className="w-10 h-10 bg-gray-200 rounded-xl" />
          <div className="space-y-1"><div className="h-3 bg-gray-200 rounded w-16" /><div className="h-2 bg-gray-200 rounded w-12" /></div>
        </div>
        <div className="flex-1 flex items-center gap-4">
          <div className="h-8 bg-gray-200 rounded w-12" />
          <div className="flex-1 h-px bg-gray-200" />
          <div className="h-8 bg-gray-200 rounded w-12" />
        </div>
        <div className="md:w-64 flex justify-end"><div className="h-8 bg-gray-200 rounded w-28" /></div>
      </div>
    </div>
  );
}

export default function Flights() {
  const { t } = useI18n();
  const { data, loading, error } = useFetch<ServicesResponse>(
    "/api/services?type=FLIGHT&limit=5&sort=popular",
    { retries: 1, retryDelay: 2000 },
  );

  const flights = data?.services ?? [];

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="h-9 bg-gray-200 rounded w-64 mx-auto mb-3 animate-pulse" />
            <div className="h-5 bg-gray-200 rounded w-80 mx-auto animate-pulse" />
          </div>
          <div className="space-y-4 max-w-5xl mx-auto">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      </section>
    );
  }

  if (error || flights.length === 0) return null;

  return (
    <section className="py-16 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-secondary mb-3">{t("flights.title")}</h2>
          <p className="text-gray-500 text-lg">{t("flights.subtitle")}</p>
        </div>
        <div className="space-y-4 max-w-5xl mx-auto">
          {flights.map((flight) => (
            <a key={flight.id} href={`/flights/${flight.id}`} className="group block bg-white rounded-2xl border border-gray-100 hover:border-sky-300 hover:shadow-lg transition-all p-5 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-0">
                <div className="flex items-center gap-3 md:w-40 shrink-0">
                  <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center text-xl">✈</div>
                  <div>
                    <p className="text-sm font-semibold text-secondary">{flight.title.split("→")[0]?.trim()}</p>
                    <p className="text-xs text-gray-400">{t("flights.direct")}</p>
                  </div>
                </div>
                <div className="flex-1 flex items-center gap-4 md:gap-6">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-secondary">{flight.title.split("→")[0]?.trim().slice(0, 3).toUpperCase()}</p>
                    <p className="text-sm text-gray-500">{flight.city}</p>
                  </div>
                  <div className="flex-1 relative px-2">
                    <div className="h-px bg-gray-300 w-full" />
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center"><span className="text-sky-600 text-sm">✈</span></div>
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap">{flight.duration}</div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-secondary">{flight.title.split("→")[1]?.trim().slice(0, 3).toUpperCase()}</p>
                    <p className="text-sm text-gray-500">{flight.country}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-6 md:w-64 shrink-0">
                  <div className="text-right">
                    <p className="text-sm text-gray-500">{t("flights.today")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{t("common.from")} {flight.price} AZN</p>
                  </div>
                  <span className="hidden md:inline-flex w-10 h-10 bg-primary/10 rounded-xl items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">→</span>
                </div>
              </div>
            </a>
          ))}
        </div>
        <div className="text-center mt-8">
          <a href="/flights" className="inline-flex items-center gap-2 h-12 px-8 bg-primary hover:bg-primary-dark text-white rounded-2xl font-semibold transition-all hover:shadow-lg hover:shadow-primary/30">
            ✈ {t("flights.viewAll")}
          </a>
        </div>
      </div>
    </section>
  );
}
