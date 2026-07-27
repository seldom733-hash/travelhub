export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { hashPassword, createToken, AUTH_COOKIE_OPTIONS } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rateLimit = checkRateLimit(`register:${ip}`, 3, 60000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Слишком много попыток. Попробуйте через минуту." }, { status: 429 });
    }

    const { prisma } = await import("@/lib/prisma");
    const body = await request.json();
    const { email, password, firstName, lastName, phone, role, partnerType, companyName } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: "Обязательные поля не заполнены" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Пароль должен содержать минимум 8 символов" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Пользователь с таким email уже существует" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: { email, passwordHash, firstName, lastName, phone: phone || null, role: role === "PARTNER" ? "PARTNER" : "BUYER", partnerType: partnerType || null, companyName: role === "PARTNER" ? (companyName || null) : null },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, companyName: true, createdAt: true },
    });

    const token = await createToken({ userId: user.id, email: user.email, role: user.role });

    const response = NextResponse.json({ message: "Регистрация успешна", user }, { status: 201 });

    response.cookies.set("token", token, AUTH_COOKIE_OPTIONS);

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Ошибка сервера при регистрации" }, { status: 500 });
  }
}
