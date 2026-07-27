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
    const favorites = await prisma.favorite.findMany({
      where: { userId: payload.userId },
      include: {
        service: {
          select: {
            id: true, title: true, city: true, country: true,
            images: true, type: true, price: true, discountPrice: true,
            rating: true, reviewCount: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error("Fetch favorites error:", error);
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
    const { serviceId } = body;

    if (!serviceId) {
      return NextResponse.json({ error: "serviceId обязателен" }, { status: 400 });
    }

    const favorite = await prisma.favorite.upsert({
      where: { userId_serviceId: { userId: payload.userId, serviceId } },
      update: {},
      create: { userId: payload.userId, serviceId },
    });

    return NextResponse.json({ favorite }, { status: 201 });
  } catch (error) {
    console.error("Add favorite error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
