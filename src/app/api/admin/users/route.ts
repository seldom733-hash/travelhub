export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, parsePaginationParams } from "@/lib/admin-helpers";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, ["ADMIN"]);
  if (auth.response) return auth.response;

  try {
    const { prisma } = await import("@/lib/prisma");
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";
    const role = url.searchParams.get("role") || "";
    const status = url.searchParams.get("status") || "";
    const { page, limit, skip } = parsePaginationParams(url.searchParams, { limit: 20 });

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (role && role !== "ALL") {
      where.role = role;
    }

    if (status === "active") {
      where.isActive = true;
    } else if (status === "banned") {
      where.isActive = false;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          isVerified: true,
          bonusPoints: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: { bookings: true, reviews: true, services: true, favorites: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Spent per user (completed bookings) — safe fallback
    let spentMap: Map<string, number> = new Map();
    try {
      const userIds = users.map((u: any) => u.id);
      if (userIds.length > 0) {
        const spentRaw = await prisma.$queryRawUnsafe<{ user_id: string; total: bigint }[]>(
          `SELECT b.user_id, SUM(b.total_price) as total
           FROM bookings b
           WHERE b.user_id = ANY($1) AND b.status = 'COMPLETED'
           GROUP BY b.user_id`,
          userIds
        );
        spentMap = new Map(spentRaw.map((r) => [r.user_id, Number(r.total || 0)]));
      }
    } catch (e) {
      console.error("Spent per user error:", e);
    }

    return NextResponse.json({
      users: users.map((u: any) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phone: u.phone,
        role: u.role,
        isActive: u.isActive,
        isVerified: u.isVerified,
        bonusPoints: u.bonusPoints,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        bookingsCount: u._count.bookings,
        reviewsCount: u._count.reviews,
        servicesCount: u._count.services,
        favoritesCount: u._count.favorites,
        spent: spentMap.get(u.id) || 0,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin users list error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
