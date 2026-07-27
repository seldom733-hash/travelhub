import { FilterContext } from "./types";
import { SPEC_KEYWORDS } from "./keywords";
import { buildKeywordOrConditions, resolveKeywords, parseNumericArray } from "./helpers";

/** Apply guide-specific filters */
export function applyGuideFilters(ctx: FilterContext): void {
  const { searchParams, type, andConditions } = ctx;

  // ── Guide/Photographer experience filter (shared) ──
  const experience = searchParams.getAll("experience");
  if (experience.length > 0 && (type === "GUIDE" || type === "PHOTOGRAPHER")) {
    const yearNums = parseNumericArray(experience);
    if (yearNums.length > 0) {
      andConditions.push({
        OR: yearNums.map(y => ({ description: { contains: `${y} лет` } })),
      });
    }
  }

  // ── Guide hasCar filter ──
  const hasCar = searchParams.getAll("hasCar");
  if (hasCar.length > 0 && type === "GUIDE") {
    andConditions.push({ description: { contains: "автомобиль" } });
  }

  // ── Guide hasLicense filter ──
  const hasLicense = searchParams.getAll("hasLicense");
  if (hasLicense.length > 0 && type === "GUIDE") {
    andConditions.push({ description: { contains: "Лицензия" } });
  }

  // ── Guide specialization filter ──
  const specializations = searchParams.getAll("specialization");
  if (specializations.length > 0 && type === "GUIDE") {
    const specKeywordArrays = resolveKeywords(specializations, SPEC_KEYWORDS);
    if (specKeywordArrays.length > 0) {
      andConditions.push({ OR: buildKeywordOrConditions(specKeywordArrays) });
    }
  }
}
