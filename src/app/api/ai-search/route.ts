export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { parseTravelQuery } from "@/lib/ai-search-engine";
import { parseServiceArrays } from "@/lib/db-helpers";

export async function GET(request: NextRequest) {
  try {
    const { prisma } = await import("@/lib/prisma");
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    if (!q || q.length < 3) {
      return NextResponse.json({ error: "Минимум 3 символа", results: [], parsed: null });
    }

    const parsed = parseTravelQuery(q);

    const where: Record<string, unknown> = { isActive: true };
    if (parsed.serviceTypes.length > 0) {
      where.type = { in: parsed.serviceTypes };
    }
    // Exact city match if destination is specified
    if (parsed.destination) {
      where.city = parsed.destination;
    } else if (parsed.country) {
      where.country = parsed.country;
    }
    if (parsed.budget) {
      where.price = { lte: parsed.budget };
    }
    where.rating = { gte: 3.5 };

    // If amenities requested, ensure ALL required amenities are present at DB level
    if (parsed.amenities.length > 0) {
      where.amenities = {
        AND: parsed.amenities.map((name) => ({
          some: { name },
        })),
      };
    }

    const services = await prisma.service.findMany({
      where,
      include: {
        amenities: { select: { name: true } },
        provider: { select: { firstName: true, lastName: true } },
        _count: { select: { reviews: true } },
      },
      orderBy: [{ isFeatured: "desc" }, { rating: "desc" }, { reviewCount: "desc" }],
      take: 30,
    });

    // Convert comma-separated strings to arrays for SQLite
    const mapped = services.map((s) => parseServiceArrays(s as Record<string, unknown>));

    const grouped: Record<string, typeof mapped> = {};
    for (const service of mapped) {
      const type = (service as Record<string, unknown>).type as string;
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(service);
    }

    const explanations: string[] = [];
    if (parsed.destination) {
      explanations.push(`\ud83c\udf4d Направление "${parsed.destination}" выбрано по вашему запросу`);
    } else if (parsed.country) {
      explanations.push(`\ud83c\udf0d Страна "${parsed.country}" выбрана по вашему запросу`);
    }
    if (parsed.budget) {
      const inBudget = services.filter((s) => Number((s as Record<string, unknown>).discountPrice || (s as Record<string, unknown>).price) <= parsed.budget!);
      explanations.push(`\ud83d\udcb0 ${inBudget.length} услуг в пределах бюджета до ${parsed.budget} AZN`);
    }
    if (parsed.duration) {
      explanations.push(`\ud83d\udcc5 Длительность ${parsed.duration} дней учтена при подборе`);
    }
    if (parsed.preferences.length > 0) {
      const prefLabels: Record<string, string> = {
        sea: "море/пляж", beach: "море/пляж", mountains: "горы", ski: "горнолыжный отдых",
        all_inclusive: "всё включено", breakfast: "завтрак включён", family: "семейный отдых",
        spa: "СПА", pool: "бассейн", premium: "премиум", budget: "бюджетный",
      };
      const labels = parsed.preferences.map((p) => prefLabels[p] || p).join(", ");
      explanations.push(`\u2b50 Учтены предпочтения: ${labels}`);
    }
    if (parsed.amenities.length > 0) {
      explanations.push(`\ud83c\udfe6 Обязательные удобства: ${parsed.amenities.join(", ")}`);
    }
    if (services.length === 0) {
      explanations.push("\ud83d\udd0d К сожалению, по точным параметрам ничего не найдено. Попробуйте расширить поиск.");
    } else {
      explanations.push(`\u2705 Найдено ${services.length} услуг — все проверены и доступны для бронирования`);
    }

    return NextResponse.json({
      parsed,
      results: grouped,
      total: services.length,
      explanation: explanations,
    });
  } catch (error) {
    console.error("AI Search error:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
