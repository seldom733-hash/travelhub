export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, ["ADMIN"]);
  if (auth.response) return auth.response;

  try {
    const { prisma } = await import("@/lib/prisma");
    const url = new URL(request.url);
    const action = url.searchParams.get("action") || "";
    const targetType = url.searchParams.get("targetType") || "";
    const actorId = url.searchParams.get("actorId") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const where: any = {};

    if (action && action !== "ALL") {
      where.action = action;
    }

    if (targetType && targetType !== "ALL") {
      where.targetType = targetType;
    }

    if (actorId) {
      where.actorId = actorId;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log.id,
        actorEmail: log.actorEmail,
        actorRole: log.actorRole,
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        reason: log.reason,
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
        createdAt: log.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Audit log error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
