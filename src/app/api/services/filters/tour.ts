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
    const hasZero = nights.includes("0");
    const nonZeroNights = nights.filter(n => n !== "0");

    if (hasZero && nonZeroNights.length > 0) {
      // Mixed: ONE_DAY + MULTI_DAY → no tourCategory constraint, filter nights for multi-day only
      const nightsConditions = nonZeroNights
        .map(parseNightsRange)
        .filter((r): r is NonNullable<typeof r> => r !== null)
        .map(range => ({ nights: { gte: range.gte, lte: range.lte } }));
      andConditions.push({
        OR: [
          { tourCategory: "ONE_DAY" },
          ...(nightsConditions.length > 0 ? [{ AND: [{ tourCategory: "MULTI_DAY" }, { OR: nightsConditions }] }] : []),
        ],
      });
    } else if (hasZero) {
      // Only 0 nights selected → one-day tours only
      andConditions.push({ tourCategory: "ONE_DAY" });
    } else {
      // Only non-zero nights → multi-day tours only
      andConditions.push({ tourCategory: "MULTI_DAY" });
      const nightsConditions = nonZeroNights
        .map(parseNightsRange)
        .filter((r): r is NonNullable<typeof r> => r !== null)
        .map(range => ({ nights: { gte: range.gte, lte: range.lte } }));
      if (nightsConditions.length > 0) {
        andConditions.push({ OR: nightsConditions });
      }
    }
  }

  // ── Stars filter (for multi-day tours with tourHotels) ──
  const stars = searchParams.getAll("stars");
  if (stars.length > 0) {
    const hasNone = stars.includes("none");
    const starNums = parseNumericArray(stars.filter(s => s !== "none"), 1, 5);
    const starConditions: Record<string, unknown>[] = [];

    if (hasNone) {
      starConditions.push({
        tourHotels: { none: {} },
      });
    }
    if (starNums.length > 0) {
      starConditions.push({
        tourHotels: { some: { hotelClass: { in: starNums } } },
      });
    }
    if (starConditions.length > 0) {
      andConditions.push({ OR: starConditions });
    }
  }
}
