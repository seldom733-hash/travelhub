export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, verifyPassword, hashPassword } from "@/lib/auth";

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Неверный токен" }, { status: 401 });

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Все поля обязательны" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Новый пароль должен содержать минимум 8 символов" }, { status: 400 });
    }

    const { prisma } = await import("@/lib/prisma");

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Неверный текущий пароль" }, { status: 401 });
    }

    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: payload.userId },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({ message: "Пароль успешно изменён" });
  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
