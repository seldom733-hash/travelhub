import { FilterContext } from "./types";
import { TREATMENT_KEYWORDS, DIET_KEYWORDS } from "./keywords";
import { buildKeywordOrConditions, resolveKeywords } from "./helpers";

/** Apply sanatorium-specific filters */
export function applySanatoriumFilters(ctx: FilterContext): void {
  const { searchParams, type, andConditions } = ctx;

  // ── Sanatorium treatment filter ──
  const treatments = searchParams.getAll("treatment");
  if (treatments.length > 0 && type === "SANATORIUM") {
    const treatKeywordArrays = resolveKeywords(treatments, TREATMENT_KEYWORDS);
    if (treatKeywordArrays.length > 0) {
      andConditions.push({ OR: buildKeywordOrConditions(treatKeywordArrays) });
    }
  }

  // ── Sanatorium diet filter ──
  const diets = searchParams.getAll("diet");
  if (diets.length > 0 && type === "SANATORIUM") {
    const dietKeywordArrays = resolveKeywords(diets, DIET_KEYWORDS);
    if (dietKeywordArrays.length > 0) {
      andConditions.push({ OR: buildKeywordOrConditions(dietKeywordArrays) });
    }
  }

  // ── Sanatorium hasDoctor filter ──
  const hasDoctor = searchParams.getAll("hasDoctor");
  if (hasDoctor.length > 0 && type === "SANATORIUM") {
    andConditions.push({
      OR: [
        { description: { contains: "Имеется врач" } },
        { description: { contains: "Həkim" } },
        { description: { contains: "врач" } },
      ],
    });
  }
}
