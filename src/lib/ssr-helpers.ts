import { prisma } from "./prisma";
import { flagMap } from "./flags";
import type { ProviderInfo } from "./types";
import { getProviderName } from "./types";
import type { Service } from "@/components/ServiceCard";
import type { ServiceCatalogInitialData } from "@/components/ServiceCatalogPage";

const defaultImages: Record<string, string> = {
  TOUR: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&q=80",
  HOTEL: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
  EXCURSION: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80",
  TRANSFER: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=80",
  SANATORIUM: "https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=600&q=80",
  GUIDE: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=600&q=80",
  PHOTOGRAPHER: "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=600&q=80",
};

function mapRawToService(
  s: Record<string, unknown>,
  serviceType: string,
  priceUnitKey: string,
  t: (key: string) => string,
): Service {
  return {
    id: s.id as string,
    name: s.title as string,
    image: (s.images as string[])?.[0] || defaultImages[serviceType] || defaultImages.TOUR,
    city: s.city as string,
    country: s.country as string,
    flag: flagMap[s.countryCode as string] || "🌍",
    type: s.type as string,
    price: Number(s.discountPrice || s.price),
    priceUnit: t(priceUnitKey),
    rating: s.rating as number,
    reviews: (s._count as { reviews: number })?.reviews || 0,
    tags: s.isHot ? ["🔥"] : s.discountPrice ? ["-"] : undefined,
    amenities: (s.amenities as { name: string }[])?.map((a) => a.name).slice(0, 3),
    providerName: getProviderName(s.provider as ProviderInfo),
    duration: s.duration as string | null,
  };
}

/**
 * Fetch the first page of services for SSR.
 * Returns data in the shape expected by ServiceCatalogInitialData.
 */
export async function fetchServicesForSSR(
  serviceType: string,
  priceUnitKey: string,
  t: (key: string) => string,
  opts?: { tourCategory?: string; page?: number; limit?: number },
): Promise<ServiceCatalogInitialData> {
  const page = opts?.page || 1;
  const limit = opts?.limit || 9;

  const where: Record<string, unknown> = {
    type: serviceType,
    isActive: true,
  };

  if (opts?.tourCategory) {
    where.tourCategory = opts.tourCategory;
  }    const [services, totalCount] = await Promise.all([
    prisma.service.findMany({
      where,
      include: {
        amenities: true,
        provider: true,
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.service.count({ where }),
  ]);

  const items = services.map((s) => mapRawToService(s as unknown as Record<string, unknown>, serviceType, priceUnitKey, t));

  // Serialize Prisma objects to plain JSON — Decimal, Date, etc. cannot cross the Server→Client boundary
  const serialized = JSON.parse(JSON.stringify(services));

  return {
    items,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    rawServices: serialized,
  };
}
