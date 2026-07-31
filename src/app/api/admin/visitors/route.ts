import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request, ["ADMIN"]);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all"; // all, registered, anonymous
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    let whereClause = "";
    if (type === "registered") {
      whereClause = "WHERE user_id IS NOT NULL";
    } else if (type === "anonymous") {
      whereClause = "WHERE user_id IS NULL";
    }

    const [visitors, totalResult] = await Promise.all([
      prisma.$queryRawUnsafe<
        {
          session_id: string;
          user_id: string | null;
          ip_address: string | null;
          device: string | null;
          last_view: string;
          view_count: bigint;
          pages_viewed: bigint;
          services_viewed: string[];
        }[]
      >(
        `SELECT
          session_id,
          user_id,
          ip_address,
          device,
          MAX(created_at) as last_view,
          COUNT(*) as view_count,
          COUNT(DISTINCT path) as pages_viewed,
          array_agg(DISTINCT service_id) FILTER (WHERE service_id IS NOT NULL) as services_viewed
        FROM page_views
        ${whereClause}
        GROUP BY session_id, user_id, ip_address, device
        ORDER BY MAX(created_at) DESC
        LIMIT ${limit} OFFSET ${skip}`
      ),
      prisma.$queryRawUnsafe<{ count: bigint }[]>(
        `SELECT COUNT(DISTINCT session_id) as count FROM page_views ${whereClause}`
      ),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    // Enrich registered visitors with user info
    const userIds = visitors.filter((v) => v.user_id).map((v) => v.user_id!);
    const users =
      userIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              companyName: true,
            },
          })
        : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    // Get service titles for services_viewed
    const allServiceIds = [
      ...new Set(visitors.flatMap((v) => v.services_viewed || [])),
    ].filter(Boolean);
    const services =
      allServiceIds.length > 0
        ? await prisma.service.findMany({
            where: { id: { in: allServiceIds } },
            select: { id: true, title: true, type: true },
          })
        : [];
    const serviceMap = new Map(services.map((s) => [s.id, s.title]));

    const enrichedVisitors = visitors.map((v) => ({
      sessionId: v.session_id,
      userId: v.user_id,
      user: v.user_id ? userMap.get(v.user_id) || null : null,
      ipAddress: v.ip_address,
      device: v.device,
      lastView: v.last_view,
      viewCount: Number(v.view_count),
      pagesViewed: Number(v.pages_viewed),
      servicesViewed: (v.services_viewed || [])
        .filter(Boolean)
        .map((id) => ({
          id,
          title: serviceMap.get(id) || "Unknown",
        })),
    }));

    return NextResponse.json({
      visitors: enrichedVisitors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin visitors error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
