import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const [totalPageViews, todayPageViews, totalSearches, totalFunnelEvents] = await Promise.all([
      prisma.pageView.count(),
      prisma.pageView.count({ where: { createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) } } }),
      prisma.searchQuery.count(),
      prisma.funnelEvent.count(),
    ]);
    return NextResponse.json({ totalRequests: totalPageViews, todayRequests: todayPageViews, totalSearches, totalFunnelEvents });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
