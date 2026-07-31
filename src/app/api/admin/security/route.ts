import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { isActive: true } });
    const admins = await prisma.user.count({ where: { role: 'ADMIN' } });
    const moderators = await prisma.user.count({ where: { role: 'MODERATOR' } });
    const recentLogs = await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 20 });
    return NextResponse.json({ totalUsers, activeUsers, admins, moderators, recentLogs });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
