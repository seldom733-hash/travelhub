export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { prisma } = await import("@/lib/prisma");
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, unknown> = { isPublished: true };
    if (category && category !== "Все") where.category = category;

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          category: true,
          authorName: true,
          authorAvatar: true,
          readTime: true,
          publishedAt: true,
          tags: true,
        },
      }),
      prisma.blogPost.count({ where }),
    ]);

    return NextResponse.json({ posts, total });
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
