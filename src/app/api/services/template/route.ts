export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

// GET — скачать CSV шаблон для импорта
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "hotel";

    if (type === "hotel") {
      const csv = `dateFrom,dateTo,roomType,guestsAdults,guestsChildren,childAgeFrom,childAgeTo,mealPlan,pricePerPerson,basePrice,childPrice,availableSlots
2025-08-01,2025-08-31,standard,2,0,,,BB,120,240,,5
2025-08-01,2025-08-31,standard,2,1,0,6,BB,130,260,10,5
2025-08-01,2025-08-31,standard,2,2,0,6,HB,155,310,15,3
2025-08-01,2025-08-31,suite,2,0,,,AI,260,520,,2
2025-08-01,2025-08-31,suite,2,1,0,12,AI,280,560,20,2
2025-08-01,2025-08-31,family,2,2,0,12,FB,200,400,25,1
2025-09-01,2025-09-30,standard,2,0,,,BB,98,196,,8
2025-09-01,2025-09-30,standard,2,2,0,6,AI,180,360,20,4`;

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="TravelHub_Hotel_Template.csv"',
        },
      });
    }

    // Tour template
    const csv = `dateFrom,dateTo,nights,roomType,guestsAdults,guestsChildren,childAgeFrom,childAgeTo,mealPlan,pricePerPerson,availableSlots
2025-08-10,2025-08-17,7,standard,2,0,,,AI,980,20
2025-08-10,2025-08-17,7,standard,2,1,5,5,AI,1190,15
2025-08-10,2025-08-17,7,suite,2,0,,,AI,1350,10
2025-08-10,2025-08-17,10,standard,2,0,,,BB,850,25
2025-08-17,2025-08-24,7,standard,2,0,,,AI,920,20
2025-08-24,2025-08-31,7,standard,2,0,,,AI,880,20
2025-09-01,2025-09-08,7,standard,2,0,,,AI,750,30`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="TravelHub_Tour_Template.csv"',
      },
    });
  } catch (error) {
    console.error("Template export error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
