import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { prisma } = await import("@/lib/prisma");

    // 1. Basic stats — with fallback on connection errors
    let totalUsers = 0, totalPartners = 0, totalServices = 0, activeServices = 0;
    try {
      const [tu, tp, ts, as_] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: "PARTNER" } }),
        prisma.service.count(),
        prisma.service.count({ where: { isActive: true } }),
      ]);
      totalUsers = tu; totalPartners = tp; totalServices = ts; activeServices = as_;
    } catch (e) {
      console.error("Basic stats error:", e);
    }

    // 2. Financial stats — with fallback on connection errors
    let totalRevenue = 0, totalServiceFees = 0, revenueBookingsCount = 0;
    let pendingBookings = 0, completedBookings = 0, totalBookings = 0;
    try {
      const [revenueResult, pb, cb, tb] = await Promise.all([
        prisma.booking.aggregate({
          where: { status: "COMPLETED" },
          _sum: { totalPrice: true, serviceFee: true },
          _count: true,
        }),
        prisma.booking.count({ where: { status: "PENDING" } }),
        prisma.booking.count({ where: { status: "COMPLETED" } }),
        prisma.booking.count(),
      ]);
      totalRevenue = Number(revenueResult._sum.totalPrice || 0);
      totalServiceFees = Number(revenueResult._sum.serviceFee || 0);
      revenueBookingsCount = revenueResult._count;
      pendingBookings = pb; completedBookings = cb; totalBookings = tb;
    } catch (e) {
      console.error("Financial stats error:", e);
    }

    // 3. Page views from page_views table (may not exist yet)
    let totalViews = 0;
    let todayViews = 0;
    let serviceViewStats: { service_id: string; service_type: string; views: number; title?: string }[] = [];
    let viewsByDay: { date: string; count: number }[] = [];
    let viewsByServiceType: { type: string; count: number }[] = [];
    let deviceBreakdown: { device: string; count: number }[] = [];
    let topPages: { path: string; count: number }[] = [];
    let uniqueVisitorsToday = 0;
    let uniqueVisitorsTotal = 0;

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Run all page_views queries in parallel, falling back gracefully if table doesn't exist
      const results = await Promise.allSettled([
        prisma.$queryRawUnsafe<[{ count: bigint }]>(`SELECT COUNT(*) as count FROM page_views`),
        prisma.$queryRawUnsafe<[{ count: bigint }]>(`SELECT COUNT(*) as count FROM page_views WHERE created_at >= $1`, today),
        prisma.$queryRawUnsafe<{ date: string; count: bigint }[]>(`SELECT DATE(created_at) as date, COUNT(*) as count FROM page_views WHERE created_at >= $1 GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30`, thirtyDaysAgo),
        prisma.$queryRawUnsafe<{ type: string; count: bigint }[]>(`SELECT COALESCE(service_type, 'OTHER') as type, COUNT(*) as count FROM page_views GROUP BY type ORDER BY count DESC`),
        prisma.$queryRawUnsafe<{ device: string; count: bigint }[]>(`SELECT device, COUNT(*) as count FROM page_views GROUP BY device ORDER BY count DESC`),
        prisma.$queryRawUnsafe<{ path: string; count: bigint }[]>(`SELECT path, COUNT(*) as count FROM page_views GROUP BY path ORDER BY count DESC LIMIT 10`),
        prisma.$queryRawUnsafe<[{ count: bigint }]>(`SELECT COUNT(DISTINCT session_id) as count FROM page_views WHERE created_at >= $1`, today),
        prisma.$queryRawUnsafe<[{ count: bigint }]>(`SELECT COUNT(DISTINCT COALESCE(user_id, session_id)) as count FROM page_views`),
        prisma.$queryRawUnsafe<{ service_id: string; service_type: string; views: bigint }[]>(`SELECT service_id, service_type, COUNT(*) as views FROM page_views WHERE service_id IS NOT NULL GROUP BY service_id, service_type ORDER BY views DESC LIMIT 20`),
      ]);

      const ok = <T>(r: PromiseSettledResult<T>, fb: T): T => r.status === "fulfilled" ? r.value : fb;

      totalViews = Number(ok(results[0], [{ count: BigInt(0) }])[0]?.count || 0);
      todayViews = Number(ok(results[1], [{ count: BigInt(0) }])[0]?.count || 0);
      viewsByDay = ok(results[2], []).map((r) => ({ date: String(r.date), count: Number(r.count) }));
      viewsByServiceType = ok(results[3], []).map((r) => ({ type: r.type, count: Number(r.count) }));
      deviceBreakdown = ok(results[4], []).map((r) => ({ device: r.device || "unknown", count: Number(r.count) }));
      topPages = ok(results[5], []).map((r) => ({ path: r.path, count: Number(r.count) }));
      uniqueVisitorsToday = Number(ok(results[6], [{ count: BigInt(0) }])[0]?.count || 0);
      uniqueVisitorsTotal = Number(ok(results[7], [{ count: BigInt(0) }])[0]?.count || 0);

      const topServiceViews = ok(results[8], []);

      const serviceIds = topServiceViews.map((s: any) => s.service_id);
      if (serviceIds.length > 0) {
        const services = await prisma.service.findMany({
          where: { id: { in: serviceIds } },
          select: { id: true, title: true, type: true, city: true, country: true },
        });
        const serviceMap = new Map(services.map((s) => [s.id, s]));
        serviceViewStats = topServiceViews.map((sv: any) => ({
          ...sv,
          views: Number(sv.views),
          title: serviceMap.get(sv.service_id)?.title || "Unknown",
          city: serviceMap.get(sv.service_id)?.city,
          country: serviceMap.get(sv.service_id)?.country,
        }));
      }
    } catch (e) {
      console.error("Page views query error:", e);
      // Table may not exist yet — that's OK
    }

    // 4. Services by type
    let servicesByType: { type: string; count: number }[] = [];
    try {
      const sbt = await prisma.service.groupBy({
        by: ["type"],
        _count: true,
        where: { isActive: true },
      });
      servicesByType = sbt.map((s) => ({ type: s.type, count: s._count }));
    } catch (e) {
      console.error("servicesByType error:", e);
    }

    // 5. Bookings by status
    let bookingsByStatus: { status: string; count: number }[] = [];
    try {
      const bbs = await prisma.booking.groupBy({
        by: ["status"],
        _count: true,
      });
      bookingsByStatus = bbs.map((b) => ({ status: b.status, count: b._count }));
    } catch (e) {
      console.error("bookingsByStatus error:", e);
    }

    // 6. Revenue by service type (completed bookings)
    let revenueByType: { type: string; revenue: number; count: number }[] = [];
    try {
      const rbt = await prisma.$queryRawUnsafe<
        { type: string; revenue: bigint; count: bigint }[]
      >(
        `SELECT s.type, SUM(b.total_price) as revenue, COUNT(*) as count
         FROM bookings b
         JOIN services s ON b.service_id = s.id
         WHERE b.status = 'COMPLETED'
         GROUP BY s.type
         ORDER BY revenue DESC`
      );
      revenueByType = rbt.map((r) => ({
        type: r.type,
        revenue: Number(r.revenue || 0),
        count: Number(r.count),
      }));
    } catch (e) {
      console.error("revenueByType error:", e);
    }

    // 7. New users per day (last 30 days)
    let newUsersByDay: { date: string; count: number }[] = [];
    try {
      const nud = await prisma.$queryRawUnsafe<
        { date: string; count: bigint }[]
      >(
        `SELECT DATE(created_at) as date, COUNT(*) as count
         FROM users
         WHERE created_at >= $1
         GROUP BY DATE(created_at)
         ORDER BY date DESC
         LIMIT 30`,
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      );
      newUsersByDay = nud.map((u) => ({
        date: String(u.date),
        count: Number(u.count),
      }));
    } catch (e) {
      console.error("newUsersByDay error:", e);
    }

    return NextResponse.json({
      stats: {
        totalUsers,
        totalPartners,
        totalServices,
        activeServices,
        totalBookings,
        pendingBookings,
        completedBookings,
        totalRevenue,
        totalServiceFees,
        revenueBookingsCount,
        totalViews,
        todayViews,
        uniqueVisitorsToday,
        uniqueVisitorsTotal,
      },
      serviceViewStats,
      viewsByDay: viewsByDay.reverse(),
      viewsByServiceType,
      deviceBreakdown,
      topPages,
      servicesByType,
      bookingsByStatus,
      revenueByType,
      newUsersByDay,
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
