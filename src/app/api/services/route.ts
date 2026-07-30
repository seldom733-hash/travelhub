export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { servicesCache, ApiCache } from "@/lib/api-cache";
import {
  buildContext,
  applyCommonFilters,
  applyHotelFilters,
  applyTourFilters,
  applyExcursionFilters,
  applyTransferFilters,
  applySanatoriumFilters,
  applyGuideFilters,
  applyPhotographerFilters,
  applyPostFilters,
} from "./filters";
import { createService } from "./createService";

/* ─────────────────────────────── GET ─────────────────────────────── */

export async function GET(request: NextRequest) {
  try {
    // Rate limiting: 30 requests per minute per IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    const rateLimit = checkRateLimit(`services:${ip}`, 30, 60000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
    }

    const { prisma } = await import("@/lib/prisma");
    const { ctx, params, type } = buildContext(request);
    const { searchParams, where, andConditions } = ctx;
    const { page, limit } = params;

    // ── Apply filters by service type ──
    applyCommonFilters({ ctx, params });

    if (type === "HOTEL") applyHotelFilters(ctx);
    if (type === "TOUR") applyTourFilters(ctx);
    if (type === "EXCURSION") applyExcursionFilters(ctx);
    if (type === "TRANSFER") applyTransferFilters(ctx);
    if (type === "SANATORIUM") applySanatoriumFilters(ctx);
    if (type === "GUIDE") applyGuideFilters(ctx);
    if (type === "PHOTOGRAPHER") applyPhotographerFilters(ctx);

    // ── Combine all conditions ──
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // ── Sorting ──
    const sort = params.sort;
    let orderBy: Record<string, string>;
    switch (sort) {
      case "price_asc":  orderBy = { price: "asc" }; break;
      case "price_desc": orderBy = { price: "desc" }; break;
      case "rating":     orderBy = { rating: "desc" }; break;
      case "newest":     orderBy = { createdAt: "desc" }; break;
      case "popular":
      default:           orderBy = { rating: "desc" }; break;
    }

    // Fetch with buffer for remaining post-filters (duration, distanceToSea), then slice
    const skip = (page - 1) * limit;
    const fetchLimit = Math.max(limit * 2, 30);
    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        select: {
          id: true, title: true, slug: true, description: true, shortDesc: true,
          type: true, price: true, currency: true, discountPrice: true,
          city: true, country: true, countryCode: true,
          latitude: true, longitude: true,
          rating: true, reviewCount: true,
          images: true, languages: true, duration: true,
          isFeatured: true, isHot: true, hotDiscount: true, freeCancellation: true,
          amenities: { select: { id: true, name: true, icon: true } },
          provider: { select: { id: true, firstName: true, lastName: true, companyName: true } },
          tourCategory: true,
          isActive: true, createdAt: true,
        },
        orderBy,
        skip,
        take: fetchLimit,
      }),
      prisma.service.count({ where }),
    ]);

    // Convert comma-separated strings back to arrays for SQLite compatibility
    let mappedServices = services.map((s: Record<string, unknown>) => ({
      ...s,
      images: typeof s.images === "string" ? (s.images as string).split(",").filter(Boolean) : s.images,
      languages: typeof s.languages === "string" ? (s.languages as string).split(",").filter(Boolean) : s.languages,
    }));

    // ── Post-filtering for text-based filters ──
    // Note: nights filtering moved to Prisma level in applyTourFilters
    const durations = searchParams.getAll("duration");
    const distanceToSea = searchParams.getAll("distanceToSea");
    const hasPostFilters = durations.length > 0 || distanceToSea.length > 0;

    if (hasPostFilters) {
      mappedServices = applyPostFilters(mappedServices, { durations, distanceToSea, type });
    }

    // Slice to requested page size
    mappedServices = mappedServices.slice(0, limit);

    // ── Fix pagination total: use post-filtered count ──
    const filteredTotal = hasPostFilters
      ? Math.min(total, mappedServices.length + (page - 1) * limit)
      : total;

    // ── Filter facets for HOTEL type (distinct room attribute values) ──
    let facets: Record<string, string[]> | undefined;
    if (type === "HOTEL") {
      try {
        const serviceIds = services.map(s => s.id);
        if (serviceIds.length > 0) {
          const roomTypes = await prisma.roomType.findMany({
            where: { serviceId: { in: serviceIds }, isActive: true },
            select: { bedType: true, view: true, smoking: true, balcony: true, bathroom: true, area: true, occupancy: true },
          });
          facets = {
            bedType: [...new Set(roomTypes.map(r => r.bedType).filter(Boolean) as string[])],
            view: [...new Set(roomTypes.map(r => r.view).filter(Boolean) as string[])],
            smoking: [...new Set(roomTypes.map(r => r.smoking).filter(Boolean) as string[])],
            balcony: [...new Set(roomTypes.map(r => r.balcony).filter(Boolean) as string[])],
            bathroom: [...new Set(roomTypes.map(r => r.bathroom).filter(Boolean) as string[])],
            area: [...new Set(roomTypes.map(r => r.area).filter(Boolean) as string[])],
            occupancy: [...new Set(roomTypes.map(r => r.occupancy).filter(Boolean) as string[])],
          };
        }
      } catch {
        // Facets are optional — ignore errors
      }
    }

    // ── Tour category counts (when showing TOUR type) ──
    let tourCounts;
    if (type === "TOUR") {
      // Remove tourCategory from where to get "all" count, then add it back for each category.
      // as any: bypass stale Prisma client lacking TourCategory enum. Remove after: prisma generate
      const baseTourWhere: Record<string, unknown> = { ...where, tourCategory: undefined };
      delete baseTourWhere.tourCategory;
      const [allTours, oneDayTours, multiDayTours] = await Promise.all([
        prisma.service.count({ where: baseTourWhere }),
        prisma.service.count({ where: { ...baseTourWhere, tourCategory: "ONE_DAY" as any } }),
        prisma.service.count({ where: { ...baseTourWhere, tourCategory: "MULTI_DAY" as any } }),
      ]);
      tourCounts = { all: allTours, oneDay: oneDayTours, multiDay: multiDayTours };
    }

    const responseData = {
      services: mappedServices,
      pagination: { total: filteredTotal, page, limit, pages: Math.ceil(filteredTotal / limit) },
      tourCounts,
      facets,
    };

    // ── Cache response with stale-while-revalidate ──
    const cacheKey = ApiCache.keyFromUrl(request.url);
    const lookup = servicesCache.get<typeof responseData>(cacheKey);
    if (lookup.data) {
      if (lookup.isStale) {
        // Stale but within SWR window — serve stale data, refresh cache
        servicesCache.set(cacheKey, responseData);
        return NextResponse.json(lookup.data, { headers: { "X-Cache": "STALE" } });
      }
      // Fresh hit — serve from cache
      return NextResponse.json(lookup.data, { headers: { "X-Cache": "HIT" } });
    }
    // True miss or expired — store and serve fresh data
    servicesCache.set(cacheKey, responseData);
    return NextResponse.json(responseData, { headers: { "X-Cache": "MISS" } });
  } catch (error) {
    console.error("Services fetch error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export { createService as POST } from "./createService";
