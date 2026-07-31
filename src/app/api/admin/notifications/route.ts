import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const total = await prisma.notification.count();
    const unread = await prisma.notification.count({ where: { isRead: false } });
    const byType = await prisma.notification.groupBy({ by: ['type'], _count: true });
    const recent = await prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });
    return NextResponse.json({ total, unread, byType: byType.map(b => ({ type: b.type, count: b._count })), recent });
  } catch (error) { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
