export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const LEVEL_THRESHOLDS = [
  { name: "TRAVELER", min: 0 },
  { name: "EXPLORER", min: 500 },
  { name: "PREMIUM", min: 2000 },
  { name: "ELITE", min: 5000 },
];

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Неверный токен" }, { status: 401 });

    const { prisma } = await import("@/lib/prisma");

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { level: true, bonusPoints: true },
    });

    if (!user) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });

    const currentLevelIndex = LEVEL_THRESHOLDS.findIndex((l) => l.name === user.level);
    const currentLevel = LEVEL_THRESHOLDS[currentLevelIndex] || LEVEL_THRESHOLDS[0];
    const nextLevel = LEVEL_THRESHOLDS[currentLevelIndex + 1];

    const progress = nextLevel
      ? Math.min(100, ((user.bonusPoints - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100)
      : 100;

    return NextResponse.json({
      level: user.level,
      bonusPoints: user.bonusPoints,
      currentLevel: currentLevel.name,
      nextLevel: nextLevel?.name || null,
      progress,
    });
  } catch (error) {
    console.error("Level fetch error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
