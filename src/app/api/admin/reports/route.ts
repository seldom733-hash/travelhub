import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const [totalBookings, totalRevenue, totalUsers, totalServices, totalReviews] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.aggregate({ _sum: { totalPrice: true }, where: { status: 'COMPLETED' } }),
      prisma.user.count(),
      prisma.service.count({ where: { isActive: true } }),
      prisma.review.count(),
    ]);
    return NextResponse.json({ bookings: totalBookings, revenue: Number(totalRevenue._sum.totalPrice || 0), users: totalUsers, services: totalServices, reviews: totalReviews });
  } catch (error) { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
