import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export const dynamic = "force-dynamic";

const num = (v: unknown): number => (typeof v === "bigint" ? Number(v) : Number(v || 0));

const TYPE_ICONS: Record<string, string> = {
  TOUR: "🏖", HOTEL: "🏨", SANATORIUM: "🏥", EXCURSION: "🏛",
  GUIDE: "🧭", PHOTOGRAPHER: "📷", TRANSFER: "🚐", FLIGHT: "✈", TRAIN: "🚄",
};

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    if (q.length < 2) return NextResponse.json({ query: q, results: { services: [], partners: [], users: [], bookings: [], countries: [] } });

    const where = { contains: q, mode: 'insensitive' as const };

    const [services, partners, users, bookings, countries] = await Promise.all([
      prisma.service.findMany({
        where: { OR: [{ title: where }, { city: where }, { country: where }], isActive: true },
        select: { id: true, title: true, type: true, city: true, country: true, price: true, rating: true, images: true },
        take: 8,
      }),
      prisma.user.findMany({
        where: { role: 'PARTNER', OR: [{ companyName: where }, { firstName: where }, { lastName: where }] },
        select: { id: true, firstName: true, lastName: true, companyName: true, partnerType: true, _count: { select: { services: true } } },
        take: 6,
      }),
      prisma.user.findMany({
        where: { role: { not: 'PARTNER' }, OR: [{ firstName: where }, { lastName: where }, { email: where }] },
        select: { id: true, firstName: true, lastName: true, email: true, role: true },
        take: 6,
      }),
      prisma.booking.findMany({
        where: { id: { contains: q } },
        include: { service: { select: { title: true, type: true } }, user: { select: { firstName: true, lastName: true } } },
        take: 8,
      }).catch(() => []),
      prisma.$queryRawUnsafe<{ country: string; revenue: number; count: number }[]>(
        `SELECT s.country, COALESCE(SUM(b.total_price),0) as revenue, COUNT(*) as count
         FROM bookings b JOIN services s ON b.service_id = s.id
         WHERE b.status = 'COMPLETED' AND LOWER(s.country) LIKE LOWER($1)
         GROUP BY s.country ORDER BY revenue DESC LIMIT 5`, `%${q}%`
      ).catch(() => []),
    ]);

    return NextResponse.json({
      query: q,
      results: {
        services: services.map((s) => ({
          id: s.id, title: s.title, type: s.type, icon: TYPE_ICONS[s.type] || '📦',
          city: s.city, country: s.country, price: num(s.price), rating: s.rating,
          image: (s.images || '').split(',').map((x) => x.trim()).filter(Boolean)[0] || null,
        })),
        partners: partners.map((p) => ({
          id: p.id, name: `${p.firstName} ${p.lastName}`.trim(), companyName: p.companyName,
          partnerType: p.partnerType, servicesCount: p._count.services,
        })),
        users: users.map((u) => ({ id: u.id, name: `${u.firstName} ${u.lastName}`.trim(), email: u.email, role: u.role })),
        bookings: bookings.map((b) => ({
          id: b.id, title: b.service?.title, type: b.service?.type,
          customer: `${b.user?.firstName} ${b.user?.lastName}`.trim(),
          totalPrice: num(b.totalPrice), status: b.status, createdAt: b.createdAt,
        })),
        countries: countries.map((c) => ({ country: c.country, revenue: num(c.revenue), count: num(c.count) })),
      },
    });
  } catch (error) {
    console.error('Admin global search error:', error);
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 });
  }
}
