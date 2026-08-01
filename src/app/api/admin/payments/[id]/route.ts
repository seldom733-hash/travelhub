import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, ["ADMIN"]);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const { prisma } = await import("@/lib/prisma");

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, phone: true },
            },
            service: {
              select: {
                id: true,
                title: true,
                type: true,
                city: true,
                country: true,
                countryCode: true,
                price: true,
                provider: {
                  select: { id: true, companyName: true, firstName: true, lastName: true, email: true },
                },
              },
            },
            cancellation: true,
            promoCodeRef: { select: { code: true, discount: true, type: true } },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Платёж не найден" }, { status: 404 });
    }

    // ── Audit history for the booking (admin actions: confirm, cancel/refund, voucher) ──
    let audit: any[] = [];
    if (payment.booking?.id) {
      audit = await prisma.auditLog.findMany({
        where: { targetType: "booking", targetId: payment.booking.id },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    }

    return NextResponse.json({
      payment,
      audit: audit.map((log) => ({
        id: log.id,
        actorId: log.actorId,
        actorEmail: log.actorEmail,
        actorRole: log.actorRole,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        reason: log.reason,
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
        createdAt: log.createdAt,
      })),
    });
  } catch (error) {
    console.error("Payment detail error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
