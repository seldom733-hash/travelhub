export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Неверный токен" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");

    if (!serviceId) {
      return NextResponse.json({ error: "serviceId обязателен" }, { status: 400 });
    }

    const { prisma } = await import("@/lib/prisma");

    const favorite = await prisma.favorite.findUnique({
      where: { userId_serviceId: { userId: payload.userId, serviceId } },
    });

    return NextResponse.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error("Check favorite error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
