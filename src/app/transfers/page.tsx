"use client";

import ServiceCatalogPage from "@/components/ServiceCatalogPage";

const config = {
  serviceType: "TRANSFER",
  filterCategory: "transfer",
  heroGradient: "from-slate-700 to-gray-500",
  heroIcon: "🚐",
  heroTitleKey: "nav.transfers",
  heroSubtitleKey: "transfers.subtitle",
  emptyIcon: "🚐",
  emptyTextKey: "catalog.empty.transfers",
  defaultImage: "https://images.unsplash.com/photo-1449965408869-ebd3fee19d3e?w=600&q=80",
  priceUnitKey: "catalog.pricePerTrip",
  defaultFlag: "🚐",
};

export default function TransfersPage() {
  return <ServiceCatalogPage config={config} />;
}
