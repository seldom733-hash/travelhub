export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Неверный токен" }, { status: 401 });

    const { prisma } = await import("@/lib/prisma");

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, firstName: true, lastName: true, level: true, bonusPoints: true },
    });

    if (!user) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });

    const transactions = await prisma.loyaltyTransaction.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const achievements = await prisma.userAchievement.findMany({
      where: { userId: payload.userId },
      include: { achievement: true },
    });

    return NextResponse.json({
      user: { level: user.level, bonusPoints: user.bonusPoints },
      transactions,
      achievements: achievements.map((ua) => ({
        ...ua.achievement,
        unlockedAt: ua.unlockedAt,
        unlocked: true,
      })),
    });
  } catch (error) {
    console.error("Loyalty fetch error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
