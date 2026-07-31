import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const reviews = await prisma.review.findMany({ include: { user: { select: { firstName: true, lastName: true, email: true } }, service: { select: { title: true, type: true } } }, orderBy: { createdAt: 'desc' }, take: 50 });
    const totalReviews = await prisma.review.count();
    return NextResponse.json({ reviews, total: totalReviews });
  } catch (error) { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
