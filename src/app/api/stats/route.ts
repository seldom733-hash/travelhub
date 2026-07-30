import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { prisma } = await import("@/lib/prisma");

    const [
      tours,
      hotels,
      sanatoriums,
      excursions,
      flights,
      trains,
      guides,
      photographers,
      transfers,
      totalUsers,
      totalPartners,
    ] = await Promise.all([
      prisma.service.count({ where: { type: "TOUR", isActive: true } }),
      prisma.service.count({ where: { type: "HOTEL", isActive: true } }),
      prisma.service.count({ where: { type: "SANATORIUM", isActive: true } }),
      prisma.service.count({ where: { type: "EXCURSION", isActive: true } }),
      prisma.service.count({ where: { type: "FLIGHT", isActive: true } }),
      prisma.service.count({ where: { type: "TRAIN", isActive: true } }),
      prisma.service.count({ where: { type: "GUIDE", isActive: true } }),
      prisma.service.count({ where: { type: "PHOTOGRAPHER", isActive: true } }),
      prisma.service.count({ where: { type: "TRANSFER", isActive: true } }),
      prisma.user.count(),
      prisma.user.count({ where: { role: "PARTNER" } }),
    ]);

    return NextResponse.json({
      services: { tours, hotels, sanatoriums, excursions, flights, trains, guides, photographers, transfers },
      users: totalUsers,
      partners: totalPartners,
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
