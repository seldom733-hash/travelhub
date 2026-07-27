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
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Неверное действие" }, { status: 400 });
    }

    const { prisma } = await import("@/lib/prisma");

    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) {
      return NextResponse.json({ error: "Услуга не найдена" }, { status: 404 });
    }

    if (action === "approve") {
      await prisma.service.update({ where: { id }, data: { isActive: true } });
    } else {
      await prisma.service.delete({ where: { id } });
    }

    return NextResponse.json({ success: true, action });
  } catch (error) {
    console.error("Admin moderation error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
