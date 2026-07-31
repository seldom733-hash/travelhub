import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const totalFees = await prisma.booking.aggregate({ _sum: { serviceFee: true }, where: { status: 'COMPLETED' } });
    const byType = await prisma.booking.groupBy({ by: ['serviceId'], _sum: { serviceFee: true }, _count: true, where: { status: 'COMPLETED' } });
    const services = await prisma.service.findMany({ select: { id: true, title: true, type: true } });
    const typeMap = new Map(services.map(s => [s.id, { title: s.title, type: s.type }]));
    return NextResponse.json({ totalEarned: Number(totalFees._sum.serviceFee || 0), byType: byType.map(b => ({ serviceId: b.serviceId, title: typeMap.get(b.serviceId)?.title || 'Unknown', type: typeMap.get(b.serviceId)?.type || 'Unknown', fees: Number(b._sum.serviceFee || 0), count: b._count })) });
  } catch (error) { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
