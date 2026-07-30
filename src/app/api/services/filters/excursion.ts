import { FilterContext } from "./types";
import {
  EXCURSION_CATEGORY_KEYWORDS,
  EXCURSION_TRANSPORT_KEYWORDS,
  EXCURSION_TYPE_KEYWORDS,
  EXCURSION_DURATION_KEYWORDS,
} from "./keywords";
import { buildKeywordOrConditions, resolveKeywords } from "./helpers";

/** Apply excursion-specific filters */
export function applyExcursionFilters(ctx: FilterContext): void {
  const { searchParams, type, andConditions } = ctx;
  const tourTypes = searchParams.getAll("tourType");

  // ── Excursion transport type (tourType param for excursion uses different keywords) ──
  if (type === "EXCURSION" && tourTypes.length > 0) {
    const transportKeywordArrays = resolveKeywords(tourTypes, EXCURSION_TRANSPORT_KEYWORDS);
    if (transportKeywordArrays.length > 0) {
      andConditions.push({ OR: buildKeywordOrConditions(transportKeywordArrays) });
    }
  }

  // ── Excursion category ──
  const excursionCategory = searchParams.getAll("category");
  if (excursionCategory.length > 0 && type === "EXCURSION") {
    const catKeywordArrays = resolveKeywords(excursionCategory, EXCURSION_CATEGORY_KEYWORDS);
    if (catKeywordArrays.length > 0) {
      andConditions.push({ OR: buildKeywordOrConditions(catKeywordArrays) });
    }
  }

  // ── Excursion type (group/individual) ──
  const excursionTypes = searchParams.getAll("excursionType");
  if (excursionTypes.length > 0 && type === "EXCURSION") {
    const excKeywordArrays = resolveKeywords(excursionTypes, EXCURSION_TYPE_KEYWORDS);
    if (excKeywordArrays.length > 0) {
      andConditions.push({ OR: buildKeywordOrConditions(excKeywordArrays) });
    }
  }

  // ── Duration filter (uses shared keyword map from keywords.ts) ──
  const durations = searchParams.getAll("duration");
  if (durations.length > 0 && type === "EXCURSION") {
    const durationKeywordArrays = resolveKeywords(durations, EXCURSION_DURATION_KEYWORDS);
    if (durationKeywordArrays.length > 0) {
      andConditions.push({ OR: buildKeywordOrConditions(durationKeywordArrays, ["duration"]) });
    }
  }

  // ── Tickets included filter ──
  const ticketsIncluded = searchParams.getAll("ticketsIncluded");
  if (ticketsIncluded.length > 0 && type === "EXCURSION") {
    andConditions.push({ description: { contains: "билет" } });
  }
}
