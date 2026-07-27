export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Неверный токен" }, { status: 401 });

    const { id } = await params;
    const { prisma } = await import("@/lib/prisma");

    const result = await prisma.notification.updateMany({
      where: { id, userId: payload.userId },
      data: { isRead: true },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: "Уведомление не найдено" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
