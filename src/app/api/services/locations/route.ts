export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { prisma } = await import("@/lib/prisma");

    const services = await prisma.service.findMany({
      where: { isActive: true, latitude: { not: null }, longitude: { not: null } },
      select: {
        id: true,
        title: true,
        type: true,
        latitude: true,
        longitude: true,
        price: true,
        rating: true,
        images: true,
        city: true,
        country: true,
        discountPrice: true,
      },
    });

    const typeMap: Record<string, string> = {
      HOTEL: "hotel", TOUR: "tour", EXCURSION: "excursion",
      GUIDE: "guide", PHOTOGRAPHER: "photographer", TRANSFER: "transfer",
      SANATORIUM: "hotel", FLIGHT: "tour", TRAIN: "tour",
    };

    const locations = services.map((s) => ({
      id: s.id,
      name: s.title,
      type: typeMap[s.type] || "hotel",
      lat: s.latitude,
      lng: s.longitude,
      price: Number(s.discountPrice || s.price),
      rating: s.rating,
      image: s.images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80",
      city: s.city,
      country: s.country,
    }));

    return NextResponse.json({ locations });
  } catch (error) {
    console.error("Locations fetch error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
