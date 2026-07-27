export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    // Rate limiting: 20 requests per minute per IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    const rateLimit = checkRateLimit(`search:${ip}`, 20, 60000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60" } });
    }

    const { prisma } = await import("@/lib/prisma");
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const type = searchParams.get("type");

    if (!q || q.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const qLower = q.toLowerCase();

    // Detect if query contains a known city — share with AI engine's cityToCountry
    const cities = Object.keys({
      стамбул: 1, анталья: 1, кемер: 1, каппадокия: 1,
      дубай: 1, абудаби: 1, рим: 1, венеция: 1, милан: 1,
      барселона: 1, мадрид: 1, санторини: 1, корфу: 1, крит: 1,
      хургада: 1, шарм: 1, прага: 1, тбилиси: 1, батуми: 1,
      баку: 1, пхукет: 1, паттайя: 1, бангкок: 1, бали: 1,
      париж: 1, москва: 1,
    }).map(c => c.charAt(0).toUpperCase() + c.slice(1));
    const matchedCity = cities.find(c => qLower.includes(c.toLowerCase()));

    const where: Record<string, unknown> = { isActive: true };

    // Filter by selected service type
    if (type && type !== "ALL") {
      where.type = type;
    }

    if (matchedCity) {
      // City is an AND filter — only services in this city
      // Remaining text searched in title/description/country/company
      const remainingText = q.replace(new RegExp(matchedCity, 'gi'), '').trim();
      where.city = matchedCity;
      if (remainingText.length >= 2) {
        where.OR = [
          { title: { contains: remainingText } },
          { description: { contains: remainingText } },
          { provider: { companyName: { contains: remainingText } } },
        ];
      }
    } else {
      where.OR = [
        { title: { contains: q } },
        { city: { contains: q } },
        { country: { contains: q } },
        { description: { contains: q } },
        { provider: { companyName: { contains: q } } },
      ];
    }

    const services = await prisma.service.findMany({
      where,
      select: {
        id: true,
        title: true,
        type: true,
        city: true,
        country: true,
        price: true,
        rating: true,
        images: true,
        discountPrice: true,
        provider: { select: { companyName: true, firstName: true, lastName: true } },
      },
      orderBy: { rating: "desc" },
      take: 10,
    });

    const suggestions = services.map((s) => ({
      id: s.id,
      title: s.title,
      type: s.type,
      city: s.city,
      country: s.country,
      price: Number(s.discountPrice || s.price),
      rating: s.rating,
      image: s.images?.[0] || null,
      providerName: s.provider?.companyName || `${s.provider?.firstName} ${s.provider?.lastName}`,
    }));

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
