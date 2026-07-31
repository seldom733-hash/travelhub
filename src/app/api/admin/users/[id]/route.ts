export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";

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
          link: "/dashboard",
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
