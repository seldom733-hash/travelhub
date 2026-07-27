export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Неверный токен" }, { status: 401 });

    const { prisma } = await import("@/lib/prisma");

    const participations = await prisma.conversationParticipant.findMany({
      where: { userId: payload.userId },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
              },
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: { sender: { select: { firstName: true } } },
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: "desc" } },
    });

    const conversations = participations.map((p) => {
      const other = p.conversation.participants.find((pp) => pp.userId !== payload.userId);
      const lastMessage = p.conversation.messages[0];
      const unreadCount = 0; // simplified for now

      return {
        id: p.conversation.id,
        otherUser: other?.user || null,
        lastMessage: lastMessage
          ? { text: lastMessage.text, sender: lastMessage.sender.firstName, time: lastMessage.createdAt }
          : null,
        unreadCount,
        updatedAt: p.conversation.updatedAt,
      };
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Conversations fetch error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Неверный токен" }, { status: 401 });

    const { prisma } = await import("@/lib/prisma");
    const body = await request.json();
    const { participantId } = body;

    if (!participantId) {
      return NextResponse.json({ error: "ID собеседника обязателен" }, { status: 400 });
    }

    // Find all conversations where current user is a participant
    const myParticipations = await prisma.conversationParticipant.findMany({
      where: { userId: payload.userId },
      include: {
        conversation: {
          include: { participants: true },
        },
      },
    });

    // Check if any conversation already includes both users
    for (const p of myParticipations) {
      const hasOtherParticipant = p.conversation.participants.some(
        (pp) => pp.userId === participantId
      );
      if (hasOtherParticipant) {
        return NextResponse.json({ conversationId: p.conversation.id });
      }
    }

    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: payload.userId },
            { userId: participantId },
          ],
        },
      },
    });

    return NextResponse.json({ conversationId: conversation.id }, { status: 201 });
  } catch (error) {
    console.error("Conversation create error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
