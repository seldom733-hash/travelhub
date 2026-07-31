import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request, ["ADMIN", "MODERATOR"]);
    if (auth.response) return auth.response;

    const { prisma } = await import("@/lib/prisma");

    const [
      totalUsers,
      totalServices,
      pendingServices,
      recentUsers,
      pendingBookings,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.service.count({ where: { isActive: true } }),
      prisma.service.findMany({
        where: { isActive: false },
        take: 5,
        include: { provider: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true,
          isActive: true,
        },
      }),
      prisma.booking.count({ where: { status: "PENDING" } }),
      prisma.booking.aggregate({
        where: { status: "COMPLETED" },
        _sum: { totalPrice: true },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        totalServices,
        pendingBookings,
        totalRevenue: Number(totalRevenue._sum.totalPrice || 0),
      },
      pendingServices: pendingServices.map((s) => ({
        id: s.id,
        type: "Услуга",
        name: s.title,
        partner: `${s.provider.firstName} ${s.provider.lastName}`,
        date: s.createdAt.toISOString(),
        status: "pending",
      })),
      recentUsers: recentUsers.map((u) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        role: u.role,
        date: u.createdAt.toISOString(),
        status: u.isActive ? "active" : "inactive",
      })),
    });
  } catch (error) {
    console.error("Admin API error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
