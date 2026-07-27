import { FilterContext } from "./types";
import { GENRE_KEYWORDS } from "./keywords";
import { buildKeywordOrConditions, resolveKeywords } from "./helpers";

/** Apply photographer-specific filters */
export function applyPhotographerFilters(ctx: FilterContext): void {
  const { searchParams, type, andConditions } = ctx;

  // ── Photographer genre filter ──
  const genres = searchParams.getAll("genre");
  if (genres.length > 0 && type === "PHOTOGRAPHER") {
    const genreKeywordArrays = resolveKeywords(genres, GENRE_KEYWORDS);
    if (genreKeywordArrays.length > 0) {
      andConditions.push({ OR: buildKeywordOrConditions(genreKeywordArrays) });
    }
  }
}
