export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";

// GET — экспорт вариантов цен в CSV
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { prisma } = await import("@/lib/prisma");
    const auth = await requireAdmin(request, ["PARTNER"]);
    if (auth.response) return auth.response;
    const payload = auth.payload;

    const service = await prisma.service.findUnique({ where: { id }, select: { providerId: true, type: true } });
    if (!service || service.providerId !== payload.userId) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }

    const variants = await prisma.servicePriceVariant.findMany({
      where: { serviceId: id },
      orderBy: [{ dateFrom: "asc" }, { roomType: "asc" }, { guestsAdults: "asc" }],
    });

    // Build CSV
    const headers = ["dateFrom", "dateTo", "roomType", "mealPlan", "guestsAdults", "guestsChildren", "childAgeFrom", "childAgeTo", "nights", "pricePerPerson", "availableSlots"];
    const lines = [headers.join(",")];

    for (const v of variants) {
      const row = [
        v.dateFrom.toISOString().split("T")[0],
        v.dateTo.toISOString().split("T")[0],
        v.roomType || "",
        v.mealPlan || "",
        String(v.guestsAdults),
        String(v.guestsChildren),
        v.childAgeFrom != null ? String(v.childAgeFrom) : "",
        v.childAgeTo != null ? String(v.childAgeTo) : "",
        v.nights != null ? String(v.nights) : "",
        String(v.pricePerPerson),
        v.availableSlots != null ? String(v.availableSlots) : "",
      ];
      lines.push(row.map((c) => `"${c}"`).join(","));
    }

    const csv = lines.join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="TravelHub_Variants_${id.slice(0, 8)}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
