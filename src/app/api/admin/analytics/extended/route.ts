import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload || payload.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { prisma } = await import("@/lib/prisma");
    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section") || "all";

    // Helper: safe raw query
    const safeQuery = async <T>(fn: () => Promise<T>, fb: T): Promise<T> => {
      try { return await fn(); } catch { return fb; }
    };

    // Helper: safely convert bigint to number from raw SQL
    const num = (val: unknown): number => {
      if (typeof val === "bigint") return Number(val);
      if (typeof val === "number") return val;
      return 0;
    };

    const result: Record<string, any> = {};

    // ════════════════════════════════════════════════════════════════════
    // 1. CEO DASHBOARD
    // ════════════════════════════════════════════════════════════════════
    if (section === "all" || section === "ceo") {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(Date.now() - 7 * 86400000);
      const monthAgo = new Date(Date.now() - 30 * 86400000);

      const [
        todayBookings, todayRevenue, todayUsers, todayPartners,
        totalBookings, totalRevenue, totalUsers, totalPartners, totalServices,
        weekBookings, weekRevenue, monthBookings, monthRevenue,
        todayCancellations, totalCancellations,
      ] = await Promise.all([
        safeQuery(() => prisma.booking.count({ where: { createdAt: { gte: today } } }), 0),
        safeQuery(() => prisma.booking.aggregate({ where: { status: "COMPLETED", createdAt: { gte: today } }, _sum: { totalPrice: true } }), { _sum: { totalPrice: null } }),
        safeQuery(() => prisma.user.count({ where: { createdAt: { gte: today } } }), 0),
        safeQuery(() => prisma.user.count({ where: { role: "PARTNER", createdAt: { gte: today } } }), 0),
        safeQuery(() => prisma.booking.count(), 0),
        safeQuery(() => prisma.booking.aggregate({ where: { status: "COMPLETED" }, _sum: { totalPrice: true, serviceFee: true } }), { _sum: { totalPrice: null, serviceFee: null } }),
        safeQuery(() => prisma.user.count(), 0),
        safeQuery(() => prisma.user.count({ where: { role: "PARTNER" } }), 0),
        safeQuery(() => prisma.service.count({ where: { isActive: true } }), 0),
        safeQuery(() => prisma.booking.count({ where: { createdAt: { gte: weekAgo } } }), 0),
        safeQuery(() => prisma.booking.aggregate({ where: { status: "COMPLETED", createdAt: { gte: weekAgo } }, _sum: { totalPrice: true } }), { _sum: { totalPrice: null } }),
        safeQuery(() => prisma.booking.count({ where: { createdAt: { gte: monthAgo } } }), 0),
        safeQuery(() => prisma.booking.aggregate({ where: { status: "COMPLETED", createdAt: { gte: monthAgo } }, _sum: { totalPrice: true } }), { _sum: { totalPrice: null } }),
        safeQuery(() => prisma.booking.count({ where: { status: "CANCELLED", createdAt: { gte: today } } }), 0),
        safeQuery(() => prisma.booking.count({ where: { status: "CANCELLED" } }), 0),
      ]);

      const totalRev = Number(totalRevenue._sum.totalPrice || 0);
      const totalFee = Number(totalRevenue._sum.serviceFee || 0);
      const avgCheck = totalBookings > 0 ? Math.round(totalRev / totalBookings) : 0;
      const avgCommission = totalRev > 0 ? Math.round((totalFee / totalRev) * 100) : 0;

      // Bookings by day (30 days)
      const bookingsByDay = await safeQuery(() => prisma.$queryRawUnsafe(
        `SELECT DATE(created_at) as date, COUNT(*) as count, COALESCE(SUM(CASE WHEN status='COMPLETED' THEN total_price ELSE 0 END),0) as revenue
         FROM bookings WHERE created_at >= $1 GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30`, monthAgo
      ), []);

      result.ceo = {
        today: {
          sales: Number(todayRevenue._sum.totalPrice || 0),
          bookings: todayBookings,
          commission: Math.round(Number(todayRevenue._sum.totalPrice || 0) * avgCommission / 100),
          newUsers: todayUsers,
          newPartners: todayPartners,
          cancellations: todayCancellations,
        },
        totals: {
          gmv: totalRev,
          platformRevenue: totalFee,
          bookings: totalBookings,
          users: totalUsers,
          activeUsers: totalUsers,
          partners: totalPartners,
          avgCheck,
          avgCommission,
          cancellations: totalCancellations,
          services: totalServices,
        },
        trends: {
          weekBookings, weekRevenue: Number(weekRevenue._sum.totalPrice || 0),
          monthBookings, monthRevenue: Number(monthRevenue._sum.totalPrice || 0),
        },
        bookingsByDay: (bookingsByDay as any[]).map((r) => ({ date: String(r.date), count: num(r.count), revenue: num(r.revenue) })),
      };
    }

    // ════════════════════════════════════════════════════════════════════
    // 2. USER ANALYTICS
    // ════════════════════════════════════════════════════════════════════
    if (section === "all" || section === "users") {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(Date.now() - 7 * 86400000);
      const monthAgo = new Date(Date.now() - 30 * 86400000);

      const [dau, wau, mau] = await Promise.all([
        safeQuery(() => prisma.user.count({ where: { lastLoginAt: { gte: today } } }), 0),
        safeQuery(() => prisma.user.count({ where: { lastLoginAt: { gte: weekAgo } } }), 0),
        safeQuery(() => prisma.user.count({ where: { lastLoginAt: { gte: monthAgo } } }), 0),
      ]);

      const usersByRole = await safeQuery(() => prisma.user.groupBy({ by: ["role"], _count: true }), []);

      const newUsersByDay = await safeQuery(() => prisma.$queryRawUnsafe(
        `SELECT DATE(created_at) as date, COUNT(*) as count FROM users WHERE created_at >= $1 GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30`, monthAgo
      ), []);

      const totalBuyers = await safeQuery(() => prisma.user.count({ where: { bookings: { some: {} } } }), 0);
      const repeatBuyers = await safeQuery(() => prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM (SELECT user_id, COUNT(*) as cnt FROM bookings GROUP BY user_id HAVING COUNT(*) > 1) sub`
      ), []);
      const repeatCount = num((repeatBuyers as any[])[0]?.count || 0);
      const singleBuyers = Math.max(0, totalBuyers - repeatCount);

      result.users = {
        dau, wau, mau,
        total: totalBuyers,
        byRole: (usersByRole as any[]).map((r) => ({ role: r.role, count: r._count })),
        newByDay: (newUsersByDay as any[]).map((r) => ({ date: String(r.date), count: num(r.count) })),
        repeatPurchases: {
          once: totalBuyers > 0 ? Math.round((singleBuyers / totalBuyers) * 100) : 0,
          twice: 0,
          threePlus: totalBuyers > 0 ? Math.round((repeatCount / totalBuyers) * 100) : 0,
        },
      };
    }

    // ════════════════════════════════════════════════════════════════════
    // 3. SALES FUNNEL
    // ════════════════════════════════════════════════════════════════════
    if (section === "all" || section === "funnel") {
      const funnelSteps = ["search", "view_card", "select_variant", "checkout", "payment", "booking"];
      const funnelCounts = await Promise.all(
        funnelSteps.map(async (step) => {
          const count = await safeQuery(() => prisma.$queryRawUnsafe(
            `SELECT COUNT(DISTINCT session_id) as count FROM funnel_events WHERE event = $1`, step
          ), []);
          return { step, count: num((count as any[])[0]?.count || 0) };
        })
      );

      const hasFunnelData = funnelCounts.some(f => f.count > 0);
      if (!hasFunnelData) {
        const [visits, searches, views, bookings, completed] = await Promise.all([
          safeQuery(() => prisma.$queryRawUnsafe(`SELECT COUNT(DISTINCT session_id) as count FROM page_views`), []),
          safeQuery(() => prisma.$queryRawUnsafe(`SELECT COUNT(DISTINCT session_id) as count FROM search_queries`), []),
          safeQuery(() => prisma.$queryRawUnsafe(`SELECT COUNT(DISTINCT session_id) as count FROM page_views WHERE path LIKE '/services/%'`), []),
          safeQuery(() => prisma.booking.count(), 0),
          safeQuery(() => prisma.booking.count({ where: { status: "COMPLETED" } }), 0),
        ]);

        const v = num((visits as any[])[0]?.count || 0);
        const s = num((searches as any[])[0]?.count || 0);
        const vw = num((views as any[])[0]?.count || 0);
        result.funnel = {
          steps: [
            { step: "Посетители", count: v, rate: 100 },
            { step: "Поиск", count: s, rate: v > 0 ? Math.round((s / v) * 100) : 0 },
            { step: "Карточка услуги", count: vw, rate: v > 0 ? Math.round((vw / v) * 100) : 0 },
            { step: "Бронирования", count: bookings, rate: v > 0 ? Math.round((bookings / v) * 100) : 0 },
            { step: "Оплачено", count: completed, rate: v > 0 ? Math.round((completed / v) * 100) : 0 },
          ],
        };
      } else {
        result.funnel = { steps: funnelCounts };
      }
    }

    // ════════════════════════════════════════════════════════════════════
    // 4. SEARCH ANALYTICS
    // ════════════════════════════════════════════════════════════════════
    if (section === "all" || section === "search") {
      const topQueries = await safeQuery(() => prisma.$queryRawUnsafe(
        `SELECT query, COUNT(*) as count, AVG(result_count) as avg_results FROM search_queries GROUP BY query ORDER BY count DESC LIMIT 20`
      ), []);

      const emptySearches = await safeQuery(() => prisma.$queryRawUnsafe(
        `SELECT query, COUNT(*) as count FROM search_queries WHERE result_count = 0 GROUP BY query ORDER BY count DESC LIMIT 10`
      ), []);

      const searchesByDay = await safeQuery(() => prisma.$queryRawUnsafe(
        `SELECT DATE(created_at) as date, COUNT(*) as count FROM search_queries WHERE created_at >= $1 GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30`,
        new Date(Date.now() - 30 * 86400000)
      ), []);

      result.search = {
        topQueries: (topQueries as any[]).map((r) => ({ query: r.query, count: num(r.count), avgResults: num(r.avg_results) })),
        emptySearches: (emptySearches as any[]).map((r) => ({ query: r.query, count: num(r.count) })),
        byDay: (searchesByDay as any[]).map((r) => ({ date: String(r.date), count: num(r.count) })),
      };
    }

    // ════════════════════════════════════════════════════════════════════
    // 5-11. SERVICE TYPE ANALYTICS
    // ════════════════════════════════════════════════════════════════════
    if (section === "all" || section === "services") {
      const serviceTypes = ["TOUR", "HOTEL", "SANATORIUM", "EXCURSION", "GUIDE", "PHOTOGRAPHER", "TRANSFER", "FLIGHT", "TRAIN"];

      const perType = await Promise.all(serviceTypes.map(async (type) => {
        const [stats, topViewed, bookings] = await Promise.all([
          safeQuery(() => prisma.service.aggregate({ where: { type: type as any, isActive: true }, _count: true, _avg: { price: true, rating: true } }), { _count: 0, _avg: { price: null, rating: null } }),
          safeQuery(() => prisma.$queryRawUnsafe(
            `SELECT pv.service_id, COUNT(*) as views, s.title FROM page_views pv JOIN services s ON pv.service_id = s.id WHERE pv.service_type = $1 GROUP BY pv.service_id, s.title ORDER BY views DESC LIMIT 5`, type
          ), []),
          safeQuery(() => prisma.booking.count({ where: { service: { type: type as any } } }), 0),
        ]);

        const completedRevenue = await safeQuery(() => prisma.booking.aggregate({
          where: { status: "COMPLETED", service: { type: type as any } },
          _sum: { totalPrice: true, serviceFee: true },
          _count: true,
        }), { _sum: { totalPrice: null, serviceFee: null }, _count: 0 });

        return {
          type,
          count: stats._count,
          avgPrice: Math.round(Number(stats._avg.price || 0)),
          avgRating: Number(stats._avg.rating || 0).toFixed(1),
          totalBookings: bookings,
          completedBookings: completedRevenue._count,
          revenue: Number(completedRevenue._sum.totalPrice || 0),
          commission: Number(completedRevenue._sum.serviceFee || 0),
          topViewed: (topViewed as any[]).map((r) => ({ id: r.service_id, title: r.title, views: num(r.views) })),
          conversion: stats._count > 0 ? (completedRevenue._count / stats._count * 100).toFixed(1) : "0",
        };
      }));

      result.services = perType;
    }

    // ════════════════════════════════════════════════════════════════════
    // 12. PARTNER ANALYTICS
    // ════════════════════════════════════════════════════════════════════
    if (section === "all" || section === "partners") {
      const partners = await safeQuery(() => prisma.user.findMany({
        where: { role: "PARTNER" },
        select: {
          id: true, firstName: true, lastName: true, companyName: true, partnerType: true,
          _count: { select: { services: true, reviews: true, bookings: true } },
        },
        orderBy: { createdAt: "desc" },
      }), []);

      const partnerIds = partners.map(p => p.id);
      const partnerRevenue = partnerIds.length > 0 ? await safeQuery(() => prisma.$queryRawUnsafe(
        `SELECT s.provider_id, SUM(b.total_price) as revenue, COUNT(*) as bookings, AVG(s.rating) as avg_rating
         FROM bookings b JOIN services s ON b.service_id = s.id
         WHERE s.provider_id = ANY($1::text[]) AND b.status = 'COMPLETED'
         GROUP BY s.provider_id`, partnerIds
      ), []) : [];

      const revMap = new Map((partnerRevenue as any[]).map((r) => [r.provider_id, r]));

      const enrichedPartners = partners.map(p => ({
        ...p,
        revenue: num(revMap.get(p.id)?.revenue || 0),
        completedBookings: num(revMap.get(p.id)?.bookings || 0),
        avgRating: Number(revMap.get(p.id)?.avg_rating || 0).toFixed(1),
        services: p._count.services,
        reviews: p._count.reviews,
      })).sort((a, b) => b.revenue - a.revenue);

      result.partners = {
        total: enrichedPartners.length,
        topByRevenue: enrichedPartners.slice(0, 10),
        topByBookings: [...enrichedPartners].sort((a, b) => b.completedBookings - a.completedBookings).slice(0, 10),
        topByRating: [...enrichedPartners].filter(p => p.reviews > 0).sort((a, b) => Number(b.avgRating) - Number(a.avgRating)).slice(0, 10),
      };
    }

    // ════════════════════════════════════════════════════════════════════
    // 13. FINANCIAL ANALYTICS
    // ════════════════════════════════════════════════════════════════════
    if (section === "all" || section === "finance") {
      const [totalRevenue, totalFees, totalRefunds, pendingPayments] = await Promise.all([
        safeQuery(() => prisma.booking.aggregate({ where: { status: "COMPLETED" }, _sum: { totalPrice: true } }), { _sum: { totalPrice: null } }),
        safeQuery(() => prisma.booking.aggregate({ where: { status: "COMPLETED" }, _sum: { serviceFee: true } }), { _sum: { serviceFee: null } }),
        safeQuery(() => prisma.booking.aggregate({ where: { status: "REFUNDED" }, _sum: { totalPrice: true } }), { _sum: { totalPrice: null } }),
        safeQuery(() => prisma.payment.count({ where: { status: "PENDING" } }), 0),
      ]);

      const revenueByType = await safeQuery(() => prisma.$queryRawUnsafe(
        `SELECT s.type, SUM(b.total_price) as revenue, SUM(b.service_fee) as fees, COUNT(*) as count
         FROM bookings b JOIN services s ON b.service_id = s.id WHERE b.status = 'COMPLETED'
         GROUP BY s.type ORDER BY revenue DESC`
      ), []);

      const revenueByDay = await safeQuery(() => prisma.$queryRawUnsafe(
        `SELECT DATE(b.created_at) as date, SUM(b.total_price) as revenue, SUM(b.service_fee) as fees
         FROM bookings b WHERE b.status = 'COMPLETED' AND b.created_at >= $1
         GROUP BY DATE(b.created_at) ORDER BY date DESC LIMIT 30`,
        new Date(Date.now() - 30 * 86400000)
      ), []);

      result.finance = {
        gmv: Number(totalRevenue._sum.totalPrice || 0),
        platformRevenue: Number(totalFees._sum.serviceFee || 0),
        refunds: Number(totalRefunds._sum.totalPrice || 0),
        pendingPayments,
        revenueByType: (revenueByType as any[]).map((r) => ({ type: r.type, revenue: num(r.revenue), fees: num(r.fees), count: num(r.count) })),
        revenueByDay: (revenueByDay as any[]).map((r) => ({ date: String(r.date), revenue: num(r.revenue), fees: num(r.fees) })),
      };
    }

    // ════════════════════════════════════════════════════════════════════
    // 15. TECHNICAL ANALYTICS
    // ════════════════════════════════════════════════════════════════════
    if (section === "all" || section === "technical") {
      const [totalPageViews, todayPageViews, avgDuration] = await Promise.all([
        safeQuery(() => prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM page_views`), []),
        safeQuery(() => prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM page_views WHERE created_at >= $1`, new Date()), []),
        safeQuery(() => prisma.$queryRawUnsafe(`SELECT AVG(duration) as avg FROM page_views WHERE duration IS NOT NULL`), []),
      ]);

      const deviceBreakdown = await safeQuery(() => prisma.$queryRawUnsafe(
        `SELECT device, COUNT(*) as count FROM page_views GROUP BY device ORDER BY count DESC`
      ), []);

      const topPages = await safeQuery(() => prisma.$queryRawUnsafe(
        `SELECT path, COUNT(*) as count, AVG(duration) as avg_duration FROM page_views GROUP BY path ORDER BY count DESC LIMIT 15`
      ), []);

      result.technical = {
        totalViews: num((totalPageViews as any[])[0]?.count || 0),
        todayViews: num((todayPageViews as any[])[0]?.count || 0),
        avgDuration: Math.round(num((avgDuration as any[])[0]?.avg || 0)),
        devices: (deviceBreakdown as any[]).map((r) => ({ device: r.device || "unknown", count: num(r.count) })),
        topPages: (topPages as any[]).map((r) => ({ path: r.path, count: num(r.count), avgDuration: Math.round(num(r.avg_duration || 0)) })),
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Extended analytics error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
