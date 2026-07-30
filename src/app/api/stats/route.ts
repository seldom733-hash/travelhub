import { NextResponse } from "next/server";
import { ApiCache } from "@/lib/api-cache";

export const dynamic = "force-dynamic";

// Separate cache for stats — 60s fresh, 10 min stale
const statsCache = new ApiCache(60, 600);

export async function GET() {
  try {
    // Serve from cache if fresh
    const lookup = statsCache.get("/api/stats");
    if (lookup.data && !lookup.isStale) {
      return NextResponse.json(lookup.data, { headers: { "X-Cache": "HIT" } });
    }
    if (lookup.data && lookup.isStale) {
      // Serve stale immediately, but revalidate below
    }

    const { prisma } = await import("@/lib/prisma");

    // Single GROUP BY query instead of 11 separate COUNTs
    const typeCounts = await prisma.service.groupBy({
      by: ["type"],
      _count: { id: true },
      where: { isActive: true },
    });

    const counts: Record<string, number> = {};
    for (const row of typeCounts) {
      counts[row.type] = row._count.id;
    }

    const totalUsers = await prisma.user.count();
    const totalPartners = await prisma.user.count({ where: { role: "PARTNER" } });

    const responseData = {
      services: {
        tours: counts["TOUR"] ?? 0,
        hotels: counts["HOTEL"] ?? 0,
        sanatoriums: counts["SANATORIUM"] ?? 0,
        excursions: counts["EXCURSION"] ?? 0,
        flights: counts["FLIGHT"] ?? 0,
        trains: counts["TRAIN"] ?? 0,
        guides: counts["GUIDE"] ?? 0,
        photographers: counts["PHOTOGRAPHER"] ?? 0,
        transfers: counts["TRANSFER"] ?? 0,
      },
      users: totalUsers,
      partners: totalPartners,
    };

    statsCache.set("/api/stats", responseData);
    return NextResponse.json(responseData, {
      headers: lookup.data ? { "X-Cache": "STALE" } : { "X-Cache": "MISS" },
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
