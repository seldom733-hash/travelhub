export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function DELETE(
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

    // Try delete by favorite ID first, then by serviceId (for compatibility with both pages)
    let deleted = await prisma.favorite.deleteMany({
      where: { id, userId: payload.userId },
    });

    if (deleted.count === 0) {
      deleted = await prisma.favorite.deleteMany({
        where: { serviceId: id, userId: payload.userId },
      });
    }

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Избранное не найдено" }, { status: 404 });
    }

    return NextResponse.json({ message: "Удалено из избранного" });
  } catch (error) {
    console.error("Delete favorite error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
