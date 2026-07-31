import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    const [orders, total] = await Promise.all([
      prisma.booking.findMany({ where, include: { user: { select: { id: true, firstName: true, lastName: true, email: true } }, service: { select: { id: true, title: true, type: true, city: true, country: true } }, payment: true }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.booking.count({ where }),
    ]);
    const stats = await prisma.booking.groupBy({ by: ['status'], _count: true, _sum: { totalPrice: true } });
    const totalRevenue = await prisma.booking.aggregate({ _sum: { totalPrice: true }, where: { status: 'COMPLETED' } });
    return NextResponse.json({ orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }, stats: stats.map(s => ({ status: s.status, count: s._count, revenue: Number(s._sum.totalPrice || 0) })), totalRevenue: Number(totalRevenue._sum.totalPrice || 0) });
  } catch (error) { return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 }); }
}
