import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    const [customers, total] = await Promise.all([
      prisma.user.findMany({ where: { role: 'BUYER' }, include: { _count: { select: { bookings: true, reviews: true } } }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.user.count({ where: { role: 'BUYER' } }),
    ]);
    const newToday = await prisma.user.count({ where: { role: 'BUYER', createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } } });
    const totalSpending = await prisma.booking.aggregate({ _sum: { totalPrice: true }, where: { status: 'COMPLETED' } });
    return NextResponse.json({ customers, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }, newToday, avgSpending: total > 0 ? Number(totalSpending._sum.totalPrice || 0) / total : 0 });
  } catch (error) { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
