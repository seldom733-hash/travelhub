"use client";

import ServiceCatalogPage from "@/components/ServiceCatalogPage";
import type { Service } from "@/components/ServiceCard";
import type { ProviderInfo } from "@/lib/types";
import { getProviderName } from "@/lib/types";
import { flagMap } from "@/lib/flags";

const config = {
  serviceType: "GUIDE",
  filterCategory: "guide",
  heroGradient: "from-violet-600 to-indigo-500",
  heroIcon: "🧭",
  heroTitleKey: "guides.title",
  heroSubtitleKey: "guides.heroSubtitle",
  emptyIcon: "🧭",
  emptyTextKey: "catalog.empty.guides",
  defaultImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
  priceUnitKey: "catalog.pricePerHour",
};

/** Guides use languages as amenities instead of standard amenities */
function mapGuideService(s: Record<string, unknown>, t: (key: string) => string): Service {
  return {
    id: s.id as string,
    name: s.title as string,
    image: (s.images as string[])?.[0] || config.defaultImage,
    city: s.city as string,
    country: s.country as string,
    flag: flagMap[s.countryCode as string] || "🧭",
    type: s.type as string,
    price: Number(s.discountPrice || s.price),
    priceUnit: t(config.priceUnitKey),
    rating: s.rating as number,
    reviews: (s._count as { reviews: number })?.reviews || 0,
    tags: s.isHot ? ["Популярный"] : undefined,
    amenities: (s.languages as string[])?.slice(0, 3),
    providerName: getProviderName(s.provider as ProviderInfo),
  };
}

export default function GuidesPage() {
  return <ServiceCatalogPage config={config} mapService={mapGuideService} />;
}
