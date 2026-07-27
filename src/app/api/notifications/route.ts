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

    const notifications = await prisma.notification.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: payload.userId, isRead: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
