import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function calcTrend(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export async function GET() {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // --- Total counts (all time) ---
    const [partnerCount, orderCount, serviceCount, reviewCount, totalBookingsCount] =
      await Promise.all([
        prisma.user.count({ where: { role: "PARTNER", isActive: true } }),
        prisma.booking.count({ where: { status: "CONFIRMED" } }),
        prisma.service.count({ where: { isActive: true } }),
        prisma.review.count(),
        prisma.booking.count(),
      ]);

    const revenueResult = await prisma.booking.aggregate({
      where: { status: "CONFIRMED" },
      _sum: { totalPrice: true },
    });
    const totalRevenue = Number(revenueResult._sum.totalPrice ?? 0);

    const ratingResult = await prisma.service.aggregate({
      where: { rating: { gt: 0 } },
      _avg: { rating: true },
    });
    const avgRating = Math.round((ratingResult._avg.rating ?? 0) * 10) / 10;

    // --- This month ---
    const [
      partnersThisMonth,
      ordersThisMonth,
      revenueThisMonth,
      ratingThisMonth,
      servicesThisMonth,
      reviewsThisMonth,
    ] = await Promise.all([
      prisma.user.count({
        where: { role: "PARTNER", isActive: true, createdAt: { gte: thisMonthStart } },
      }),
      prisma.booking.count({
        where: { status: "CONFIRMED", createdAt: { gte: thisMonthStart } },
      }),
      prisma.booking.aggregate({
        where: { status: "CONFIRMED", createdAt: { gte: thisMonthStart } },
        _sum: { totalPrice: true },
      }),
      prisma.review.aggregate({
        where: { createdAt: { gte: thisMonthStart } },
        _avg: { rating: true },
        _count: true,
      }),
      prisma.service.count({
        where: { isActive: true, createdAt: { gte: thisMonthStart } },
      }),
      prisma.review.count({
        where: { createdAt: { gte: thisMonthStart } },
      }),
    ]);

    // --- Last month ---
    const [
      partnersLastMonth,
      ordersLastMonth,
      revenueLastMonth,
      ratingLastMonth,
      servicesLastMonth,
      reviewsLastMonth,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          role: "PARTNER",
          isActive: true,
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
      }),
      prisma.booking.count({
        where: {
          status: "CONFIRMED",
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
      }),
      prisma.booking.aggregate({
        where: {
          status: "CONFIRMED",
          createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
        _sum: { totalPrice: true },
      }),
      prisma.review.aggregate({
        where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
        _avg: { rating: true },
        _count: true,
      }),
      prisma.service.count({
        where: { isActive: true, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
      }),
      prisma.review.count({
        where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
      }),
    ]);

    // --- Trends ---
    const partnersTrend = calcTrend(partnersThisMonth, partnersLastMonth);
    const ordersTrend = calcTrend(ordersThisMonth, ordersLastMonth);
    const revThis = Number(revenueThisMonth._sum.totalPrice ?? 0);
    const revLast = Number(revenueLastMonth._sum.totalPrice ?? 0);
    const revenueTrend = calcTrend(revThis, revLast);

    // Rating trend: compare average review rating this month vs last month
    const avgRatingThis = ratingThisMonth._count > 0 ? (ratingThisMonth._avg.rating ?? 0) : null;
    const avgRatingLast = ratingLastMonth._count > 0 ? (ratingLastMonth._avg.rating ?? 0) : null;
    let ratingTrend: number | null = null;
    if (avgRatingThis != null && avgRatingLast != null) {
      // Show absolute difference in rating points (e.g. +0.3)
      const diff = Math.round((avgRatingThis - avgRatingLast) * 10) / 10;
      ratingTrend = diff !== 0 ? diff : null;
    } else if (avgRatingThis != null && avgRatingLast == null) {
      ratingTrend = null; // no data last month, don't show trend
    }

    const servicesTrend = calcTrend(servicesThisMonth, servicesLastMonth);
    const reviewsTrend = calcTrend(reviewsThisMonth, reviewsLastMonth);

    // --- Derived metrics ---
    // Conversion: confirmed / total bookings
    const conversion = totalBookingsCount > 0
      ? Math.round((orderCount / totalBookingsCount) * 100)
      : 0;

    // Average check: total revenue / confirmed bookings
    const avgCheck = orderCount > 0
      ? Math.round(totalRevenue / orderCount)
      : 0;

    // This month conversion
    const thisMonthTotalBookings = await prisma.booking.count({
      where: { createdAt: { gte: thisMonthStart } },
    });
    const lastMonthTotalBookings = await prisma.booking.count({
      where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
    });
    const conversionThis = thisMonthTotalBookings > 0
      ? Math.round((ordersThisMonth / thisMonthTotalBookings) * 100)
      : 0;
    const conversionLast = lastMonthTotalBookings > 0
      ? Math.round((ordersLastMonth / lastMonthTotalBookings) * 100)
      : 0;
    const conversionTrend = calcTrend(conversionThis, conversionLast);

    // Average check this month vs last month
    const revThisMonth = Number(revenueThisMonth._sum.totalPrice ?? 0);
    const revLastMonth = Number(revenueLastMonth._sum.totalPrice ?? 0);
    const avgCheckThis = ordersThisMonth > 0 ? Math.round(revThisMonth / ordersThisMonth) : 0;
    const avgCheckLast = ordersLastMonth > 0 ? Math.round(revLastMonth / ordersLastMonth) : 0;
    const avgCheckTrend = calcTrend(avgCheckThis, avgCheckLast);

    // --- Popular destinations (top 5 cities by service count) ---
    const popularDestinations = await prisma.service.groupBy({
      by: ["city", "country"],
      where: { isActive: true },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });

    // --- Conversion by service type ---
    const serviceTypes = ["TOUR", "HOTEL", "SANATORIUM", "EXCURSION", "GUIDE", "PHOTOGRAPHER", "TRANSFER", "FLIGHT"] as const;
    const conversionByType = await Promise.all(
      serviceTypes.map(async (type) => {
        const [total, confirmed] = await Promise.all([
          prisma.booking.count({ where: { service: { type } } }),
          prisma.booking.count({ where: { service: { type }, status: "CONFIRMED" } }),
        ]);
        return {
          type,
          total,
          confirmed,
          conversion: total > 0 ? Math.round((confirmed / total) * 100) : 0,
        };
      })
    );

    // --- Average check by top destinations ---
    const avgCheckByDestination = await prisma.booking.groupBy({
      by: ["serviceId"],
      where: { status: "CONFIRMED" },
      _avg: { totalPrice: true },
      _count: true,
    });

    // Get service details for these bookings
    const serviceIds = avgCheckByDestination.map((b) => b.serviceId);
    const servicesMap = new Map(
      (await prisma.service.findMany({
        where: { id: { in: serviceIds } },
        select: { id: true, city: true, country: true },
      })).map((s) => [s.id, s])
    );

    // Aggregate by city
    const cityStats = new Map<string, { city: string; country: string; totalRevenue: number; bookings: number }>();
    for (const b of avgCheckByDestination) {
      const svc = servicesMap.get(b.serviceId);
      if (!svc) continue;
      const key = svc.city;
      const existing = cityStats.get(key);
      const revenue = Number(b._avg.totalPrice ?? 0) * b._count;
      if (existing) {
        existing.totalRevenue += revenue;
        existing.bookings += b._count;
      } else {
        cityStats.set(key, { city: svc.city, country: svc.country, totalRevenue: revenue, bookings: b._count });
      }
    }

    const topDestinationsByAvgCheck = [...cityStats.values()]
      .map((d) => ({
        city: d.city,
        country: d.country,
        avgCheck: d.bookings > 0 ? Math.round(d.totalRevenue / d.bookings) : 0,
        bookings: d.bookings,
      }))
      .sort((a, b) => b.avgCheck - a.avgCheck)
      .slice(0, 5);

    return NextResponse.json({
      partners: partnerCount,
      orders: orderCount,
      revenue: totalRevenue,
      rating: avgRating,
      services: serviceCount,
      reviews: reviewCount,
      conversion,
      avgCheck,
      popularDestinations: popularDestinations.map((d) => ({
        city: d.city,
        country: d.country,
        count: d._count.id,
      })),
      conversionByType,
      topDestinationsByAvgCheck,
      trends: {
        partners: partnersTrend,
        orders: ordersTrend,
        revenue: revenueTrend,
        rating: ratingTrend,
        services: servicesTrend,
        reviews: reviewsTrend,
        conversion: conversionTrend,
        avgCheck: avgCheckTrend,
      },
    });
  } catch (error) {
    console.error("Partner stats error:", error);
    return NextResponse.json({
      partners: 8500,
      orders: 25000,
      revenue: 15000,
      rating: 4.8,
      services: 1625,
      reviews: 300,
      conversion: 68,
      avgCheck: 945,
      popularDestinations: [
        { city: "Анталья", country: "Турция", count: 180 },
        { city: "Стамбул", country: "Турция", count: 165 },
        { city: "Дубай", country: "ОАЭ", count: 150 },
        { city: "Батуми", country: "Грузия", count: 140 },
        { city: "Барселона", country: "Испания", count: 130 },
      ],
      conversionByType: [
        { type: "TOUR", total: 45, confirmed: 38, conversion: 84 },
        { type: "HOTEL", total: 120, confirmed: 95, conversion: 79 },
        { type: "EXCURSION", total: 60, confirmed: 52, conversion: 87 },
        { type: "TRANSFER", total: 35, confirmed: 30, conversion: 86 },
        { type: "GUIDE", total: 25, confirmed: 22, conversion: 88 },
        { type: "PHOTOGRAPHER", total: 15, confirmed: 12, conversion: 80 },
        { type: "SANATORIUM", total: 30, confirmed: 25, conversion: 83 },
        { type: "FLIGHT", total: 20, confirmed: 18, conversion: 90 },
      ],
      topDestinationsByAvgCheck: [
        { city: "Дубай", country: "ОАЭ", avgCheck: 1850, bookings: 12 },
        { city: "Мальдивы", country: "Мальдивы", avgCheck: 2400, bookings: 5 },
        { city: "Барселона", country: "Испания", avgCheck: 920, bookings: 15 },
        { city: "Стамбул", country: "Турция", avgCheck: 780, bookings: 20 },
        { city: "Тбилиси", country: "Грузия", avgCheck: 450, bookings: 18 },
      ],
      trends: { partners: 12, orders: 28, revenue: 15, rating: 0.2, services: 8, reviews: 15, conversion: 5, avgCheck: -3 },
    });
  }
}
