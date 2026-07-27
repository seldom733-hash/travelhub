import { FilterContext } from "./types";
import { ROOM_NAME_MAP } from "./keywords";
import { parseNumericArray } from "./helpers";

/** Apply hotel-specific filters */
export function applyHotelFilters(ctx: FilterContext): void {
  const { searchParams, andConditions } = ctx;

  // ── Stars filter ──
  const stars = searchParams.getAll("stars");
  if (stars.length > 0) {
    const starNums = parseNumericArray(stars, 1, 5);
    if (starNums.length > 0) {
      const starConditions = starNums.map(n => ({
        OR: [
          { tourHotels: { some: { hotelClass: { equals: n } } } },
          {
            AND: [
              { description: { startsWith: "★".repeat(n) } },
              // Exclude higher star counts that also start with n stars
              ...(n < 5 ? [{ description: { not: { startsWith: "★".repeat(n + 1) } } }] : []),
            ],
          },
        ],
      }));
      andConditions.push({ OR: starConditions });
    }
  }

  // ── Room type filter ──
  const roomTypes = searchParams.getAll("roomType");
  if (roomTypes.length > 0) {
    const rtDescKeywords = roomTypes.flatMap(
      rt => ROOM_NAME_MAP[rt] || [rt.charAt(0).toUpperCase() + rt.slice(1)]
    );
    andConditions.push({
      OR: [
        { roomTypes: { some: { slug: { in: roomTypes } } } },
        { tourHotels: { some: { roomType: { in: roomTypes.map(rt => rt.charAt(0).toUpperCase() + rt.slice(1)) } } } },
        ...rtDescKeywords.map(kw => ({ description: { contains: kw } })),
      ],
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
