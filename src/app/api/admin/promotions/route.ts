import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const [promos, total] = await Promise.all([
      prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
      prisma.promoCode.count(),
    ]);
    const active = await prisma.promoCode.count({ where: { isActive: true } });
    const totalUsed = await prisma.promoCode.aggregate({ _sum: { usedCount: true } });
    return NextResponse.json({ promos, total, active, totalUsed: totalUsed._sum.usedCount || 0 });
  } catch (error) { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
