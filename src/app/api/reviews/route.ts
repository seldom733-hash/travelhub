export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { prisma } = await import("@/lib/prisma");
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");
    const rating = searchParams.get("rating");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, unknown> = {};
    if (serviceId) where.serviceId = serviceId;
    if (rating) where.rating = parseInt(rating);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: { select: { firstName: true, lastName: true, avatar: true } },
          service: { select: { title: true } },
          reply: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.review.count({ where }),
    ]);

    const avgResult = await prisma.review.aggregate({ _avg: { rating: true } });

    return NextResponse.json({
      reviews,
      total,
      averageRating: avgResult._avg.rating || 0,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Неверный токен" }, { status: 401 });

    const body = await request.json();
    const { serviceId, rating, title, text, photos } = body;

    if (!serviceId || !rating || !text) {
      return NextResponse.json({ error: "Обязательные поля не заполнены" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Оценка должна быть от 1 до 5" }, { status: 400 });
    }

    const { prisma } = await import("@/lib/prisma");

    const existing = await prisma.review.findUnique({
      where: { userId_serviceId: { userId: payload.userId, serviceId } },
    });

    if (existing) {
      return NextResponse.json({ error: "Вы уже оставляли отзыв на эту услугу" }, { status: 409 });
    }

    const review = await prisma.review.create({
      data: {
        userId: payload.userId,
        serviceId,
        rating,
        title: title || undefined,
        text,
        photos: photos || [],
      },
      include: {
        user: { select: { firstName: true, lastName: true, avatar: true } },
        service: { select: { title: true } },
      },
    });

    // Update service rating
    const stats = await prisma.review.aggregate({
      where: { serviceId },
      _avg: { rating: true },
      _count: { id: true },
    });

    await prisma.service.update({
      where: { id: serviceId },
      data: {
        rating: stats._avg.rating || 0,
        reviewCount: stats._count.id,
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
