export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { regionCountryMap } from "@/lib/regions";
import { countriesDatabase, getCountryName } from "@/lib/countries-data";

export async function GET(request: NextRequest) {
  try {
    const { prisma } = await import("@/lib/prisma");
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const region = searchParams.get("region");
    const locale = searchParams.get("locale") || "ru";

    // Build a lookup map: countryCode -> localized name
    const codeToName: Record<string, string> = {};
    countriesDatabase.forEach(c => {
      codeToName[c.code] = getCountryName(c, locale as "ru" | "en" | "az");
    });

    // If region is specified, return countries from the shared mapping
    if (region && regionCountryMap[region]) {
      const regionCountryCodes = regionCountryMap[region];

      const where: Record<string, unknown> = { isActive: true };
      if (type) where.type = type;
      where.countryCode = { in: regionCountryCodes };

      const result = await prisma.service.groupBy({
        by: ["countryCode"],
        where,
        _count: { countryCode: true },
        orderBy: { _count: { countryCode: "desc" } },
      });

      const dbCounts = new Map(result.map(r => [r.countryCode, r._count.countryCode]));
      const countries = regionCountryCodes
        .map(code => ({
          code,
          name: codeToName[code] || code,
          count: dbCounts.get(code) || 0,
          available: (dbCounts.get(code) || 0) > 0,
        }))
        .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));

      return NextResponse.json({ countries });
    }

    // Fallback: return all countries from DB
    const where: Record<string, unknown> = { isActive: true };
    if (type) where.type = type;

    const result = await prisma.service.groupBy({
      by: ["countryCode"],
      where,
      _count: { countryCode: true },
      orderBy: { _count: { countryCode: "desc" } },
    });

    const countries = result
      .filter((r) => r.countryCode && r.countryCode.trim() !== "")
      .map((r) => ({
        code: r.countryCode,
        name: codeToName[r.countryCode] || r.countryCode,
        count: r._count.countryCode,
        available: true,
      }))
      .filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));

    return NextResponse.json({ countries });
  } catch (error) {
    console.error("Countries fetch error:", error);
    return NextResponse.json({ countries: [] });
  }
}
