export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// GET — получить все варианты цен услуги
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { prisma } = await import("@/lib/prisma");
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const roomType = searchParams.get("roomType");
    const mealPlan = searchParams.get("mealPlan");

    const where: Record<string, unknown> = { serviceId: id, isActive: true };
    if (dateFrom && dateTo) {
      where.dateFrom = { lte: new Date(dateTo) };
      where.dateTo = { gte: new Date(dateFrom) };
    }
    if (roomType) where.roomType = roomType;
    if (mealPlan) where.mealPlan = mealPlan;

    const variants = await prisma.servicePriceVariant.findMany({
      where,
      orderBy: [{ dateFrom: "asc" }, { roomType: "asc" }, { guestsAdults: "asc" }],
    });

    return NextResponse.json({ variants });
  } catch (error) {
    console.error("Variants fetch error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST — создать варианты цен (массово)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { prisma } = await import("@/lib/prisma");
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Неверный токен" }, { status: 401 });

    // Verify ownership
    const service = await prisma.service.findUnique({ where: { id }, select: { providerId: true } });
    if (!service || service.providerId !== payload.userId) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }

    const body = await request.json();
    const { variants } = body as { variants: Array<{
      dateFrom: string; dateTo: string; roomType?: string; mealPlan?: string;
      childAgeFrom?: number; childAgeTo?: number; guestsAdults?: number;
      guestsChildren?: number; nights?: number; pricePerPerson: number;
      basePrice?: number; childPrice?: number; availableSlots?: number;
    }> };

    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return NextResponse.json({ error: "Нет данных для импорта" }, { status: 400 });
    }

    const created = await prisma.servicePriceVariant.createMany({
      data: variants.map((v) => ({
        serviceId: id,
        dateFrom: new Date(v.dateFrom),
        dateTo: new Date(v.dateTo),
        roomType: v.roomType || null,
        mealPlan: v.mealPlan || null,
        childAgeFrom: v.childAgeFrom ?? null,
        childAgeTo: v.childAgeTo ?? null,
        guestsAdults: v.guestsAdults ?? 2,
        guestsChildren: v.guestsChildren ?? 0,
        nights: v.nights ?? null,
        pricePerPerson: v.pricePerPerson,
        basePrice: v.basePrice ?? null,
        childPrice: v.childPrice ?? null,
        availableSlots: v.availableSlots ?? null,
      })),
    });

    return NextResponse.json({ count: created.count }, { status: 201 });
  } catch (error) {
    console.error("Variants create error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

// DELETE — удалить варианты цен
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const { variantIds } = body as { variantIds: string[] };

    if (variantIds && variantIds.length > 0) {
      await prisma.servicePriceVariant.deleteMany({ where: { id: { in: variantIds }, serviceId: id } });
    } else {
      await prisma.servicePriceVariant.deleteMany({ where: { serviceId: id } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Variants delete error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
