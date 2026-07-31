export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";

// Stripe initialization (lazy to avoid build errors without key)
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Stripe = require("stripe").default;
  return new Stripe(key);
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request, ["BUYER", "PARTNER", "ADMIN", "MODERATOR"]);
    if (auth.response) return auth.response;
    const payload = auth.payload;

    const body = await request.json();
    const { items, guestInfo } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Корзина пуста" }, { status: 400 });
    }

    const stripe = getStripe();

    // Demo mode: if no Stripe key, create booking directly
    if (!stripe) {
      const { prisma } = await import("@/lib/prisma");

      const booking = await prisma.$transaction(async (tx) => {
        let totalPrice = 0;
        let serviceFee = 0;
        const bookingItems: Array<{ serviceId: string; guests: number; checkIn: Date; checkOut: Date; notes?: string }> = [];

        for (const item of items) {
          const service = await tx.service.findUnique({
            where: { id: item.serviceId },
            select: { id: true, price: true, discountPrice: true },
          });
          if (!service) throw new Error(`Услуга ${item.serviceId} не найдена`);

          const price = Number(service.discountPrice || service.price);
          const itemTotal = price * (item.guests || 1) * (item.quantity || 1);
          totalPrice += itemTotal;

          bookingItems.push({
            serviceId: item.serviceId,
            guests: item.guests || 1,
            checkIn: new Date(item.date || new Date()),
            checkOut: new Date(item.checkOut || item.date || new Date()),
            notes: item.notes,
          });
        }

        serviceFee = Math.round(totalPrice * 0.05);
        const total = totalPrice + serviceFee;

        // Create one booking per item
        const bookings = [];
        for (const bi of bookingItems) {
          const cancellationDeadline = new Date(bi.checkIn);
          cancellationDeadline.setHours(cancellationDeadline.getHours() - 48);

          const b = await tx.booking.create({
            data: {
              userId: payload.userId,
              serviceId: bi.serviceId,
              checkIn: bi.checkIn,
              checkOut: bi.checkOut,
              guests: bi.guests,
              totalPrice: Math.round(total / bookingItems.length),
              serviceFee: Math.round(serviceFee / bookingItems.length),
              notes: bi.notes || null,
              status: "CONFIRMED",
              cancellationDeadline,
            },
            include: { service: { select: { title: true, city: true, country: true } } },
          });

          // Create demo payment
          await tx.payment.create({
            data: {
              bookingId: b.id,
              amount: Math.round(total / bookingItems.length),
              method: "CARD",
              status: "COMPLETED",
              transactionId: `demo_${Date.now()}_${Math.random().toString(36).slice(2)}`,
              paidAt: new Date(),
            },
          });

          bookings.push(b);
        }

        return { bookings, total };
      });

      return NextResponse.json({
        success: true,
        mode: "demo",
        bookingIds: booking.bookings.map((b) => b.id),
        total: booking.total,
        message: "Бронирование успешно создано (демо-режим)",
      });
    }

    // Real Stripe mode
    const lineItems = items.map((item: { name: string; price: number; quantity: number; image?: string }) => ({
      price_data: {
        currency: "azn",
        product_data: {
          name: item.name,
          ...(item.image ? { images: [item.image] } : {}),
        },
        unit_amount: Math.round(item.price * 100), // Stripe uses cents
      },
      quantity: item.quantity || 1,
    }));

    // Add service fee (5%)
    const subtotal = items.reduce((sum: number, item: { price: number; quantity?: number }) => sum + item.price * (item.quantity || 1), 0);
    const fee = Math.round(subtotal * 0.05 * 100);

    lineItems.push({
      price_data: {
        currency: "azn",
        product_data: {
          name: "Сервисный сбор TravelHub (5%)",
        },
        unit_amount: fee,
      },
      quantity: 1,
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"}/checkout?session_id={CHECKOUT_SESSION_ID}&status=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"}/checkout?status=cancelled`,
      customer_email: guestInfo?.email || undefined,
      metadata: {
        userId: payload.userId,
        items: JSON.stringify(items.map((i: { serviceId: string }) => i.serviceId)),
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Payment session error:", error);
    return NextResponse.json({ error: "Ошибка создания платежа" }, { status: 500 });
  }
}
