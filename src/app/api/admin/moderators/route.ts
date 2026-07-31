import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const moderators = await prisma.user.findMany({ where: { role: 'MODERATOR' }, select: { id: true, firstName: true, lastName: true, email: true, lastLoginAt: true, isActive: true, createdAt: true }, orderBy: { createdAt: 'desc' } });
    const actions = await prisma.auditLog.count({ where: { actorRole: 'MODERATOR' } });
    return NextResponse.json({ moderators, total: moderators.length, active: moderators.filter(m => m.isActive).length, actions });
  } catch (error) { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
