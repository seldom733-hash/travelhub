export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// GET — получить типы номеров услуги
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { prisma } = await import("@/lib/prisma");
    const roomTypes = await prisma.roomType.findMany({
      where: { serviceId: id, isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ roomTypes });
  } catch (error) {
    console.error("RoomTypes fetch error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST — создать тип номера
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { prisma } = await import("@/lib/prisma");
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Неверный токен" }, { status: 401 });

    const service = await prisma.service.findUnique({ where: { id }, select: { providerId: true } });
    if (!service || service.providerId !== payload.userId) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, maxAdults, maxChildren, basePrice, images, amenities } = body;
    if (!name || !basePrice) {
      return NextResponse.json({ error: "Обязательные поля не заполнены" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, "-").replace(/^-|-$/g, "");
    const roomType = await prisma.roomType.create({
      data: {
        serviceId: id, name, slug, description, maxAdults: maxAdults ?? 2,
        maxChildren: maxChildren ?? 0, basePrice, images: images || "",
        amenities: amenities || "",
      },
    });

    return NextResponse.json({ roomType }, { status: 201 });
  } catch (error) {
    console.error("RoomType create error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
