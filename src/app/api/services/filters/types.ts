import { NextRequest } from "next/server";

/** Shared context passed to all filter builders */
export interface FilterContext {
  searchParams: URLSearchParams;
  type: string | null;
  andConditions: Record<string, unknown>[];
  where: Record<string, unknown>;
}

/** Parsed query params for a specific service type */
export interface ParsedParams {
  countryCodes: string[];
  cities: string[];
  region: string | null;
  minPrice: string | null;
  maxPrice: string | null;
  minRating: string | null;
  tourCategory: string | null;
  sort: string;
  page: number;
  limit: number;
}

/** Build FilterContext from a NextRequest */
export function buildContext(request: NextRequest): {
  ctx: FilterContext;
  params: ParsedParams;
  type: string | null;
} {
  const { searchParams } = new URL(request.url);

  const type = searchParams.get("type");
  const countryCodes = searchParams.getAll("countryCode");
  const cities = searchParams.getAll("city");
  const region = searchParams.get("region");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const minRating = searchParams.get("minRating");
  const tourCategory = searchParams.get("tourCategory");
  const sort = searchParams.get("sort") || "popular";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "12");

  const where: Record<string, unknown> = { isActive: true };
  const andConditions: Record<string, unknown>[] = [];

  return {
    ctx: { searchParams, type, andConditions, where },
    params: { countryCodes, cities, region, minPrice, maxPrice, minRating, tourCategory, sort, page, limit },
    type,
  };
}
