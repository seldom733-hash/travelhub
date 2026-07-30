import { FilterContext } from "./types";
import { ROOM_TYPE_MAP, BED_TYPE_MAP, VIEW_MAP, SMOKING_MAP, BALCONY_MAP, BATHROOM_MAP, ROOM_AMENITIES_MAP } from "./keywords";
import { parseNumericArray } from "./helpers";

/** Apply hotel-specific filters */
export function applyHotelFilters(ctx: FilterContext): void {
  const { searchParams, andConditions } = ctx;

  // ── Stars filter ──
  const stars = searchParams.getAll("stars");
  if (stars.length > 0) {
    const hasNone = stars.includes("none");
    const starNums = parseNumericArray(stars.filter(s => s !== "none"), 1, 5);
    const starConditions: Record<string, unknown>[] = [];

    if (hasNone) {
      starConditions.push({
        AND: [
          { NOT: { description: { contains: "★" } } },
          { tourHotels: { none: {} } },
        ],
      });
    }
    if (starNums.length > 0) {
      for (const n of starNums) {
        starConditions.push({
          OR: [
            { tourHotels: { some: { hotelClass: { equals: n } } } },
            {
              AND: [
                { description: { startsWith: "★".repeat(n) } },
                ...(n < 5 ? [{ description: { not: { startsWith: "★".repeat(n + 1) } } }] : []),
              ],
            },
          ],
        });
      }
    }
    if (starConditions.length > 0) {
      andConditions.push({ OR: starConditions });
    }
  }

  // ── Room type filter ──
  const roomTypes = searchParams.getAll("roomType");
  if (roomTypes.length > 0) {
    const rtDescKeywords = roomTypes.flatMap(
      rt => ROOM_TYPE_MAP[rt] || [rt.charAt(0).toUpperCase() + rt.slice(1)]
    );
    andConditions.push({
      OR: [
        { roomTypes: { some: { slug: { in: roomTypes } } } },
        { tourHotels: { some: { roomType: { in: roomTypes.map(rt => ROOM_TYPE_MAP[rt]?.[1] || rt.charAt(0).toUpperCase() + rt.slice(1)) } } } },
        ...rtDescKeywords.map(kw => ({ description: { contains: kw } })),
      ],
    });
  }

  // ── Bed type filter ──
  const bedTypes = searchParams.getAll("bedType");
  if (bedTypes.length > 0) {
    const bedDescKeywords = bedTypes.flatMap(rt => BED_TYPE_MAP[rt] || []);
    andConditions.push({
      OR: [
        { roomTypes: { some: { bedType: { in: bedTypes } } } },
        ...bedDescKeywords.map(kw => ({ description: { contains: kw } })),
      ],
    });
  }

  // ── View filter ──
  const views = searchParams.getAll("view");
  if (views.length > 0) {
    const viewDescKeywords = views.flatMap(v => VIEW_MAP[v] || []);
    andConditions.push({
      OR: [
        { roomTypes: { some: { view: { in: views } } } },
        ...viewDescKeywords.map(kw => ({ description: { contains: kw } })),
      ],
    });
  }

  // ── Smoking filter ──
  const smoking = searchParams.getAll("smoking");
  if (smoking.length > 0) {
    const smokingDescKeywords = smoking.flatMap(s => SMOKING_MAP[s] || []);
    andConditions.push({
      OR: [
        { roomTypes: { some: { smoking: { in: smoking } } } },
        ...smokingDescKeywords.map(kw => ({ description: { contains: kw } })),
      ],
    });
  }

  // ── Balcony filter ──
  const balconies = searchParams.getAll("balcony");
  if (balconies.length > 0) {
    const balconyDescKeywords = balconies.flatMap(b => BALCONY_MAP[b] || []);
    andConditions.push({
      OR: [
        { roomTypes: { some: { balcony: { in: balconies } } } },
        ...balconyDescKeywords.map(kw => ({ description: { contains: kw } })),
      ],
    });
  }

  // ── Bathroom filter ──
  const bathrooms = searchParams.getAll("bathroom");
  if (bathrooms.length > 0) {
    const bathDescKeywords = bathrooms.flatMap(b => BATHROOM_MAP[b] || []);
    andConditions.push({
      OR: [
        { roomTypes: { some: { bathroom: { in: bathrooms } } } },
        ...bathDescKeywords.map(kw => ({ description: { contains: kw } })),
      ],
    });
  }

  // ── Area filter ──
  const areas = searchParams.getAll("area");
  if (areas.length > 0) {
    andConditions.push({
      OR: areas.map(a => ({ roomTypes: { some: { area: { equals: a } } } })),
    });
  }

  // ── Occupancy filter ──
  const occupancies = searchParams.getAll("occupancy");
  if (occupancies.length > 0) {
    andConditions.push({
      OR: occupancies.map(o => ({ roomTypes: { some: { occupancy: { equals: o } } } })),
    });
  }

  // ── Room amenities filter ──
  const roomAmenities = searchParams.getAll("roomAmenities");
  if (roomAmenities.length > 0) {
    const raDescKeywords = roomAmenities.flatMap(r => ROOM_AMENITIES_MAP[r] || []);
    andConditions.push({
      OR: raDescKeywords.map(kw => ({ description: { contains: kw } })),
    });
  }

  // ── Pets allowed filter ──
  const petsAllowed = searchParams.getAll("petsAllowed");
  if (petsAllowed.length > 0) {
    andConditions.push({
      OR: [
        { description: { contains: "Можно с животными" } },
        { description: { contains: "pets" } },
      ],
    });
  }
}
