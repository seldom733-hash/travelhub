import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";

export const dynamic = "force-dynamic";

const BOOKING_STATUS_LABEL: Record<string, string> = {
  PENDING: "Новое",
  CONFIRMED: "Подтверждено",
  COMPLETED: "Завершено",
  CANCELLED: "Отменено",
  REFUNDED: "Возвращено",
};

/** Deterministic voucher code from a booking id */
function voucherCode(id: string): string {
  const clean = id.replace(/[^a-z0-9]/gi, "").toUpperCase();
  const hash = clean.split("").reduce((s, ch) => (s * 31 + ch.charCodeAt(0)) % 100000, 7);
  return `VCH-${String(hash).padStart(5, "0")}-${clean.slice(-4)}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, ["ADMIN"]);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { action } = body as { action?: string };

    if (!action || !["confirm", "cancel_refund", "voucher"].includes(action)) {
      return NextResponse.json({ error: "Неверное действие" }, { status: 400 });
    }

    const { prisma } = await import("@/lib/prisma");

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        service: { select: { id: true, title: true, type: true, city: true, country: true, images: true } },
        payment: true,
        cancellation: true,
      },
    });
    if (!booking) {
      return NextResponse.json({ error: "Бронирование не найдено" }, { status: 404 });
    }

    const notifUserId = booking.userId;

    // ── 1. CONFIRM ──
    if (action === "confirm") {
      if (booking.status === "CONFIRMED") {
        return NextResponse.json({ error: "Бронирование уже подтверждено" }, { status: 409 });
      }
      if (booking.status === "CANCELLED" || booking.status === "REFUNDED") {
        return NextResponse.json({ error: "Нельзя подтвердить отменённое или возвращённое бронирование" }, { status: 409 });
      }
      const updated = await prisma.booking.update({
        where: { id },
        data: { status: "CONFIRMED" },
        include: { payment: true, cancellation: true },
      });
      await prisma.notification.create({
        data: {
          type: "BOOKING",
          title: "✅ Бронирование подтверждено",
          description: `Ваша бронь «${booking.service.title}» подтверждена администратором.`,
          link: `/bookings/${id}`,
          userId: notifUserId,
        },
      });
      await prisma.auditLog.create({
        data: {
          actorId: auth.payload.userId,
          actorEmail: auth.payload.email,
          actorRole: auth.payload.role,
          action: "confirm_booking",
          targetType: "booking",
          targetId: id,
          metadata: JSON.stringify({ serviceTitle: booking.service.title, from: booking.status, to: "CONFIRMED" }),
        },
      });
      return NextResponse.json({ success: true, action, booking: updated, notification: "Бронирование подтверждено" });
    }

    // ── 2. CANCEL + REFUND ──
    if (action === "cancel_refund") {
      if (booking.status === "CANCELLED" || booking.status === "REFUNDED") {
        return NextResponse.json({ error: "Бронирование уже отменено" }, { status: 409 });
      }
      const totalPrice = Number(booking.totalPrice || 0);
      const refundAmount = Math.round(totalPrice);

      const updated = await prisma.$transaction(async (tx) => {
        const b = await tx.booking.update({ where: { id }, data: { status: "REFUNDED" } });
        if (booking.payment) {
          await tx.payment.update({ where: { id: booking.payment.id }, data: { status: "REFUNDED" } });
        }
        await tx.cancellation.upsert({
          where: { bookingId: id },
          create: {
            bookingId: id,
            reason: "Отменено администратором с возвратом средств",
            refundAmount,
            status: "PROCESSED",
            processedAt: new Date(),
          },
          update: { refundAmount, status: "PROCESSED", processedAt: new Date() },
        });
        return b;
      });

      await prisma.notification.create({
        data: {
          type: "BOOKING",
          title: "↩️ Бронирование отменено, средства возвращены",
          description: `Бронь «${booking.service.title}» отменена. Возврат ${refundAmount} ${booking.currency || "USD"} обработан.`,
          link: `/bookings/${id}`,
          userId: notifUserId,
        },
      });
      await prisma.auditLog.create({
        data: {
          actorId: auth.payload.userId,
          actorEmail: auth.payload.email,
          actorRole: auth.payload.role,
          action: "cancel_refund_booking",
          targetType: "booking",
          targetId: id,
          metadata: JSON.stringify({ serviceTitle: booking.service.title, refundAmount }),
        },
      });
      return NextResponse.json({
        success: true,
        action,
        booking: updated,
        cancellation: { refundAmount, status: "PROCESSED" },
        notification: "Бронирование отменено, возврат обработан",
      });
    }

    // ── 3. VOUCHER ──
    if (action === "voucher") {
      if (booking.status === "PENDING" || booking.status === "CANCELLED" || booking.status === "REFUNDED") {
        return NextResponse.json({ error: "Ваучер можно отправить только по подтверждённому или завершённому бронированию" }, { status: 409 });
      }
      const code = voucherCode(id);
      const clientName = `${booking.user.firstName || ""} ${booking.user.lastName || ""}`.trim() || booking.user.email;
      const voucher = {
        code,
        bookingId: id,
        clientName,
        clientEmail: booking.user.email,
        serviceTitle: booking.service.title,
        serviceType: booking.service.type,
        city: booking.service.city,
        country: booking.service.country,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guests: booking.guests,
        totalPrice: Number(booking.totalPrice || 0),
        currency: booking.currency || "USD",
        issuedAt: new Date().toISOString(),
      };

      await prisma.notification.create({
        data: {
          type: "BOOKING",
          title: "🎫 Ваш ваучер готов",
          description: `Ваучер ${code} по брони «${booking.service.title}» отправлен. Код: ${code}.`,
          link: `/bookings/${id}`,
          userId: notifUserId,
        },
      });
      await prisma.auditLog.create({
        data: {
          actorId: auth.payload.userId,
          actorEmail: auth.payload.email,
          actorRole: auth.payload.role,
          action: "send_voucher",
          targetType: "booking",
          targetId: id,
          metadata: JSON.stringify({ voucherCode: code, serviceTitle: booking.service.title }),
        },
      });
      return NextResponse.json({ success: true, action, voucher, notification: "Ваучер отправлен клиенту" });
    }

    return NextResponse.json({ error: "Неверное действие" }, { status: 400 });
  } catch (error) {
    console.error("Booking action error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

// Re-export helper for potential GET of status labels elsewhere
export { BOOKING_STATUS_LABEL };
