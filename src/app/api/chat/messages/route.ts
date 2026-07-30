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
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId обязателен" }, { status: 400 });
    }

    // Verify user is participant
    const participation = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: payload.userId } },
    });

    if (!participation) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Messages fetch error:", error);
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
    const { conversationId, text, type } = body;

    if (!conversationId || !text) {
      return NextResponse.json({ error: "conversationId и text обязательны" }, { status: 400 });
    }

    // Verify user is participant
    const participation = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: payload.userId } },
    });

    if (!participation) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: payload.userId,
        text,
        type: type || "TEXT",
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Broadcast to SSE listeners for real-time delivery
    try {
      const { broadcastMessage } = await import("@/app/api/chat/stream/route");
      broadcastMessage(conversationId, message);
    } catch {
      // SSE module may not be loaded — non-critical
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Message send error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
