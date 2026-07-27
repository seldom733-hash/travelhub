"use client";

import ServiceCatalogPage from "@/components/ServiceCatalogPage";

const config = {
  serviceType: "SANATORIUM",
  filterCategory: "sanatorium",
  heroGradient: "from-emerald-600 to-green-500",
  heroIcon: "🏥",
  heroTitleKey: "nav.sanatoriums",
  heroSubtitleKey: "sanatoriums.subtitle",
  emptyIcon: "🏥",
  emptyTextKey: "catalog.empty.sanatoriums",
  defaultImage: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=80",
  priceUnitKey: "catalog.perDay",
};

export default function SanatoriumsPage() {
  return <ServiceCatalogPage config={config} />;
}
