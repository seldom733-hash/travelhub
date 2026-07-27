export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// GET — получить правила ценообразования
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { prisma } = await import("@/lib/prisma");
    const rules = await prisma.pricingRule.findMany({
      where: { serviceId: id, isActive: true },
      orderBy: { priority: "desc" },
    });
    return NextResponse.json({ rules });
  } catch (error) {
    console.error("PricingRules fetch error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST — создать/обновить правила ценообразования
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
    const { rules } = body as { rules: Array<{
      name: string; type: string; paramKey: string; paramValue: string;
      modifier: string; value: number; priority?: number;
    }> };

    if (!rules || !Array.isArray(rules) || rules.length === 0) {
      return NextResponse.json({ error: "Нет данных" }, { status: 400 });
    }

    // Delete existing rules for this service
    await prisma.pricingRule.deleteMany({ where: { serviceId: id } });

    const created = await prisma.pricingRule.createMany({
      data: rules.map((r, i) => ({
        serviceId: id,
        name: r.name,
        type: r.type as "ROOM_TYPE" | "MEAL_PLAN" | "CHILD" | "NIGHTS" | "SEASON" | "GUESTS",
        paramKey: r.paramKey,
        paramValue: r.paramValue,
        modifier: r.modifier as "ADD" | "SUBTRACT" | "MULTIPLY" | "FIXED",
        value: r.value,
        priority: r.priority ?? i,
      })),
    });

    return NextResponse.json({ count: created.count }, { status: 201 });
  } catch (error) {
    console.error("PricingRules create error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
