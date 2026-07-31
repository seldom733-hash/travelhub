export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, ["ADMIN", "MODERATOR"]);
  if (auth.response) return auth.response;

  try {
    const { prisma } = await import("@/lib/prisma");
    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "PENDING";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where = status === "ALL" ? {} : { moderationStatus: status as any };

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        include: {
          provider: {
            select: { id: true, firstName: true, lastName: true, email: true, companyName: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.service.count({ where }),
    ]);

    return NextResponse.json({
      services: services.map((s) => ({
        id: s.id,
        title: s.title,
        type: s.type,
        city: s.city,
        country: s.country,
        price: Number(s.price),
        rating: s.rating,
        moderationStatus: s.moderationStatus,
        moderationReason: s.moderationReason,
        moderatedAt: s.moderatedAt,
        createdAt: s.createdAt,
        provider: s.provider,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Moderation list error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
