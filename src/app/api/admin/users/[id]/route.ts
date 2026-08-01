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

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        partnerType: true,
        companyName: true,
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
        _count: { select: { bookings: true, reviews: true, favorites: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    const [bookings, payments, reviews, favorites, cancellations, audit, activities, conversations] =
      await Promise.all([
        prisma.booking.findMany({
          where: { userId: id },
          select: {
            id: true, status: true, totalPrice: true, serviceFee: true, currency: true,
            checkIn: true, checkOut: true, guests: true, createdAt: true,
            service: { select: { id: true, title: true, type: true, images: true, city: true, country: true } },
          },
          orderBy: { createdAt: "desc" }, take: 100,
        }).catch(() => []),
        prisma.payment.findMany({
          where: { booking: { userId: id } },
          select: { id: true, amount: true, currency: true, method: true, status: true, paidAt: true, createdAt: true, bookingId: true },
          orderBy: { createdAt: "desc" }, take: 100,
        }).catch(() => []),
        prisma.review.findMany({
          where: { userId: id },
          select: { id: true, rating: true, title: true, text: true, createdAt: true, service: { select: { id: true, title: true } } },
          orderBy: { createdAt: "desc" }, take: 100,
        }).catch(() => []),
        prisma.favorite.findMany({
          where: { userId: id },
          select: { id: true, createdAt: true, service: { select: { id: true, title: true, type: true, price: true, city: true, country: true, images: true } } },
          orderBy: { createdAt: "desc" }, take: 100,
        }).catch(() => []),
        prisma.cancellation.findMany({
          where: { booking: { userId: id } },
          select: { id: true, reason: true, refundAmount: true, status: true, createdAt: true, booking: { select: { id: true, service: { select: { title: true } } } } },
          orderBy: { createdAt: "desc" }, take: 100,
        }).catch(() => []),
        prisma.auditLog.findMany({
          where: { OR: [{ targetId: id }, { actorId: id }] },
          orderBy: { createdAt: "desc" }, take: 50,
        }).catch(() => []),
        prisma.userActivity.findMany({
          where: { userId: id },
          orderBy: { createdAt: "desc" }, take: 50,
        }).catch(() => []),
        prisma.conversation.findMany({
          where: { participants: { some: { userId: id } } },
          select: {
            id: true, createdAt: true, updatedAt: true,
            participants: { select: { user: { select: { id: true, firstName: true, lastName: true, role: true } } } },
            messages: { orderBy: { createdAt: "desc" }, take: 5, select: { id: true, text: true, createdAt: true, senderId: true } },
          },
          orderBy: { updatedAt: "desc" }, take: 20,
        }).catch(() => []),
      ]);

    const spent = bookings
      .filter((b) => b.status === "COMPLETED")
      .reduce((s, b) => s + Number(b.totalPrice || 0), 0);

    return NextResponse.json({
      user,
      bookings: bookings.map((b) => ({ ...b, totalPrice: Number(b.totalPrice), serviceFee: Number(b.serviceFee) })),
      payments: payments.map((p) => ({ ...p, amount: Number(p.amount) })),
      reviews,
      favorites: favorites.map((f) => ({ ...f, service: { ...f.service, price: Number(f.service.price) } })),
      cancellations: cancellations.map((c) => ({ ...c, refundAmount: Number(c.refundAmount) })),
      audit,
      activities,
      conversations,
      stats: { bookingsCount: bookings.length, spent, completedCount: bookings.filter((b) => b.status === "COMPLETED").length },
    });
  } catch (error) {
    console.error("User detail error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, ["ADMIN"]);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { action, reason, newRole } = body;

    if (!action || !["ban", "unban", "change_role"].includes(action)) {
      return NextResponse.json({ error: "Неверное действие" }, { status: 400 });
    }

    if (action === "ban" && !reason?.trim()) {
      return NextResponse.json(
        { error: "Причина бана обязательна" },
        { status: 400 }
      );
    }

    if (action === "change_role" && !newRole) {
      return NextResponse.json(
        { error: "Новая роль обязательна" },
        { status: 400 }
      );
    }

    const { prisma } = await import("@/lib/prisma");

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    // Prevent self-ban
    if (action === "ban" && id === auth.payload.userId) {
      return NextResponse.json(
        { error: "Нельзя забанить самого себя" },
        { status: 400 }
      );
    }

    // Prevent banning other ADMINs (server-side, not just UI)
    if (action === "ban" && user.role === "ADMIN") {
      return NextResponse.json(
        { error: "Нельзя забанить другого администратора" },
        { status: 403 }
      );
    }

    // Prevent demoting other ADMINs
    if (action === "change_role" && user.role === "ADMIN" && newRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Нельзя понизить другого администратора" },
        { status: 403 }
      );
    }

    // Prevent demoting yourself
    if (action === "change_role" && id === auth.payload.userId) {
      return NextResponse.json(
        { error: "Нельзя менять свою роль" },
        { status: 400 }
      );
    }

    const now = new Date();
    let updateData: Record<string, any> = {};
    let auditAction = "";

    switch (action) {
      case "ban":
        updateData = { isActive: false };
        auditAction = "ban_user";
        break;
      case "unban":
        updateData = { isActive: true };
        auditAction = "unban_user";
        break;
      case "change_role":
        const validRoles = ["BUYER", "PARTNER", "MODERATOR", "ADMIN"];
        if (!validRoles.includes(newRole)) {
          return NextResponse.json({ error: "Неверная роль" }, { status: 400 });
        }
        updateData = { role: newRole };
        auditAction = "change_role";
        break;
    }

    await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: auth.payload.userId,
        actorEmail: auth.payload.email,
        actorRole: auth.payload.role,
        action: auditAction,
        targetType: "user",
        targetId: id,
        reason: action === "ban" ? reason : null,
        metadata: JSON.stringify({
          userName: `${user.firstName} ${user.lastName}`,
          userEmail: user.email,
          previousValue: action === "change_role" ? user.role : user.isActive,
          newValue: action === "change_role" ? newRole : action === "ban" ? false : true,
        }),
      },
    });

    // Notify user about the action
    let notifTitle = "";
    let notifDesc = "";
    switch (action) {
      case "ban":
        notifTitle = "🔇 Ваш аккаунт заблокирован";
        notifDesc = `Ваш аккаунт был заблокирован администратором. Причина: ${reason}`;
        break;
      case "unban":
        notifTitle = "🔊 Ваш аккаунт разблокирован";
        notifDesc = "Ваш аккаунт был разблокирован администратором. Добро пожаловать обратно!";
        break;
      case "change_role":
        notifTitle = "🔄 Изменена роль аккаунта";
        notifDesc = `Ваша роль изменена с «${user.role}» на «${newRole}» администратором.`;
        break;
    }

    if (notifTitle) {
      await prisma.notification.create({
        data: {
          type: "SYSTEM",
          title: notifTitle,
          description: notifDesc,
          link: "/",
          userId: id,
        },
      });
    }

    return NextResponse.json({ success: true, action, user: { id, ...updateData } });
  } catch (error) {
    console.error("Admin user management error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
