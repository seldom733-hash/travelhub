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
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.auditLog.count(),
    ]);
    const byAction = await prisma.auditLog.groupBy({ by: ['action'], _count: true, orderBy: { _count: { action: 'desc' } } });
    return NextResponse.json({ logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }, byAction: byAction.map(b => ({ action: b.action, count: b._count })) });
  } catch (error) { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
