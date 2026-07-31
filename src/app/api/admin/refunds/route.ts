import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const [cancellations, total] = await Promise.all([
      prisma.cancellation.findMany({ include: { booking: { include: { user: { select: { firstName: true, lastName: true, email: true } }, service: { select: { title: true, type: true } } } } }, orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.cancellation.count(),
    ]);
    const stats = await prisma.cancellation.groupBy({ by: ['status'], _count: true, _sum: { refundAmount: true } });
    return NextResponse.json({ cancellations, total, stats: stats.map(s => ({ status: s.status, count: s._count, amount: Number(s._sum.refundAmount || 0) })) });
  } catch (error) { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
