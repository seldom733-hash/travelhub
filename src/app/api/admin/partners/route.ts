import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, parsePaginationParams } from "@/lib/admin-helpers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request, ["ADMIN"]);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = parsePaginationParams(searchParams, { limit: 20 });
    const search = searchParams.get("search") || "";

    const where: any = { role: "PARTNER" };
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { companyName: { contains: search, mode: "insensitive" } },
      ];
    }

    let partners: any[] = [];
    let total = 0;
    try {
      const [p, t] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            companyName: true,
            partnerType: true,
            isActive: true,
            isVerified: true,
            createdAt: true,
            lastLoginAt: true,
            services: {
              select: { country: true, countryCode: true, rating: true, reviewCount: true },
              take: 50,
            },
            _count: {
              select: { services: true, bookings: true, reviews: true },
            },
          },
        }),
        prisma.user.count({ where }),
      ]);
      partners = p;
      total = t;
    } catch (e) {
      console.error("Partners query error:", e);
    }

    // Get revenue per partner — wrapped in try/catch
    const partnerIds = partners.map((p) => p.id);
    let revenuePerPartner: { provider_id: string; revenue: bigint; booking_count: bigint }[] = [];
    try {
      if (partnerIds.length > 0) {
        revenuePerPartner = await prisma.$queryRawUnsafe<
          { provider_id: string; revenue: bigint; booking_count: bigint }[]
        >(
          `SELECT s.provider_id, SUM(b.total_price) as revenue, COUNT(*) as booking_count
           FROM bookings b
           JOIN services s ON b.service_id = s.id
           WHERE s.provider_id = ANY($1) AND b.status = 'COMPLETED'
           GROUP BY s.provider_id`,
          partnerIds
        );
      }
    } catch (e) {
      console.error("Revenue per partner error:", e);
    }

    const revenueMap = new Map(
      revenuePerPartner.map((r) => [
        r.provider_id,
        { revenue: Number(r.revenue || 0), bookingCount: Number(r.booking_count) },
      ])
    );

    const enrichedPartners = partners.map((p) => {
      const ratingSum = p.services?.reduce((s: number, sv: any) => s + (sv.rating || 0), 0) || 0;
      const serviceRatings = p.services?.filter((sv: any) => sv.rating > 0).length || 0;
      const country = p.services?.find((sv: any) => sv.country)?.country || null;
      const countryCode = p.services?.find((sv: any) => sv.countryCode)?.countryCode || null;
      return {
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        phone: p.phone,
        companyName: p.companyName,
        partnerType: p.partnerType,
        country,
        countryCode,
        isActive: p.isActive,
        isVerified: p.isVerified,
        createdAt: p.createdAt,
        lastLoginAt: p.lastLoginAt,
        serviceCount: p._count.services,
        bookingCount: revenueMap.get(p.id)?.bookingCount || 0,
        reviewCount: p._count.reviews,
        totalRevenue: revenueMap.get(p.id)?.revenue || 0,
        avgRating: serviceRatings ? Math.round((ratingSum / serviceRatings) * 10) / 10 : 0,
      };
    });

    return NextResponse.json({
      partners: enrichedPartners,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin partners error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
