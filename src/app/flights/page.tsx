"use client";

import { useState } from "react";
import ServiceCatalogPage from "@/components/ServiceCatalogPage";
import type { FilterState } from "@/components/FilterSidebar";
import { useI18n } from "@/lib/i18n-context";

const config = {
  serviceType: "FLIGHT",
  filterCategory: "flight",
  heroGradient: "from-sky-600 to-blue-400",
  heroIcon: "✈️",
  heroTitleKey: "flights.title",
  heroSubtitleKey: "flights.subtitle",
  emptyIcon: "✈",
  emptyTextKey: "catalog.empty.flights",
  defaultImage: "https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=600&q=80",
  priceUnitKey: "catalog.pricePerTicket",
  skeletonCount: 9,
};

export default function FlightsPage() {
  const { t } = useI18n();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");

  /** Custom params builder that includes from/to/date search fields */
  const buildParams = (filterState: FilterState, page: number, sortBy: string) => {
    const params = new URLSearchParams({ type: "FLIGHT", page: String(page), limit: "9", sort: sortBy });
    if (from) params.set("city", from);
    if (to) params.set("country", to);
    if (filterState.stops) params.set("stops", (filterState.stops as string[]).join(","));
    if (filterState.airline) params.set("airline", (filterState.airline as string[]).join(","));
    if (filterState.departureTime) params.set("departureTime", (filterState.departureTime as string[]).join(","));
    if (filterState.baggage) params.set("baggage", (filterState.baggage as string[]).join(","));
    if (filterState._price) {
      params.set("minPrice", String((filterState._price as [number, number])[0]));
      params.set("maxPrice", String((filterState._price as [number, number])[1]));
    }
    return params;
  };

  return (
    <ServiceCatalogPage
      config={config}
      buildParams={buildParams}
      aboveGrid={
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t("flights.from")}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🛫</span>
                <input type="text" value={from} onChange={(e) => setFrom(e.target.value)} placeholder={t("flights.departureCity")} className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-0 outline-none text-sm bg-white text-gray-900 placeholder:text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t("flights.to")}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🛬</span>
                <input type="text" value={to} onChange={(e) => setTo(e.target.value)} placeholder={t("flights.arrivalCity")} className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-0 outline-none text-sm bg-white text-gray-900 placeholder:text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t("flights.date")}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📅</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-0 outline-none text-sm bg-white text-gray-900" />
              </div>
            </div>
            <div className="flex items-end">
              <button className="w-full h-12 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-primary/30">
                {t("flights.searchButton")}
              </button>
            </div>
          </div>
        </div>
      }
    />
  );
}
