import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const [todayCount, weekCount, monthCount] = await Promise.all([
      prisma.booking.count({ where: { checkIn: { gte: today, lt: new Date(today.getTime() + 86400000) } } }),
      prisma.booking.count({ where: { checkIn: { gte: today, lt: weekEnd } } }),
      prisma.booking.count({ where: { checkIn: { gte: today, lt: monthEnd } } }),
    ]);
    const upcoming = await prisma.booking.findMany({ where: { checkIn: { gte: today } }, include: { user: { select: { firstName: true, lastName: true } }, service: { select: { title: true, type: true } } }, orderBy: { checkIn: 'asc' }, take: 20 });
    return NextResponse.json({ today: todayCount, thisWeek: weekCount, thisMonth: monthCount, upcoming });
  } catch (error) { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
