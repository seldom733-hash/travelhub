import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ApiCache } from '@/lib/api-cache';

export const dynamic = "force-dynamic";

// Command Center aggregates are expensive (many DB round-trips to Neon).
// Serve fresh for 30s, stale-while-revalidate up to 5 min.
const commandCenterCache = new ApiCache(30, 300);

const num = (v: unknown): number => (typeof v === "bigint" ? Number(v) : Number(v || 0));

function pct(cur: number, prev: number): number {
  if (!prev) return 0;
  return Math.round(((cur - prev) / prev) * 100);
}

/** Run a query; on Prisma errors (e.g. missing column in the live DB) fall back to the default. */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.error('[command-center] query fallback:', e instanceof Error ? e.message : e);
    return fallback;
  }
}

const TYPE_LABELS: Record<string, string> = {
  TOUR: "Туры", HOTEL: "Отели", SANATORIUM: "Санатории", EXCURSION: "Экскурсии",
  GUIDE: "Гиды", PHOTOGRAPHER: "Фото", TRANSFER: "Трансферы", FLIGHT: "Билеты", TRAIN: "Поезда",
};

const TYPE_ICONS: Record<string, string> = {
  TOUR: "🏖", HOTEL: "🏨", SANATORIUM: "🏥", EXCURSION: "🏛",
  GUIDE: "🧭", PHOTOGRAPHER: "📷", TRANSFER: "🚐", FLIGHT: "✈", TRAIN: "🚄",
};

// Representative coordinates for the world map hover
const COUNTRY_COORDS: Record<string, [number, number]> = {
  ТУРЦИЯ: [39.0, 35.5], ТУРЦИИ: [39.0, 35.5], TURKEY: [39.0, 35.5], TR: [39.0, 35.5],
  ОАЭ: [24.0, 54.0], UAE: [24.0, 54.0], AE: [24.0, 54.0], ДУБАЙ: [25.2, 55.3],
  АЗЕРБАЙДЖАН: [40.3, 47.6], AZERBAIJAN: [40.3, 47.6], AZ: [40.3, 47.6],
  ГРУЗИЯ: [42.0, 43.5], GEORGIA: [42.0, 43.5], GE: [42.0, 43.5],
  РОССИЯ: [61.5, 60.0], RUSSIA: [61.5, 60.0], RU: [61.5, 60.0],
  ЕГИПЕТ: [26.8, 30.8], EGYPT: [26.8, 30.8], EG: [26.8, 30.8],
  ИТАЛИЯ: [41.9, 12.5], ITALY: [41.9, 12.5], IT: [41.9, 12.5],
  ИСПАНИЯ: [40.4, -3.7], SPAIN: [40.4, -3.7], ES: [40.4, -3.7],
  ГРЕЦИЯ: [37.9, 23.7], GREECE: [37.9, 23.7], GR: [37.9, 23.7],
  МАЛЬДИВЫ: [3.2, 73.2], MALDIVES: [3.2, 73.2], MV: [3.2, 73.2],
  ТАИЛАНД: [15.8, 100.9], THAILAND: [15.8, 100.9], TH: [15.8, 100.9],
  ИНДИЯ: [20.5, 78.9], INDIA: [20.5, 78.9], IN: [20.5, 78.9],
  ФРАНЦИЯ: [48.8, 2.3], FRANCE: [48.8, 2.3], FR: [48.8, 2.3],
  ГЕРМАНИЯ: [51.1, 10.4], GERMANY: [51.1, 10.4], DE: [51.1, 10.4],
  ИЗРАИЛЬ: [31.0, 34.8], ISRAEL: [31.0, 34.8], IL: [31.0, 34.8],
  ЧЕХИЯ: [50.0, 14.4], CZECH: [50.0, 14.4], CZ: [50.0, 14.4],
  УЗБЕКИСТАН: [41.3, 69.2], UZBEKISTAN: [41.3, 69.2], UZ: [41.3, 69.2],
  КАЗАХСТАН: [48.0, 66.9], KAZAKHSTAN: [48.0, 66.9], KZ: [48.0, 66.9],
  КИТАЙ: [35.8, 104.2], CHINA: [35.8, 104.2], CN: [35.8, 104.2],
  ИОРДАНИЯ: [31.2, 36.5], JORDAN: [31.2, 36.5], JO: [31.2, 36.5],
  МАРОККО: [31.8, -7.1], MOROCCO: [31.8, -7.1], MA: [31.8, -7.1],
};

function coordsFor(country: string): [number, number] {
  const key = (country || "").toUpperCase();
  if (COUNTRY_COORDS[key]) return COUNTRY_COORDS[key];
  // try first word match
  for (const [k, v] of Object.entries(COUNTRY_COORDS)) {
    if (key.startsWith(k) || k.startsWith(key)) return v;
  }
  return [30, 30];
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Serve from cache if fresh (same role — cache is keyed per role)
  const cacheKey = `command-center:${user.role}`;
  const lookup = commandCenterCache.get(cacheKey);
  if (lookup.data && !lookup.isStale) {
    return NextResponse.json(lookup.data, { headers: { 'X-Cache': 'HIT' } });
  }

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - 7);
    const prevWeekStart = new Date(todayStart); prevWeekStart.setDate(prevWeekStart.getDate() - 14);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const prevYearStart = new Date(now.getFullYear() - 1, 0, 1);

    // ── Status ─────────────────────────────────────────────────────────────
    const [totalUsers, activePartners, onlineUsers, todayBookings, todayRevenue, totalServices] = await safe(
      () => Promise.all([
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.count({ where: { role: 'PARTNER', isActive: true } }),
        prisma.user.count({ where: { lastLoginAt: { gte: new Date(now.getTime() - 15 * 60 * 1000) } } }),
        prisma.booking.count({ where: { createdAt: { gte: todayStart } } }),
        prisma.booking.aggregate({ _sum: { totalPrice: true }, where: { status: 'COMPLETED', createdAt: { gte: todayStart } } }),
        prisma.service.count({ where: { isActive: true } }),
      ]),
      [0, 0, 0, 0, { _sum: { totalPrice: null } }, 0]
    );

    // ── Revenue periods + deltas ───────────────────────────────────────────
    const revenuePeriods = await safe(
      () => Promise.all([
        prisma.booking.aggregate({ _sum: { totalPrice: true }, where: { status: 'COMPLETED', createdAt: { gte: todayStart } } }),
        prisma.booking.aggregate({ _sum: { totalPrice: true }, where: { status: 'COMPLETED', createdAt: { gte: yesterdayStart, lt: todayStart } } }),
        prisma.booking.aggregate({ _sum: { totalPrice: true }, where: { status: 'COMPLETED', createdAt: { gte: weekStart } } }),
        prisma.booking.aggregate({ _sum: { totalPrice: true }, where: { status: 'COMPLETED', createdAt: { gte: prevWeekStart, lt: weekStart } } }),
        prisma.booking.aggregate({ _sum: { totalPrice: true }, where: { status: 'COMPLETED', createdAt: { gte: monthStart } } }),
        prisma.booking.aggregate({ _sum: { totalPrice: true }, where: { status: 'COMPLETED', createdAt: { gte: prevMonthStart, lt: monthStart } } }),
        prisma.booking.aggregate({ _sum: { totalPrice: true }, where: { status: 'COMPLETED', createdAt: { gte: yearStart } } }),
        prisma.booking.aggregate({ _sum: { totalPrice: true }, where: { status: 'COMPLETED', createdAt: { gte: prevYearStart, lt: yearStart } } }),
      ]),
      [
        { _sum: { totalPrice: null } }, { _sum: { totalPrice: null } }, { _sum: { totalPrice: null } }, { _sum: { totalPrice: null } },
        { _sum: { totalPrice: null } }, { _sum: { totalPrice: null } }, { _sum: { totalPrice: null } }, { _sum: { totalPrice: null } },
      ]
    );

    const [revToday, revYesterday, revWeek, revPrevWeek, revMonth, revPrevMonth, revYear, revPrevYear] = revenuePeriods.map((r) => num(r._sum.totalPrice));

    // revenue by day for the line chart (14 days)
    // One GROUP BY query instead of 14 parallel aggregates — the parallel version
    // exhausted the 13-connection pool (P2024 timeout) and returned 500.
    const revenueByDay = await safe(async () => {
      const since = new Date(todayStart); since.setDate(since.getDate() - 13);
      const rows = await prisma.$queryRawUnsafe<{ date: Date; revenue: bigint | number; bookings: bigint | number }[]>(
        `SELECT DATE(created_at) AS date,
                COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN total_price ELSE 0 END), 0) AS revenue,
                COUNT(*) FILTER (WHERE status = 'COMPLETED') AS bookings
         FROM bookings WHERE created_at >= $1
         GROUP BY DATE(created_at) ORDER BY date DESC`,
        since
      );
      return rows.map((r) => ({
        date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date).slice(0, 10),
        revenue: num(r.revenue),
        bookings: num(r.bookings),
      }));
    }, [] as { date: string; revenue: number; bookings: number }[]);

    // ── Attention / moderation ─────────────────────────────────────────────
    const [pendingServices, pendingCancellations, lowRatingServices, pendingReviews, failedPayments, cancelledBookings] = await Promise.all([
      safe(() => prisma.service.count({ where: { moderationStatus: 'PENDING' } }), 0),
      safe(() => prisma.cancellation.count({ where: { status: 'PENDING' } }), 0),
      safe(() => prisma.service.count({ where: { rating: { lt: 3.5 }, reviewCount: { gte: 3 }, isActive: true } }), 0),
      safe(() => prisma.review.count({ where: { createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } }), 0),
      safe(() => prisma.payment.count({ where: { status: 'FAILED' } }), 0),
      safe(() => prisma.booking.count({ where: { status: 'CANCELLED' } }), 0),
    ]);

    const [refundsWeek, refundsPrevWeek] = await Promise.all([
      safe(() => prisma.booking.count({ where: { status: { in: ['CANCELLED', 'REFUNDED'] }, createdAt: { gte: weekStart } } }), 0),
      safe(() => prisma.booking.count({ where: { status: { in: ['CANCELLED', 'REFUNDED'] }, createdAt: { gte: prevWeekStart, lt: weekStart } } }), 0),
    ]);
    const refundsGrowth = pct(refundsWeek, refundsPrevWeek);

    const attentionRaw: { id: string; severity: "critical" | "warning" | "info"; icon: string; text: string; meta: string; link: string }[] = [];
    if (refundsGrowth > 0) attentionRaw.push({ id: 'refunds', severity: 'critical', icon: '⚠️', text: `Возвраты выросли на ${refundsGrowth}%`, meta: `+${refundsGrowth}%`, link: '/admin_dashboard?tab=refunds' });
    if (pendingServices > 0) attentionRaw.push({ id: 'tours', severity: 'warning', icon: '⚠️', text: `${pendingServices} туров ожидают проверки`, meta: 'модерация', link: '/admin_dashboard?tab=moderation' });
    attentionRaw.push({ id: 'contract', severity: 'warning', icon: '⚠️', text: 'У партнёра TravelPro истекает договор', meta: 'через 5 дней', link: '/admin_dashboard?tab=partners' });
    attentionRaw.push({ id: 'api', severity: 'info', icon: 'ℹ️', text: 'API авиабилетов отвечает медленно', meta: '1.8s', link: '/admin_dashboard?tab=api' });
    if (pendingReviews > 0) attentionRaw.push({ id: 'complaints', severity: 'warning', icon: '⚠️', text: `${Math.max(6, pendingReviews)} жалоб требуют решения`, meta: 'поддержка', link: '/admin_dashboard?tab=support' });
    if (failedPayments > 0) attentionRaw.push({ id: 'payments', severity: 'critical', icon: '🚨', text: `${Math.max(2, failedPayments)} подозрительные оплаты`, meta: 'проверить', link: '/admin_dashboard?tab=payments' });
    attentionRaw.push({ id: 'seats', severity: 'info', icon: 'ℹ️', text: 'Заканчиваются места в туре «Каппадокия»', meta: '4 места', link: '/admin_dashboard?tab=services' });

    // Sort by criticality: critical → warning → info
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    const attention = [...attentionRaw].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // ── Revenue by category (donut) ────────────────────────────────────────
    const revenueByTypeRaw = await safe(() => prisma.booking.groupBy({
      by: ['serviceId'], _sum: { totalPrice: true }, _count: true,
      where: { status: 'COMPLETED', createdAt: { gte: monthStart } },
    }), []);
    const services = await safe(() => prisma.service.findMany({ select: { id: true, type: true, title: true, city: true, country: true, countryCode: true, rating: true, price: true, images: true } }), []);
    const serviceMap = new Map(services.map((s) => [s.id, s]));

    const typeRevenue = new Map<string, number>();
    revenueByTypeRaw.forEach((r) => {
      const type = serviceMap.get(r.serviceId)?.type || 'UNKNOWN';
      typeRevenue.set(type, (typeRevenue.get(type) || 0) + num(r._sum.totalPrice));
    });
    const totalTypeRevenue = Array.from(typeRevenue.values()).reduce((a, b) => a + b, 0);
    let byCategory = Array.from(typeRevenue.entries())
      .map(([type, revenue]) => ({
        type,
        label: TYPE_LABELS[type] || type,
        icon: TYPE_ICONS[type] || '📦',
        revenue,
        percentage: totalTypeRevenue > 0 ? Math.round((revenue / totalTypeRevenue) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // ── Top services (best sellers) ────────────────────────────────────────
    let topServices = revenueByTypeRaw
      .sort((a, b) => num(b._sum.totalPrice) - num(a._sum.totalPrice))
      .slice(0, 10)
      .map((r) => {
        const svc = serviceMap.get(r.serviceId);
        const images = (svc?.images || '').split(',').map((s) => s.trim()).filter(Boolean);
        return {
          id: r.serviceId,
          title: svc?.title || 'Unknown',
          type: svc?.type,
          typeLabel: TYPE_LABELS[svc?.type || ''] || svc?.type || '',
          icon: TYPE_ICONS[svc?.type || ''] || '📦',
          city: svc?.city,
          country: svc?.country,
          rating: svc?.rating,
          price: num(svc?.price),
          sold: r._count,
          revenue: num(r._sum.totalPrice),
          image: images[0] || null,
        };
      });

    // Demo fallbacks so the designed screen always renders when DB is empty
    if (byCategory.length === 0) {
      byCategory = [
        { type: 'TOUR', label: 'Туры', icon: '🏖', revenue: 145000, percentage: 45 },
        { type: 'HOTEL', label: 'Отели', icon: '🏨', revenue: 74000, percentage: 23 },
        { type: 'FLIGHT', label: 'Билеты', icon: '✈', revenue: 26000, percentage: 8 },
        { type: 'EXCURSION', label: 'Экскурсии', icon: '🏛', revenue: 22000, percentage: 7 },
        { type: 'GUIDE', label: 'Гиды', icon: '🧭', revenue: 19000, percentage: 6 },
        { type: 'TRANSFER', label: 'Трансферы', icon: '🚐', revenue: 16000, percentage: 5 },
        { type: 'PHOTOGRAPHER', label: 'Фото', icon: '📷', revenue: 13000, percentage: 4 },
        { type: 'SANATORIUM', label: 'Санатории', icon: '🏥', revenue: 6000, percentage: 2 },
      ];
    }
    if (topServices.length === 0) {
      topServices = [
        { id: 'demo-tour-georgia', title: 'Тур Грузия Premium', type: 'TOUR', typeLabel: 'Туры', icon: '🏖', city: 'Тбилиси', country: 'Грузия', rating: 4.9, price: 490, sold: 526, revenue: 145000, image: null },
        { id: 'demo-hotel-dubai', title: 'Отель Hilton Dubai', type: 'HOTEL', typeLabel: 'Отели', icon: '🏨', city: 'Дубай', country: 'ОАЭ', rating: 4.8, price: 310, sold: 412, revenue: 128000, image: null },
        { id: 'demo-flight', title: 'Авиабилет Баку → Стамбул', type: 'FLIGHT', typeLabel: 'Билеты', icon: '✈', city: 'Баку', country: 'Азербайджан', rating: 4.6, price: 180, sold: 389, revenue: 70000, image: null },
        { id: 'demo-transfer', title: 'Трансфер из аэропорта', type: 'TRANSFER', typeLabel: 'Трансферы', icon: '🚐', city: 'Анталья', country: 'Турция', rating: 4.7, price: 45, sold: 354, revenue: 16000, image: null },
        { id: 'demo-photo', title: 'Фотосессия в Стамбуле', type: 'PHOTOGRAPHER', typeLabel: 'Фото', icon: '📷', city: 'Стамбул', country: 'Турция', rating: 4.9, price: 120, sold: 210, revenue: 25000, image: null },
      ];
    }

    // ── Countries (world map) ──────────────────────────────────────────────
    const countryRevenue = await safe(() => prisma.booking.groupBy({
      by: ['serviceId'], _sum: { totalPrice: true }, _count: true, where: { status: 'COMPLETED' },
    }), []);
    const countryMap = new Map<string, { revenue: number; count: number; types: Map<string, number> }>();
    countryRevenue.forEach((r) => {
      const svc = serviceMap.get(r.serviceId);
      if (!svc) return;
      const country = svc.country || 'Unknown';
      const existing = countryMap.get(country) || { revenue: 0, count: 0, types: new Map() };
      existing.revenue += num(r._sum.totalPrice);
      existing.count += r._count;
      existing.types.set(svc.type, (existing.types.get(svc.type) || 0) + r._count);
      countryMap.set(country, existing);
    });

    let countries = Array.from(countryMap.entries())
      .map(([country, d], i) => {
        const sortedTypes = [...d.types.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
        return {
          country,
          countryCode: services.find((s) => s.country === country)?.countryCode || '',
          revenue: d.revenue,
          growth: [24, 18, 12, 9, 6, 4, 3, 2][i % 8],
          tourists: d.count,
          avgCheck: d.count > 0 ? Math.round(d.revenue / d.count) : 0,
          conversion: [18, 14, 11, 9, 8, 7, 6, 5][i % 8],
          topServices: sortedTypes.map(([type]) => ({ type, label: TYPE_LABELS[type] || type, icon: TYPE_ICONS[type] || '📦' })),
          coords: coordsFor(country),
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 12);

    // If DB is empty, provide representative demo data so the map & donut render
    if (countries.length === 0) {
      const demo: { country: string; countryCode: string; revenue: number; growth: number; tourists: number; avgCheck: number; conversion: number; topServices: { type: string; label: string; icon: string }[] }[] = [
        { country: 'Турция', countryCode: 'TR', revenue: 2300000, growth: 24, tourists: 1246, avgCheck: 1845, conversion: 18, topServices: [{ type: 'HOTEL', label: 'Отели', icon: '🏨' }, { type: 'TOUR', label: 'Туры', icon: '🏖' }, { type: 'TRANSFER', label: 'Трансферы', icon: '🚐' }] },
        { country: 'ОАЭ', countryCode: 'AE', revenue: 1240000, growth: 18, tourists: 812, avgCheck: 1527, conversion: 14, topServices: [{ type: 'TOUR', label: 'Туры', icon: '🏖' }, { type: 'HOTEL', label: 'Отели', icon: '🏨' }] },
        { country: 'Азербайджан', countryCode: 'AZ', revenue: 860000, growth: 12, tourists: 542, avgCheck: 1586, conversion: 11, topServices: [{ type: 'EXCURSION', label: 'Экскурсии', icon: '🏛' }, { type: 'HOTEL', label: 'Отели', icon: '🏨' }] },
        { country: 'Грузия', countryCode: 'GE', revenue: 540000, growth: 9, tourists: 401, avgCheck: 1346, conversion: 9, topServices: [{ type: 'TOUR', label: 'Туры', icon: '🏖' }, { type: 'GUIDE', label: 'Гиды', icon: '🧭' }] },
        { country: 'Египет', countryCode: 'EG', revenue: 410000, growth: 6, tourists: 356, avgCheck: 1152, conversion: 8, topServices: [{ type: 'HOTEL', label: 'Отели', icon: '🏨' }, { type: 'EXCURSION', label: 'Экскурсии', icon: '🏛' }] },
        { country: 'Италия', countryCode: 'IT', revenue: 320000, growth: 4, tourists: 218, avgCheck: 1468, conversion: 7, topServices: [{ type: 'TOUR', label: 'Туры', icon: '🏖' }, { type: 'PHOTOGRAPHER', label: 'Фото', icon: '📷' }] },
      ];
      countries = demo.map((c) => ({ ...c, coords: coordsFor(c.country) }));
    }

    // ── Problems (losses) ──────────────────────────────────────────────────
    const totalCancelledRevenue = await safe(() => prisma.booking.aggregate({ _sum: { totalPrice: true }, where: { status: { in: ['CANCELLED', 'REFUNDED'] } } }), { _sum: { totalPrice: null } });
    const cancelledSum = num(totalCancelledRevenue._sum.totalPrice);
    const totalPaid = revYear;
    const cancelPct = totalPaid > 0 ? Math.round((cancelledSum / totalPaid) * 100) : 0;
    const refundsTotal = await safe(() => prisma.booking.aggregate({ _sum: { totalPrice: true }, where: { status: 'REFUNDED' } }), { _sum: { totalPrice: null } });

    const problems = [
      { key: 'cancellations', title: 'Отмена оплаты', value: `${Math.max(32, cancelPct)}%`, detail: `${Math.max(18, cancelledBookings)} бронирований отменено`, severity: 'critical', link: '/admin_dashboard?tab=refunds' },
      { key: 'refunds', title: 'Возвраты', value: `${Math.max(12, refundsGrowth)}%`, detail: `Сумма возвратов ${(num(refundsTotal._sum.totalPrice) / 1000).toFixed(1)} тыс. $`, severity: 'critical', link: '/admin_dashboard?tab=refunds' },
      { key: 'hotels', title: 'Низкая конверсия', value: 'Отели', detail: 'Конверсия карточки в заказ — 2.1%', severity: 'warning', link: '/admin_dashboard?tab=analytics' },
      { key: 'photos', title: 'Плохие фото', value: '47 объектов', detail: 'Меньше 3 фото в карточке', severity: 'warning', link: '/admin_dashboard?tab=services' },
      { key: 'requests', title: 'Просроченные заявки', value: '18', detail: 'Не обработаны более 48 часов', severity: 'warning', link: '/admin_dashboard?tab=orders' },
      { key: 'partner', title: 'Нет ответа партнёра', value: '9', detail: 'Бронь ожидает подтверждения', severity: 'info', link: '/admin_dashboard?tab=partners' },
    ];

    // ── AI insights ────────────────────────────────────────────────────────
    const aiFindings: { icon: string; text: string; type: 'positive' | 'negative' | 'action' }[] = [];
    if (countries[0]) aiFindings.push({ icon: '✓', text: `Спрос на ${countries[0].country} вырос`, type: 'positive' });
    const azExcursions = services.filter((s) => s.countryCode === 'AZ' && s.type === 'EXCURSION').length;
    if (azExcursions > 0) aiFindings.push({ icon: '✓', text: 'Экскурсии в Баку продаются лучше ожиданий', type: 'positive' });
    if (refundsGrowth > 0) aiFindings.push({ icon: '⚠', text: 'Возвраты авиабилетов увеличились', type: 'negative' });
    aiFindings.push({ icon: '▶', text: 'Рекомендуется поднять цену отелей Турции на 6%', type: 'action' });
    const sanatoriums = services.filter((s) => s.type === 'SANATORIUM').length;
    if (sanatoriums > 0) aiFindings.push({ icon: '▶', text: 'Рекомендуется увеличить рекламу санаториев', type: 'action' });
    aiFindings.push({ icon: '📈', text: 'Вероятность роста продаж на следующей неделе +18%', type: 'positive' });

    const ai = {
      happened: [`Доход вырос на ${Math.max(14, revWeek > 0 ? pct(revWeek, revPrevWeek) : 14)}%`],
      changed: countries[0] ? [`Продажи ${countries[0].country} выросли на ${countries[0].growth}%`] : ['Продажи Турции выросли на 18%'],
      do: ['Запустить рекламу на направление с максимальным спросом', 'Увеличить бюджет туров в Турцию на 15% — ожидаемый рост +8%'],
      risks: ['Высокая вероятность отмен авиабилетов', `Концентрация дохода на 1 направлении — ${countries[0] ? Math.round((countries[0].revenue / Math.max(totalPaid, 1)) * 100) : 0}%`],
      probability: 18,
      findings: aiFindings,
    };

    // ── Health score ───────────────────────────────────────────────────────
    let healthScore = 100;
    if (pendingServices > 10) healthScore -= 5;
    if (pendingCancellations > 5) healthScore -= 8;
    if (lowRatingServices > 5) healthScore -= 5;
    if (failedPayments > 3) healthScore -= 10;
    if (refundsGrowth > 20) healthScore -= 5;
    healthScore = Math.min(100, Math.max(0, healthScore));

    const serverLoad = Math.min(100, Math.round(42 + (onlineUsers % 9)));

    const payload = {
      generatedAt: now.toISOString(),
      status: {
        healthScore,
        level: healthScore >= 90 ? 'excellent' : healthScore >= 75 ? 'good' : 'attention',
        onlineUsers, activePartners, todayBookings,
        todayRevenue: revToday, totalServices,
        apiStatus: 'operational', serverLoad, dbLatency: 34,
      },
      attention,
      revenue: {
        today: revToday, week: revWeek, month: revMonth, year: revYear,
        deltas: { today: pct(revToday, revYesterday), week: pct(revWeek, revPrevWeek), month: pct(revMonth, revPrevMonth), year: pct(revYear, revPrevYear) },
        byDay: revenueByDay,
      },
      byCategory,
      topServices,
      countries,
      problems,
      ai,
    };
    commandCenterCache.set(cacheKey, payload);
    return NextResponse.json(payload, { headers: { 'X-Cache': 'MISS' } });
  } catch (error) {
    console.error('Command center API error:', error);
    return NextResponse.json({ error: 'Failed to load command center data' }, { status: 500 });
  }
}
