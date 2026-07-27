"use client";

import ServiceCatalogPage from "@/components/ServiceCatalogPage";

const config = {
  serviceType: "EXCURSION",
  filterCategory: "excursion",
  heroGradient: "from-teal-600 to-emerald-500",
  heroIcon: "🏛️",
  heroTitleKey: "nav.excursions",
  heroSubtitleKey: "excursions.subtitle",
  emptyIcon: "🏛",
  emptyTextKey: "catalog.empty.excursions",
  defaultImage: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80",
  priceUnitKey: "catalog.perPerson",
};

export default function ExcursionsPage() {
  return <ServiceCatalogPage config={config} />;
}
