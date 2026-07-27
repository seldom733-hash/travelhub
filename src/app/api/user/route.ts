export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, verifyPassword, hashPassword } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Неверный токен" }, { status: 401 });

    const { prisma } = await import("@/lib/prisma");
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, bio: true, role: true, createdAt: true },
    });

    if (!user) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Неверный токен" }, { status: 401 });

    const { prisma } = await import("@/lib/prisma");
    const body = await request.json();
    const { firstName, lastName, phone, bio } = body;

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        ...(firstName !== undefined && { firstName: firstName.trim() }),
        ...(lastName !== undefined && { lastName: lastName.trim() }),
        ...(phone !== undefined && { phone: phone.trim() || null }),
        ...(bio !== undefined && { bio: bio.trim() || null }),
      },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, bio: true, role: true },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Ошибка при обновлении профиля" }, { status: 500 });
  }
}
