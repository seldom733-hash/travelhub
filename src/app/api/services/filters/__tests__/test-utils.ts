import type { FilterContext, ParsedParams } from "../types";

/** Create a minimal FilterContext for testing */
export function createFilterContext(
  params: Record<string, string | string[]> = {},
  type: string | null = null
): { ctx: FilterContext; params: ParsedParams } {
  const sp = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (Array.isArray(val)) {
      val.forEach(v => sp.append(key, v));
    } else {
      sp.set(key, val);
    }
  }

  const countryCodes = sp.getAll("countryCode");
  const cities = sp.getAll("city");
  const region = sp.get("region");
  const minPrice = sp.get("minPrice");
  const maxPrice = sp.get("maxPrice");
  const minRating = sp.get("minRating");
  const tourCategory = sp.get("tourCategory");
  const sort = sp.get("sort") || "popular";
  const page = parseInt(sp.get("page") || "1");
  const limit = parseInt(sp.get("limit") || "12");

  const where: Record<string, unknown> = { isActive: true };
  const andConditions: Record<string, unknown>[] = [];

  return {
    ctx: { searchParams: sp, type, andConditions, where },
    params: { countryCodes, cities, region, minPrice, maxPrice, minRating, tourCategory, sort, page, limit },
  };
}
