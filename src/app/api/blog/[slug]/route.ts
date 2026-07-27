export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { prisma } = await import("@/lib/prisma");

    const post = await prisma.blogPost.findFirst({
      where: { slug, isPublished: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Статья не найдена" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
