import { FilterContext } from "./types";
import { TOUR_TYPE_KEYWORDS } from "./keywords";
import { buildKeywordOrConditions, resolveKeywords, parseNightsRange, parseNumericArray } from "./helpers";

/** Apply tour-specific filters */
export function applyTourFilters(ctx: FilterContext): void {
  const { searchParams, type, andConditions } = ctx;

  // ── Tour type filter (for TOUR type only) ──
  const tourTypes = searchParams.getAll("tourType");
  if (tourTypes.length > 0 && type === "TOUR") {
    const ttKeywordArrays = resolveKeywords(tourTypes, TOUR_TYPE_KEYWORDS);
    if (ttKeywordArrays.length > 0) {
      andConditions.push({ OR: buildKeywordOrConditions(ttKeywordArrays) });
    }
  }

  // ── Nights filter (for tours) ──
  const nights = searchParams.getAll("nights");
  if (nights.length > 0) {
    andConditions.push({ tourCategory: "MULTI_DAY" });
    // Filter by actual night count using the nights Int? field in Prisma
    const nightsConditions = nights
      .map(parseNightsRange)
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .map(range => ({ nights: { gte: range.gte, lte: range.lte } }));
    if (nightsConditions.length > 0) {
      andConditions.push({ OR: nightsConditions });
    }
  }

  // ── Stars filter (for multi-day tours with tourHotels) ──
  const stars = searchParams.getAll("stars");
  if (stars.length > 0) {
    const starNums = parseNumericArray(stars, 1, 5);
    if (starNums.length > 0) {
      andConditions.push({
        tourHotels: { some: { hotelClass: { in: starNums } } },
      });
    }
  }
}
