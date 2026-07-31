export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request, ["ADMIN", "MODERATOR"]);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { action, reason } = body;

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Неверное действие" }, { status: 400 });
    }

    if (action === "reject" && !reason?.trim()) {
      return NextResponse.json(
        { error: "Причина отклонения обязательна" },
        { status: 400 }
      );
    }

    const { prisma } = await import("@/lib/prisma");

    const service = await prisma.service.findUnique({ where: { id } });
    if (!service) {
      return NextResponse.json({ error: "Услуга не найдена" }, { status: 404 });
    }

    const now = new Date();
    const moderationStatus = action === "approve" ? "APPROVED" : "REJECTED";

    await prisma.service.update({
      where: { id },
      data: {
        moderationStatus: moderationStatus as any,
        moderationReason: action === "reject" ? reason : null,
        moderatedAt: now,
        moderatedById: auth.payload.userId,
        isActive: action === "approve",
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: auth.payload.userId,
        actorEmail: auth.payload.email,
        actorRole: auth.payload.role,
        action: `${action}_service`,
        targetType: "service",
        targetId: id,
        reason: action === "reject" ? reason : null,
        metadata: JSON.stringify({
          serviceTitle: service.title,
          previousStatus: service.moderationStatus,
          newStatus: moderationStatus,
        }),
      },
    });

    // Notify partner about moderation decision
    const notifTitle = action === "approve"
      ? `✅ Услуга одобрена: ${service.title}`
      : `❌ Услуга отклонена: ${service.title}`;
    const notifDesc = action === "approve"
      ? `Ваша услуга «${service.title}» прошла модерацию и теперь доступна на платформе.`
      : `Ваша услуга «${service.title}» не прошла модерацию. Причина: ${reason}`;

    await prisma.notification.create({
      data: {
        type: "SYSTEM",
        title: notifTitle,
        description: notifDesc,
        link: `/services/${id}`,
        userId: service.providerId,
      },
    });

    return NextResponse.json({ success: true, action, moderationStatus });
  } catch (error) {
    console.error("Admin moderation error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
