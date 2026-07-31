import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-helpers";
import type { ServiceType, TourCategory } from "@prisma/client";

export interface MultiDayHotel {
  hotelName?: string;
  hotelClass?: number;
  roomType?: string;
  mealPlan?: string;
}

export interface MultiDayFlight {
  depCity?: string;
  depCode?: string | null;
  depTime?: string;
  arrCity?: string;
  arrCode?: string | null;
  arrTime?: string;
  retDepTime?: string;
  retArrTime?: string;
}

export interface MultiDayTransfer {
  included?: boolean;
  type?: string;
}

export interface CreateServiceBody {
  title: string;
  description: string;
  type: ServiceType;
  price: number;
  city: string;
  country: string;
  countryCode?: string;
  images?: string;
  amenities?: string[];
  tourCategory?: TourCategory;
  duration?: string;
  multiDay?: {
    hotel?: MultiDayHotel;
    flight?: MultiDayFlight;
    transfer?: MultiDayTransfer;
  };
}

/**
 * Create a new service (POST /api/services).
 * Handles auth, validation, and transactional creation with multi-day details.
 */
export async function createService(request: NextRequest) {
  try {
    const { prisma } = await import("@/lib/prisma");
    const auth = await requireAdmin(request, ["PARTNER"]);
    if (auth.response) return auth.response;
    const payload = auth.payload;

    const raw = await request.json();
    if (!raw || typeof raw !== "object") {
      return NextResponse.json({ error: "Неверный формат запроса" }, { status: 400 });
    }

    const { title, description, type, price, city, country, countryCode, images, amenities, tourCategory, duration, multiDay } = raw as CreateServiceBody;

    // ── Required field validation ──
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "Поле 'title' обязательно и должно быть строкой" }, { status: 400 });
    }
    if (!description || typeof description !== "string") {
      return NextResponse.json({ error: "Поле 'description' обязательно и должно быть строкой" }, { status: 400 });
    }
    if (!type || typeof type !== "string") {
      return NextResponse.json({ error: "Поле 'type' обязательно и должно быть строкой" }, { status: 400 });
    }
    const VALID_TYPES = ["TOUR", "HOTEL", "SANATORIUM", "EXCURSION", "GUIDE", "PHOTOGRAPHER", "TRANSFER", "FLIGHT", "TRAIN"];
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: `Неверный тип услуги. Допустимые: ${VALID_TYPES.join(", ")}` }, { status: 400 });
    }
    if (price === undefined || price === null || typeof price !== "number" || isNaN(price) || price <= 0) {
      return NextResponse.json({ error: "Поле 'price' обязательно и должно быть положительным числом" }, { status: 400 });
    }
    if (!city || typeof city !== "string") {
      return NextResponse.json({ error: "Поле 'city' обязательно и должно быть строкой" }, { status: 400 });
    }
    if (!country || typeof country !== "string") {
      return NextResponse.json({ error: "Поле 'country' обязательно и должно быть строкой" }, { status: 400 });
    }

    // ── Optional field validation ──
    if (countryCode !== undefined && (typeof countryCode !== "string" || countryCode.length > 5)) {
      return NextResponse.json({ error: "Поле 'countryCode' должно быть строкой до 5 символов" }, { status: 400 });
    }
    if (images !== undefined && typeof images !== "string") {
      return NextResponse.json({ error: "Поле 'images' должно быть строкой" }, { status: 400 });
    }
    if (amenities !== undefined && (!Array.isArray(amenities) || !amenities.every((a: unknown) => typeof a === "string"))) {
      return NextResponse.json({ error: "Поле 'amenities' должно быть массивом строк" }, { status: 400 });
    }
    const VALID_CATEGORIES = ["ONE_DAY", "MULTI_DAY"];
    if (tourCategory !== undefined && !VALID_CATEGORIES.includes(tourCategory)) {
      return NextResponse.json({ error: `Неверная категория тура. Допустимые: ${VALID_CATEGORIES.join(", ")}` }, { status: 400 });
    }
    if (duration !== undefined && typeof duration !== "string") {
      return NextResponse.json({ error: "Поле 'duration' должно быть строкой" }, { status: 400 });
    }
    if (title.length > 200) {
      return NextResponse.json({ error: "Поле 'title' не может превышать 200 символов" }, { status: 400 });
    }
    if (description.length > 5000) {
      return NextResponse.json({ error: "Поле 'description' не может превышать 5000 символов" }, { status: 400 });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, "-").replace(/^-|-$/g, "");

    // Use transaction for atomicity — service + multi-day details created together
    const service = await prisma.$transaction(async (tx) => {
      const svc = await tx.service.create({
        data: {
          title,
          slug: `${slug}-${Date.now()}`,
          description,
          type,
          price,
          city,
          country,
          countryCode: countryCode || "",
          images: images || "",
          providerId: payload.userId,
          tourCategory: tourCategory || undefined,
          duration: duration || undefined,
          amenities: amenities ? { create: amenities.map((name: string) => ({ name })) } : undefined,
        },
        include: { amenities: true },
      });

      if (multiDay && type === "TOUR") {
        const { hotel, flight, transfer } = multiDay;

        if (hotel) {
          await tx.tourHotel.create({
            data: {
              serviceId: svc.id,
              hotelName: hotel.hotelName || "",
              hotelClass: hotel.hotelClass || 4,
              roomType: hotel.roomType || "Standard",
              mealPlan: hotel.mealPlan || "BB",
              description: `${hotel.roomType || "Standard"} в ${hotel.hotelName || "Отель"}`,
            },
          });
        }

        if (flight) {
          await tx.flightDetail.createMany({
            data: [
              {
                serviceId: svc.id,
                airline: null,
                flightNumber: null,
                departureCity: flight.depCity || "",
                departureCode: flight.depCode || null,
                departureTime: flight.depTime || "08:00",
                arrivalCity: flight.arrCity || "",
                arrivalCode: flight.arrCode || null,
                arrivalTime: flight.arrTime || "12:00",
                returnFlight: false,
                sortOrder: 0,
              },
              {
                serviceId: svc.id,
                airline: null,
                flightNumber: null,
                departureCity: flight.arrCity || "",
                departureCode: flight.arrCode || null,
                departureTime: flight.retDepTime || "16:00",
                arrivalCity: flight.depCity || "",
                arrivalCode: flight.depCode || null,
                arrivalTime: flight.retArrTime || "20:00",
                returnFlight: true,
                sortOrder: 1,
              },
            ],
          });
        }

        if (transfer) {
          await tx.transferDetail.create({
            data: {
              serviceId: svc.id,
              included: transfer.included ?? true,
              type: transfer.type || "standard",
              description: transfer.included
                ? `Трансфер ${transfer.type}: аэропорт ↔ отель`
                : "Трансфер не включён",
              fromPlace: "Аэропорт",
              toPlace: hotel?.hotelName || "Отель",
            },
          });
        }
      }

      return svc;
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    console.error("Service create error:", error);
    return NextResponse.json({ error: "Ошибка сервера при создании услуги" }, { status: 500 });
  }
}
