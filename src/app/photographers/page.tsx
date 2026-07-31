"use client";

import ServiceCatalogPage from "@/components/ServiceCatalogPage";
import type { Service } from "@/components/ServiceCard";
import type { ProviderInfo } from "@/lib/types";
import { getProviderName } from "@/lib/types";
import { flagMap } from "@/lib/flags";

const config = {
  serviceType: "PHOTOGRAPHER",
  filterCategory: "photographer",
  heroGradient: "from-pink-600 to-rose-500",
  heroIcon: "📷",
  heroTitleKey: "photographers.title",
  heroSubtitleKey: "photographers.heroSubtitle",
  emptyIcon: "📷",
  emptyTextKey: "catalog.empty.photographers",
  defaultImage: "https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80",
  priceUnitKey: "catalog.pricePerSession",
};

/** Photographers use languages as amenities instead of standard amenities */
function mapPhotographerService(s: Record<string, unknown>, t: (key: string) => string): Service {
  return {
    id: s.id as string,
    name: s.title as string,
    image: (typeof s.images === "string" ? s.images.split(",").filter(Boolean) : s.images as string[])?.[0] || config.defaultImage,
    city: s.city as string,
    country: s.country as string,
    flag: flagMap[s.countryCode as string] || "📷",
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

export default function PhotographersPage() {
  return <ServiceCatalogPage config={config} mapService={mapPhotographerService} />;
}
