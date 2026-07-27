export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, createToken, AUTH_COOKIE_OPTIONS } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rateLimit = checkRateLimit(`login:${ip}`, 5, 60000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Слишком много попыток. Попробуйте через минуту." }, { status: 429 });
    }

    const { prisma } = await import("@/lib/prisma");
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email и пароль обязательны" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, passwordHash: true, isActive: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "Аккаунт деактивирован" }, { status: 403 });
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json({ error: "Неверный email или пароль" }, { status: 401 });
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = await createToken({ userId: user.id, email: user.email, role: user.role });

    const response = NextResponse.json({
      message: "Вход выполнен успешно",
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    });

    response.cookies.set("token", token, AUTH_COOKIE_OPTIONS);

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Ошибка сервера при входе" }, { status: 500 });
  }
}
