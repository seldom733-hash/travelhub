import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://travelhub.com";

/** Route-to-type mapping for service detail URLs */
const TYPE_TO_ROUTE: Record<string, string> = {
  TOUR: "tours",
  HOTEL: "hotels",
  SANATORIUM: "sanatoriums",
  EXCURSION: "excursions",
  GUIDE: "guides",
  PHOTOGRAPHER: "photographers",
  TRANSFER: "transfers",
  FLIGHT: "flights",
  TRAIN: "trains",
};

/** Static catalog pages */
const CATALOG_ROUTES = [
  "tours",
  "hotels",
  "sanatoriums",
  "excursions",
  "guides",
  "photographers",
  "transfers",
  "flights",
  "trains",
];

/** Static informational pages */
const STATIC_ROUTES = [
  { path: "", priority: 1.0, changeFrequency: "daily" as const },
  { path: "auth/login", priority: 0.3, changeFrequency: "monthly" as const },
  { path: "auth/register", priority: 0.3, changeFrequency: "monthly" as const },
  { path: "faq", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "terms", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "privacy", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "business", priority: 0.5, changeFrequency: "monthly" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // ── Static pages ──
  for (const route of STATIC_ROUTES) {
    entries.push({
      url: `${BASE_URL}/${route.path}`,
      lastModified: new Date(),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    });
  }

  // ── Catalog index pages ──
  for (const catalog of CATALOG_ROUTES) {
    entries.push({
      url: `${BASE_URL}/${catalog}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    });
  }

  // ── Dynamic service detail pages from database ──
  try {
    const { prisma } = await import("@/lib/prisma");
    const services = await prisma.service.findMany({
      where: { isActive: true },
      select: {
        id: true,
        type: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    for (const service of services) {
      const route = TYPE_TO_ROUTE[service.type];
      if (route) {
        entries.push({
          url: `${BASE_URL}/${route}/${service.id}`,
          lastModified: service.updatedAt,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }
  } catch (error) {
    console.error("Sitemap: failed to fetch services from database:", error);
    // Return static entries only if DB is unavailable
  }

  return entries;
}
