export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Неверный токен" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: "Текст ответа обязателен" }, { status: 400 });
    }

    const { prisma } = await import("@/lib/prisma");

    const review = await prisma.review.findUnique({
      where: { id },
      include: { service: true },
    });

    if (!review) {
      return NextResponse.json({ error: "Отзыв не найден" }, { status: 404 });
    }

    if (review.service.providerId !== payload.userId) {
      return NextResponse.json(
        { error: "Вы можете отвечать только на отзывы к своим услугам" },
        { status: 403 }
      );
    }

    const existingReply = await prisma.reviewReply.findUnique({
      where: { reviewId: id },
    });

    if (existingReply) {
      return NextResponse.json({ error: "Вы уже ответили на этот отзыв" }, { status: 409 });
    }

    const reply = await prisma.reviewReply.create({
      data: { reviewId: id, text },
    });

    return NextResponse.json({ reply }, { status: 201 });
  } catch (error) {
    console.error("Error creating reply:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
