import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { prisma } = await import("@/lib/prisma");

    const photographer = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        partnerType: true,
        createdAt: true,
        services: {
          where: { isActive: true },
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            currency: true,
            images: true,
            type: true,
            city: true,
            country: true,
            rating: true,
            reviewCount: true,
            duration: true,
          },
          orderBy: { rating: "desc" },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            text: true,
            createdAt: true,
            user: {
              select: { firstName: true, lastName: true, avatar: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!photographer || photographer.partnerType !== "PHOTOGRAPHER") {
      return NextResponse.json({ error: "Фотограф не найден" }, { status: 404 });
    }

    const totalReviews = photographer.reviews.length;
    const avgRating =
      totalReviews > 0
        ? photographer.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    return NextResponse.json({
      photographer: {
        id: photographer.id,
        name: photographer.firstName,
        photo: photographer.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
        city: photographer.services[0]?.city || "Баку",
        country: photographer.services[0]?.country || "Азербайджан",
        bio: photographer.bio || "",
        rating: Math.round(avgRating * 10) / 10,
        reviews: totalReviews,
        experience: Math.floor(
          (Date.now() - photographer.createdAt.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        ),
        services: photographer.services,
        recentReviews: photographer.reviews,
      },
    });
  } catch (error) {
    console.error("Photographer API error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
