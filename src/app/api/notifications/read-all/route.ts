export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Неверный токен" }, { status: 401 });

    const { prisma } = await import("@/lib/prisma");

    await prisma.notification.updateMany({
      where: { userId: payload.userId, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
