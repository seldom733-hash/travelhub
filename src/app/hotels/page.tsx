"use client";

import ServiceCatalogPage from "@/components/ServiceCatalogPage";

const config = {
  serviceType: "HOTEL",
  filterCategory: "hotel",
  heroGradient: "from-blue-600 to-cyan-500",
  heroIcon: "🏨",
  heroTitleKey: "nav.hotels",
  heroSubtitleKey: "hotels.subtitle",
  emptyIcon: "🏨",
  emptyTextKey: "catalog.empty.hotels",
  defaultImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
  priceUnitKey: "catalog.perNight",
};

export default function HotelsPage() {
  return <ServiceCatalogPage config={config} />;
}
