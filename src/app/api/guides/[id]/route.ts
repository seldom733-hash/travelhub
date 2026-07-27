export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { prisma } = await import("@/lib/prisma");
    const { id } = await params;

    // Fetch guide (user with role PARTNER and partnerType GUIDE)
    const guide = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bio: true,
        role: true,
        partnerType: true,
        isVerified: true,
        _count: {
          select: {
            services: true,
            reviews: true,
          },
        },
      },
    });

    if (!guide) {
      return NextResponse.json({ error: "Гид не найден" }, { status: 404 });
    }

    // Fetch guide's services (excursions)
    const services = await prisma.service.findMany({
      where: { providerId: id, isActive: true },
      include: {
        amenities: true,
        _count: { select: { reviews: true, bookings: true } },
      },
      orderBy: { rating: "desc" },
      take: 20,
    });

    // Calculate average rating from services
    const avgRating =
      services.length > 0
        ? services.reduce((sum, s) => sum + s.rating, 0) / services.length
        : 0;

    // Total tourists (bookings count)
    const totalTourists = services.reduce(
      (sum, s) => sum + s._count.bookings,
      0
    );

    // Total reviews
    const totalReviews = services.reduce(
      (sum, s) => sum + s._count.reviews,
      0
    );

    // Collect all unique languages from services
    const languages = [
      ...new Set(services.flatMap((s) => s.languages)),
    ];

    return NextResponse.json({
      guide: {
        ...guide,
        rating: Math.round(avgRating * 10) / 10,
        totalTourists,
        totalReviews,
        languages,
      },
      services,
    });
  } catch (error) {
    console.error("Guide fetch error:", error);
    return NextResponse.json(
      { error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}
