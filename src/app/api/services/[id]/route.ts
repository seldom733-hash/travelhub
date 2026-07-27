export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { prisma } = await import("@/lib/prisma");
    const { id } = await params;

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            companyName: true,
            avatar: true,
            role: true,
          },
        },
        amenities: true,
        flightDetails: { orderBy: { sortOrder: "asc" } },
        tourHotels: { orderBy: { sortOrder: "asc" } },
        transferDetails: { orderBy: { sortOrder: "asc" } },
        reviews: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        schedules: {
          select: { date: true, available: true, slots: true },
          where: {
            date: { gte: new Date() },
          },
          orderBy: { date: "asc" },
          take: 90,
        },
        _count: {
          select: { reviews: true, bookings: true },
        },
      },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // Convert comma-separated strings back to arrays for SQLite compatibility
    const mappedService = {
      ...service,
      images: typeof service.images === 'string' ? (service.images as string).split(',').filter(Boolean) : service.images,
      languages: typeof service.languages === 'string' ? (service.languages as string).split(',').filter(Boolean) : service.languages,
    };

    return NextResponse.json({ service: mappedService });
  } catch (error) {
    console.error("Service fetch error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
