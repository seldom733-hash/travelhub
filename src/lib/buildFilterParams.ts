import type { FilterState } from "@/components/FilterSidebar";

/**
 * Build URLSearchParams for /api/services from filter state.
 * Ensures ALL filter values are forwarded as separate params (getAll-compatible).
 */
export function buildFilterParams(
  filterState: FilterState,
  opts: {
    type: string;
    page: number;
    limit?: string;
    sortBy: string;
    /** Additional params (e.g. tourCategory for tours) */
    extra?: Record<string, string>;
  }
): URLSearchParams {
  const { type, page, limit = "9", sortBy, extra } = opts;
  const params = new URLSearchParams({ type, page: String(page), limit, sort: sortBy });

  // Price
  if (filterState._price) {
    const [min, max] = filterState._price as [number, number];
    params.set("minPrice", String(min));
    params.set("maxPrice", String(max));
  }

  // Rating
  if (filterState._rating) {
    params.set("minRating", String(filterState._rating));
  }

  // Countries
  const countries = filterState._countries as string[] | undefined;
  if (countries && countries.length > 0) {
    countries.forEach(v => params.append("countryCode", v));
  }

  // Cities
  const cities = filterState._cities as string[] | undefined;
  if (cities && cities.length > 0) {
    cities.forEach(v => params.append("city", v));
  }

  // Region (tours)
  if (filterState._region) {
    params.set("region", filterState._region as string);
  }

  // ALL non-underscore array filters (generic forwarding)
  Object.entries(filterState).forEach(([key, val]) => {
    if (key.startsWith("_") || !Array.isArray(val) || val.length === 0) return;
    (val as string[]).forEach(v => params.append(key, v));
  });

  // Extra params (e.g. tourCategory)
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
  }

  return params;
}
