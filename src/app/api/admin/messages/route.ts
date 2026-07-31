import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const totalMessages = await prisma.message.count();
    const unread = await prisma.message.count({ where: { isRead: false } });
    const conversations = await prisma.conversation.count();
    const recent = await prisma.message.findMany({ include: { sender: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' }, take: 20 });
    return NextResponse.json({ total: totalMessages, unread, conversations, recent });
  } catch (error) { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
