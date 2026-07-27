export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { prisma } = await import("@/lib/prisma");
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "6");

    const where: Record<string, unknown> = { isActive: true };
    if (type) where.type = type;

    const services = await prisma.service.findMany({
      where,
      include: {
        provider: { select: { id: true, firstName: true, lastName: true } },
        amenities: true,
        _count: { select: { reviews: true } },
      },
      orderBy: [
        { isFeatured: "desc" },
        { isHot: "desc" },
        { rating: "desc" },
      ],
      take: limit,
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error("Featured services fetch error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
