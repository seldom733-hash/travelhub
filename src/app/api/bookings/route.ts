export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { prisma } = await import("@/lib/prisma");
    const authHeader = request.headers.get("Authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const cookieToken = request.cookies.get("token")?.value;
    const token = bearerToken || cookieToken;

    if (!token) return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Неверный токен" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId: payload.userId };
    if (status) where.status = status;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: { service: { select: { id: true, title: true, city: true, country: true, images: true, type: true } }, payment: true },
        orderBy: { createdAt: "desc" },
        skip, take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    return NextResponse.json({ bookings, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("Bookings fetch error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prisma } = await import("@/lib/prisma");
    const authHeader = request.headers.get("Authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const cookieToken = request.cookies.get("token")?.value;
    const token = bearerToken || cookieToken;

    if (!token) return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Неверный токен" }, { status: 401 });

    const body = await request.json();
    const { serviceId, checkIn, checkOut, guests, notes } = body;

    if (!serviceId || !checkIn || !checkOut || !guests) {
      return NextResponse.json({ error: "Обязательные поля не заполнены" }, { status: 400 });
    }

    const cancellationDeadline = new Date(checkIn);
    cancellationDeadline.setHours(cancellationDeadline.getHours() - 48);

    const booking = await prisma.$transaction(async (tx) => {
      const service = await tx.service.findUnique({ where: { id: serviceId }, select: { price: true, discountPrice: true } });
      if (!service) throw new Error("Услуга не найдена");

      const pricePerPerson = service.discountPrice || service.price;
      const totalPrice = Number(pricePerPerson) * guests;
      const serviceFee = Math.round(totalPrice * 0.05);

      return tx.booking.create({
        data: {
          userId: payload.userId, serviceId, checkIn: new Date(checkIn), checkOut: new Date(checkOut),
          guests, totalPrice, serviceFee, notes: notes || null, cancellationDeadline,
        },
        include: { service: { select: { title: true, city: true, country: true } } },
      });
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error("Booking create error:", error);
    return NextResponse.json({ error: "Ошибка сервера при бронировании" }, { status: 500 });
  }
}
