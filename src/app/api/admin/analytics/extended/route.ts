import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request, ["ADMIN"]);
    if (auth.response) return auth.response;
    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section") || "all";

    const safeQuery = async <T>(fn: () => Promise<T>, fb: T): Promise<T> => {
      try { return await fn(); } catch (e) { console.error("[safeQuery]", e); return fb; }
    };

    const num = (val: unknown): number => {
      if (typeof val === "bigint") return Number(val);
      if (typeof val === "number") return val;
      return 0;
    };

    /** Recursively convert all BigInt values to Number in any object/array */
    const cleanBigInt = (obj: any): any => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === "bigint") return Number(obj);
      if (obj instanceof Date) return obj.toISOString();
      if (Array.isArray(obj)) return obj.map(cleanBigInt);
      if (typeof obj === "object") {
        const out: Record<string, any> = {};
        for (const [k, v] of Object.entries(obj)) out[k] = cleanBigInt(v);
        return out;
      }
      return obj;
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

      const bookingsByDay = await safeQuery(() => prisma.$queryRawUnsafe(
        `SELECT DATE(created_at) as "date", COUNT(*) as count, COALESCE(SUM(CASE WHEN status='COMPLETED' THEN total_price ELSE 0 END),0) as revenue
         FROM bookings WHERE created_at >= $1 GROUP BY DATE(created_at) ORDER BY "date" DESC LIMIT 30`, monthAgo
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
          gmv: totalRev, platformRevenue: totalFee, bookings: totalBookings,
          users: totalUsers, activeUsers: totalUsers, partners: totalPartners,
          avgCheck, avgCommission, cancellations: totalCancellations, services: totalServices,
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
        `SELECT DATE(created_at) as "date", COUNT(*) as count FROM users WHERE created_at >= $1 GROUP BY DATE(created_at) ORDER BY "date" DESC LIMIT 30`, monthAgo
      ), []);

      const totalBuyers = await safeQuery(() => prisma.user.count({ where: { bookings: { some: {} } } }), 0);
      const repeatBuyers = await safeQuery(() => prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM (SELECT user_id, COUNT(*) as cnt FROM bookings GROUP BY user_id HAVING COUNT(*) > 1) sub`
      ), []);
      const repeatCount = num((repeatBuyers as any[])[0]?.count || 0);
      const singleBuyers = Math.max(0, totalBuyers - repeatCount);

      result.users = {
        dau, wau, mau, total: totalBuyers,
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
    // 3. SALES FUNNEL — use Prisma ORM instead of raw SQL for tracking tables
    // ════════════════════════════════════════════════════════════════════
    if (section === "all" || section === "funnel") {
      // Use simple count() for each funnel event — works reliably with Prisma
      const [searchCount, viewCardCount, selectVariantCount, checkoutCount, paymentCount, bookingCount] = await Promise.all([
        safeQuery(() => prisma.funnelEvent.count({ where: { event: "search" } }), 0),
        safeQuery(() => prisma.funnelEvent.count({ where: { event: "view_card" } }), 0),
        safeQuery(() => prisma.funnelEvent.count({ where: { event: "select_variant" } }), 0),
        safeQuery(() => prisma.funnelEvent.count({ where: { event: "checkout" } }), 0),
        safeQuery(() => prisma.funnelEvent.count({ where: { event: "payment" } }), 0),
        safeQuery(() => prisma.funnelEvent.count({ where: { event: "booking" } }), 0),
      ]);

      // Also get page views and search queries for broader funnel
      const [pageViewCount, searchQueryCount, bookingsCount, completedCount] = await Promise.all([
        safeQuery(() => prisma.pageView.count(), 0),
        safeQuery(() => prisma.searchQuery.count(), 0),
        safeQuery(() => prisma.booking.count(), 0),
        safeQuery(() => prisma.booking.count({ where: { status: "COMPLETED" } }), 0),
      ]);

      // Use the larger of funnelEvent vs pageView/searchQuery counts
      const visitors = Math.max(pageViewCount, searchCount);
      const searches = Math.max(searchQueryCount, searchCount);
      const totalBookings = Math.max(bookingCount, bookingsCount);
      const paidCount = Math.max(paymentCount, completedCount);

      result.funnel = {
        steps: [
          { step: "Посетители", count: visitors, rate: 100 },
          { step: "Поиск", count: searches, rate: visitors > 0 ? Math.round((searches / visitors) * 100) : 0 },
          { step: "Карточка услуги", count: viewCardCount, rate: visitors > 0 ? Math.round((viewCardCount / visitors) * 100) : 0 },
          { step: "Выбор варианта", count: selectVariantCount, rate: visitors > 0 ? Math.round((selectVariantCount / visitors) * 100) : 0 },
          { step: "Оформление", count: checkoutCount, rate: visitors > 0 ? Math.round((checkoutCount / visitors) * 100) : 0 },
          { step: "Оплата", count: paymentCount, rate: visitors > 0 ? Math.round((paymentCount / visitors) * 100) : 0 },
          { step: "Бронирования", count: totalBookings, rate: visitors > 0 ? Math.round((totalBookings / visitors) * 100) : 0 },
          { step: "Оплачено", count: paidCount, rate: visitors > 0 ? Math.round((paidCount / visitors) * 100) : 0 },
        ],
      };
    }

    // ════════════════════════════════════════════════════════════════════
    // 4. SEARCH ANALYTICS — use Prisma ORM
    // ════════════════════════════════════════════════════════════════════
    if (section === "all" || section === "search") {
      // Top queries — use Prisma ORM to avoid BigInt serialization issues
      const allSearchQueries = await safeQuery(() => prisma.searchQuery.findMany({
        select: { query: true, resultCount: true, createdAt: true },
      }), []);

      // Aggregate in JS to avoid raw SQL BigInt issues
      const queryCounts = new Map<string, { count: number; totalResults: number }>();
      for (const sq of allSearchQueries) {
        const existing = queryCounts.get(sq.query) || { count: 0, totalResults: 0 };
        existing.count++;
        existing.totalResults += sq.resultCount || 0;
        queryCounts.set(sq.query, existing);
      }

      const sorted = [...queryCounts.entries()]
        .map(([query, data]) => ({ query, count: data.count, avgResults: Math.round(data.totalResults / data.count) }))
        .sort((a, b) => b.count - a.count);

      const emptySearches = allSearchQueries
        .filter(sq => (sq.resultCount || 0) === 0)
        .reduce((acc, sq) => {
          const existing = acc.find(a => a.query === sq.query);
          if (existing) existing.count++;
          else acc.push({ query: sq.query, count: 1 });
          return acc;
        }, [] as { query: string; count: number }[])
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Group by day in JS
      const dayCounts = new Map<string, number>();
      for (const sq of allSearchQueries) {
        const day = sq.createdAt.toISOString().slice(0, 10);
        dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
      }
      const byDay = [...dayCounts.entries()]
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 30);

      result.search = {
        topQueries: sorted.slice(0, 20),
        emptySearches,
        byDay,
      };
    }

    // ════════════════════════════════════════════════════════════════════
    // 5-11. SERVICE TYPE ANALYTICS — Prisma ORM + raw for top viewed
    // ════════════════════════════════════════════════════════════════════
    if (section === "all" || section === "services") {
      const serviceTypes = ["TOUR", "HOTEL", "SANATORIUM", "EXCURSION", "GUIDE", "PHOTOGRAPHER", "TRANSFER", "FLIGHT", "TRAIN"];

      const perType = await Promise.all(serviceTypes.map(async (type) => {
        const [stats, bookings] = await Promise.all([
          safeQuery(() => prisma.service.aggregate({ where: { type: type as any, isActive: true }, _count: true, _avg: { price: true, rating: true } }), { _count: 0, _avg: { price: null, rating: null } }),
          safeQuery(() => prisma.booking.count({ where: { service: { type: type as any } } }), 0),
        ]);

        const completedRevenue = await safeQuery(() => prisma.booking.aggregate({
          where: { status: "COMPLETED", service: { type: type as any } },
          _sum: { totalPrice: true, serviceFee: true }, _count: true,
        }), { _sum: { totalPrice: null, serviceFee: null }, _count: 0 });

        // Top viewed via ORM
        const topViewed = await safeQuery(() => prisma.pageView.groupBy({
          by: ["serviceId"],
          where: { serviceType: type },
          _count: true,
          orderBy: { _count: { serviceId: "desc" } },
          take: 5,
        }), []);

        // Resolve service titles
        const topViewedWithTitles = await Promise.all(
          topViewed.map(async (tv: any) => {
            const svc = await safeQuery(() => prisma.service.findUnique({
              where: { id: tv.serviceId }, select: { id: true, title: true },
            }), null);
            return { id: tv.serviceId, title: svc?.title || tv.serviceId, views: tv._count };
          })
        );

        return {
          type, count: stats._count,
          avgPrice: Math.round(Number(stats._avg.price || 0)),
          avgRating: Number(stats._avg.rating || 0).toFixed(1),
          totalBookings: bookings, completedBookings: completedRevenue._count,
          revenue: Number(completedRevenue._sum.totalPrice || 0),
          commission: Number(completedRevenue._sum.serviceFee || 0),
          topViewed: topViewedWithTitles,
          conversion: stats._count > 0 ? (completedRevenue._count / stats._count * 100).toFixed(1) : "0",
        };
      }));

      result.services = perType;
    }

    // ════════════════════════════════════════════════════════════════════
    // 12. PARTNER ANALYTICS — use Prisma ORM instead of ANY($1::text[])
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

      // Get revenue per partner using Prisma ORM (no raw SQL)
      const partnerIds = partners.map(p => p.id);
      const partnerRevenue = await Promise.all(
        partnerIds.map(async (id) => {
          const rev = await safeQuery(() => prisma.booking.aggregate({
            where: { status: "COMPLETED", service: { providerId: id } },
            _sum: { totalPrice: true, serviceFee: true },
            _count: true,
          }), { _sum: { totalPrice: null, serviceFee: null }, _count: 0 });
          return { id, revenue: Number(rev._sum.totalPrice || 0), completedBookings: rev._count };
        })
      );

      const revMap = new Map(partnerRevenue.map((r) => [r.id, r]));

      const enrichedPartners = partners.map(p => ({
        ...p,
        revenue: revMap.get(p.id)?.revenue || 0,
        completedBookings: revMap.get(p.id)?.completedBookings || 0,
        avgRating: "0",
        services: p._count.services,
        reviews: p._count.reviews,
      })).sort((a, b) => b.revenue - a.revenue);

      result.partners = {
        total: enrichedPartners.length,
        topByRevenue: enrichedPartners.slice(0, 10),
        topByBookings: [...enrichedPartners].sort((a, b) => b.completedBookings - a.completedBookings).slice(0, 10),
        topByRating: enrichedPartners.filter(p => p.reviews > 0).slice(0, 10),
      };
    }

    // ════════════════════════════════════════════════════════════════════
    // 13. FINANCIAL ANALYTICS — use Prisma ORM
    // ════════════════════════════════════════════════════════════════════
    if (section === "all" || section === "finance") {
      const [totalRevenue, totalFees, totalRefunds, pendingPayments] = await Promise.all([
        safeQuery(() => prisma.booking.aggregate({ where: { status: "COMPLETED" }, _sum: { totalPrice: true } }), { _sum: { totalPrice: null } }),
        safeQuery(() => prisma.booking.aggregate({ where: { status: "COMPLETED" }, _sum: { serviceFee: true } }), { _sum: { serviceFee: null } }),
        safeQuery(() => prisma.booking.aggregate({ where: { status: "REFUNDED" }, _sum: { totalPrice: true } }), { _sum: { totalPrice: null } }),
        safeQuery(() => prisma.payment.count({ where: { status: "PENDING" } }), 0),
      ]);

      // Revenue by type — use Prisma ORM to avoid BigInt issues
      const completedBookings = await safeQuery(() => prisma.booking.findMany({
        where: { status: "COMPLETED" },
        select: { totalPrice: true, serviceFee: true, createdAt: true, service: { select: { type: true } } },
      }), []);

      const revByTypeMap = new Map<string, { revenue: number; fees: number; count: number }>();
      for (const b of completedBookings) {
        const type = b.service?.type || "UNKNOWN";
        const existing = revByTypeMap.get(type) || { revenue: 0, fees: 0, count: 0 };
        existing.revenue += Number(b.totalPrice || 0);
        existing.fees += Number(b.serviceFee || 0);
        existing.count++;
        revByTypeMap.set(type, existing);
      }
      const revenueByType = [...revByTypeMap.entries()]
        .map(([type, d]) => ({ type, ...d }))
        .sort((a, b) => b.revenue - a.revenue);

      const revByDayMap = new Map<string, { revenue: number; fees: number }>();
      for (const b of completedBookings) {
        const day = b.createdAt.toISOString().slice(0, 10);
        const existing = revByDayMap.get(day) || { revenue: 0, fees: 0 };
        existing.revenue += Number(b.totalPrice || 0);
        existing.fees += Number(b.serviceFee || 0);
        revByDayMap.set(day, existing);
      }
      const revenueByDay = [...revByDayMap.entries()]
        .map(([date, d]) => ({ date, ...d }))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 30);

      result.finance = {
        gmv: Number(totalRevenue._sum.totalPrice || 0),
        platformRevenue: Number(totalFees._sum.serviceFee || 0),
        refunds: Number(totalRefunds._sum.totalPrice || 0),
        pendingPayments,
        revenueByType,
        revenueByDay,
      };
    }

    // ════════════════════════════════════════════════════════════════════
    // 15. TECHNICAL ANALYTICS — use Prisma ORM
    // ════════════════════════════════════════════════════════════════════
    if (section === "all" || section === "technical") {
      const totalViews = await safeQuery(() => prisma.pageView.count(), 0);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todayViews = await safeQuery(() => prisma.pageView.count({ where: { createdAt: { gte: today } } }), 0);

      const [avgDurRaw, deviceGroups] = await Promise.all([
        safeQuery(() => prisma.pageView.aggregate({ _avg: { duration: true }, where: { duration: { not: null } } }), { _avg: { duration: null } }),
        safeQuery(() => prisma.pageView.groupBy({ by: ["device"], _count: true, orderBy: { _count: { device: "desc" } } }), []),
      ]);

      // Top pages via ORM to avoid raw SQL BigInt issues
      const allPageViews = await safeQuery(() => prisma.pageView.findMany({
        select: { path: true, duration: true },
      }), []);

      const pageStats = new Map<string, { count: number; totalDuration: number; withDuration: number }>();
      for (const pv of allPageViews) {
        const existing = pageStats.get(pv.path) || { count: 0, totalDuration: 0, withDuration: 0 };
        existing.count++;
        if (pv.duration) { existing.totalDuration += pv.duration; existing.withDuration++; }
        pageStats.set(pv.path, existing);
      }
      const topPages = [...pageStats.entries()]
        .map(([path, s]) => ({ path, count: s.count, avgDuration: s.withDuration > 0 ? Math.round(s.totalDuration / s.withDuration) : 0 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);

      result.technical = {
        totalViews, todayViews,
        avgDuration: Math.round(Number(avgDurRaw._avg.duration || 0)),
        devices: (deviceGroups as any[]).map((r) => ({ device: r.device || "unknown", count: r._count })),
        topPages,
      };
    }

    // ════════════════════════════════════════════════════════════════════
    // MARKETING ANALYTICS
    // ════════════════════════════════════════════════════════════════════
    if (section === "all" || section === "marketing") {
      const allEvents = await safeQuery(() => prisma.marketingEvent.findMany({
        select: { channel: true, campaign: true, utmSource: true, utmMedium: true, utmCampaign: true, eventType: true, cost: true, revenue: true, createdAt: true },
      }), []);

      // Channels aggregation
      const channelStats = new Map<string, { visits: number; registrations: number; bookings: number; revenue: number; cost: number }>();
      for (const ev of allEvents) {
        const ch = ev.channel || "unknown";
        const existing = channelStats.get(ch) || { visits: 0, registrations: 0, bookings: 0, revenue: 0, cost: 0 };
        if (ev.eventType === "visit") existing.visits++;
        if (ev.eventType === "register") existing.registrations++;
        if (ev.eventType === "complete_booking") existing.bookings++;
        existing.cost += ev.cost || 0;
        existing.revenue += ev.revenue || 0;
        channelStats.set(ch, existing);
      }
      const channels = [...channelStats.entries()]
        .map(([channel, s]) => ({
          channel, ...s,
          cac: s.bookings > 0 ? Math.round(s.cost / s.bookings) : 0,
          roi: s.cost > 0 ? Math.round(((s.revenue - s.cost) / s.cost) * 100) : 0,
          convRate: s.visits > 0 ? Math.round((s.bookings / s.visits) * 100) : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue);

      // Campaigns aggregation
      const campaignStats = new Map<string, { channel: string; visits: number; bookings: number; revenue: number; cost: number }>();
      for (const ev of allEvents) {
        const cmp = ev.utmCampaign || ev.campaign || null;
        if (!cmp) continue;
        const existing = campaignStats.get(cmp) || { channel: ev.channel, visits: 0, bookings: 0, revenue: 0, cost: 0 };
        if (ev.eventType === "visit") existing.visits++;
        if (ev.eventType === "complete_booking") existing.bookings++;
        existing.cost += ev.cost || 0;
        existing.revenue += ev.revenue || 0;
        campaignStats.set(cmp, existing);
      }
      const campaigns = [...campaignStats.entries()]
        .map(([name, s]) => ({
          name, ...s,
          cac: s.bookings > 0 ? Math.round(s.cost / s.bookings) : 0,
          roi: s.cost > 0 ? Math.round(((s.revenue - s.cost) / s.cost) * 100) : 0,
        }))
        .sort((a, b) => b.revenue - a.revenue);

      // UTM Sources aggregation
      const utmStats = new Map<string, { visits: number; bookings: number; revenue: number }>();
      for (const ev of allEvents) {
        const src = ev.utmSource || "direct";
        const existing = utmStats.get(src) || { visits: 0, bookings: 0, revenue: 0 };
        if (ev.eventType === "visit") existing.visits++;
        if (ev.eventType === "complete_booking") existing.bookings++;
        existing.revenue += ev.revenue || 0;
        utmStats.set(src, existing);
      }
      const utmSources = [...utmStats.entries()]
        .map(([source, s]) => ({ source, ...s }))
        .sort((a, b) => b.revenue - a.revenue);

      // Totals
      const totalCost = channels.reduce((sum, c) => sum + c.cost, 0);
      const totalRevenue = channels.reduce((sum, c) => sum + c.revenue, 0);
      const totalBookings = channels.reduce((sum, c) => sum + c.bookings, 0);
      const totalVisits = channels.reduce((sum, c) => sum + c.visits, 0);

      // Events by day
      const dayCounts = new Map<string, { visits: number; bookings: number; revenue: number }>();
      for (const ev of allEvents) {
        const day = ev.createdAt.toISOString().slice(0, 10);
        const existing = dayCounts.get(day) || { visits: 0, bookings: 0, revenue: 0 };
        if (ev.eventType === "visit") existing.visits++;
        if (ev.eventType === "complete_booking") existing.bookings++;
        existing.revenue += ev.revenue || 0;
        dayCounts.set(day, existing);
      }
      const eventsByDay = [...dayCounts.entries()]
        .map(([date, d]) => ({ date, ...d }))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 30);

      result.marketing = {
        totals: {
          cost: totalCost,
          revenue: totalRevenue,
          profit: totalRevenue - totalCost,
          roi: totalCost > 0 ? Math.round(((totalRevenue - totalCost) / totalCost) * 100) : 0,
          cac: totalBookings > 0 ? Math.round(totalCost / totalBookings) : 0,
          totalVisits,
          totalBookings,
          convRate: totalVisits > 0 ? Math.round((totalBookings / totalVisits) * 100) : 0,
        },
        channels,
        campaigns: campaigns.slice(0, 20),
        utmSources,
        eventsByDay,
      };
    }

    return NextResponse.json(cleanBigInt(result));
  } catch (error) {
    console.error("Extended analytics error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
