export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, ["ADMIN", "MODERATOR"]);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const { prisma } = await import("@/lib/prisma");

    const partner = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        companyName: true,
        partnerType: true,
        language: true,
        currency: true,
        level: true,
        bonusPoints: true,
        isVerified: true,
        isActive: true,
        bio: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!partner) {
      return NextResponse.json({ error: "Партнёр не найден" }, { status: 404 });
    }

    // ── Services ──
    let services: any[] = [];
    try {
      services = await prisma.service.findMany({
        where: { providerId: id },
        select: {
          id: true,
          title: true,
          type: true,
          price: true,
          currency: true,
          city: true,
          country: true,
          countryCode: true,
          rating: true,
          reviewCount: true,
          isActive: true,
          isFeatured: true,
          createdAt: true,
          images: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    } catch (e) {
      console.error("Partner services error:", e);
    }

    // ── Bookings / sales ──
    let bookings: any[] = [];
    try {
      bookings = await prisma.booking.findMany({
        where: { service: { providerId: id } },
        select: {
          id: true,
          status: true,
          totalPrice: true,
          serviceFee: true,
          currency: true,
          checkIn: true,
          checkOut: true,
          guests: true,
          createdAt: true,
          user: { select: { firstName: true, lastName: true, email: true } },
          service: { select: { id: true, title: true, type: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      });
    } catch (e) {
      console.error("Partner bookings error:", e);
    }

    // ── Reviews on partner's services ──
    let reviews: any[] = [];
    try {
      reviews = await prisma.review.findMany({
        where: { service: { providerId: id } },
        select: {
          id: true,
          rating: true,
          title: true,
          text: true,
          isVerified: true,
          createdAt: true,
          user: { select: { firstName: true, lastName: true, avatar: true } },
          service: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    } catch (e) {
      console.error("Partner reviews error:", e);
    }

    // ── Finance ──
    let finance = { totalRevenue: 0, completedBookings: 0, totalBookings: 0, serviceFees: 0, avgCheck: 0 };
    try {
      const completed = bookings.filter((b) => b.status === "COMPLETED");
      const revenue = completed.reduce((s, b) => s + Number(b.totalPrice || 0), 0);
      const fees = bookings.reduce((s, b) => s + Number(b.serviceFee || 0), 0);
      finance = {
        totalRevenue: revenue,
        completedBookings: completed.length,
        totalBookings: bookings.length,
        serviceFees: fees,
        avgCheck: completed.length ? Math.round(revenue / completed.length) : 0,
      };
    } catch (e) {
      console.error("Partner finance error:", e);
    }

    // ── Audit history ──
    let audit: any[] = [];
    try {
      audit = await prisma.auditLog.findMany({
        where: { OR: [{ targetId: id }, { actorId: id }] },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    } catch (e) {
      console.error("Partner audit error:", e);
    }

    // ── Conversations ──
    let conversations: any[] = [];
    try {
      conversations = await prisma.conversation.findMany({
        where: { participants: { some: { userId: id } } },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          participants: {
            select: { user: { select: { id: true, firstName: true, lastName: true, role: true, avatar: true } } },
          },
          messages: { orderBy: { createdAt: "desc" }, take: 5, select: { id: true, text: true, createdAt: true, senderId: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
      });
    } catch (e) {
      console.error("Partner conversations error:", e);
    }

    // ── Ratings ──
    const avgRating = services.length
      ? Math.round((services.reduce((s, sv) => s + (sv.rating || 0), 0) / services.length) * 10) / 10
      : 0;

    // ── Documents (derived: no dedicated table, reflect verification) ──
    const documents = [
      {
        id: "reg-cert",
        name: "Свидетельство о регистрации",
        status: partner.isVerified ? "verified" : "pending",
        uploadedAt: partner.createdAt,
      },
      {
        id: "tax-cert",
        name: "Налоговая справка",
        status: partner.isVerified ? "verified" : "missing",
        uploadedAt: partner.isVerified ? partner.updatedAt : null,
      },
    ];

    return NextResponse.json({
      partner: {
        ...partner,
        avgRating,
        servicesCount: services.length,
        salesCount: finance.completedBookings,
        finance,
        documents,
      },
      services: services.map((s) => ({ ...s, price: Number(s.price) })),
      bookings: bookings.map((b) => ({ ...b, totalPrice: Number(b.totalPrice), serviceFee: Number(b.serviceFee) })),
      reviews,
      audit,
      conversations,
    });
  } catch (error) {
    console.error("Partner detail error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
