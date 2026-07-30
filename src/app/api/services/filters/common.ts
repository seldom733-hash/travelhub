import { regionCountryMap } from "@/lib/regions";
import { FilterContext, ParsedParams } from "./types";
import { AMENITY_MAP, MEAL_KEYWORDS, VISA_KEYWORDS } from "./keywords";
import { buildKeywordOrConditions, resolveKeywords, parseNumericParam } from "./helpers";

/**
 * Apply filters common to ALL service types:
 * type, tourCategory, country, city, region, rating, price, hotTour,
 * amenities, meal, visa, languages, cancellation
 */
export function applyCommonFilters(
  { ctx, params }: { ctx: FilterContext; params: ParsedParams }
): void {
  const { searchParams, type, where, andConditions } = ctx;
  const { countryCodes, cities, region, minPrice, maxPrice, minRating, tourCategory } = params;

  // Type
  if (type) where.type = type;

  // Tour category
  if (tourCategory) where.tourCategory = tourCategory;

  // Country
  if (countryCodes.length > 0) {
    where.countryCode = { in: countryCodes };
  }

  // City
  if (cities.length > 0) {
    where.city = { in: cities };
  }

  // Region
  if (region && countryCodes.length === 0) {
    const regionCountries = regionCountryMap[region];
    if (regionCountries) where.countryCode = { in: regionCountries };
  }

  // Rating
  const rating = parseNumericParam(minRating);
  if (rating !== null) where.rating = { gte: rating };

  // Price
  const parsedMinPrice = parseNumericParam(minPrice);
  const parsedMaxPrice = parseNumericParam(maxPrice);
  if (parsedMinPrice !== null || parsedMaxPrice !== null) {
    where.price = {
      ...(parsedMinPrice !== null ? { gte: parsedMinPrice } : {}),
      ...(parsedMaxPrice !== null ? { lte: parsedMaxPrice } : {}),
    };
  }

  // Hot tour
  const hotTour = searchParams.getAll("hotTour");
  if (hotTour.length > 0) {
    where.isHot = true;
  }

  // ── Amenity-based filters ──
  const amenityValues = searchParams.getAll("amenities");
  const mealValues = searchParams.getAll("meal");
  const waterparkFilter = searchParams.getAll("waterpark");
  const kidsFilter = searchParams.getAll("kids");
  const firstLine = searchParams.getAll("firstLine");
  const allInclusive = searchParams.getAll("allInclusive");

  const amenityNamesToFilter: string[] = [];

  for (const val of amenityValues) {
    const names = AMENITY_MAP[val];
    if (names) amenityNamesToFilter.push(...names);
  }
  for (const val of waterparkFilter) {
    const names = AMENITY_MAP[val] || AMENITY_MAP["waterpark"];
    if (names) amenityNamesToFilter.push(...names);
  }
  for (const val of kidsFilter) {
    const names = AMENITY_MAP[val] || AMENITY_MAP["kids"];
    if (names) amenityNamesToFilter.push(...names);
  }
  for (const val of firstLine) {
    const names = AMENITY_MAP[val] || AMENITY_MAP["first_line"];
    if (names) amenityNamesToFilter.push(...names);
  }
  for (const val of allInclusive) {
    const names = AMENITY_MAP[val] || AMENITY_MAP["all_inclusive"];
    if (names) amenityNamesToFilter.push(...names);
  }
  // Breakfast from meal filters
  for (const val of mealValues) {
    if (val === "breakfast") {
      amenityNamesToFilter.push(...(AMENITY_MAP["breakfast"] || []));
    }
  }

  if (amenityNamesToFilter.length > 0) {
    andConditions.push({
      amenities: { some: { name: { in: amenityNamesToFilter } } },
    });
  }

  // ── Meal filter ──
  if (mealValues.length > 0) {
    const mealKeywordArrays = mealValues
      .map(v => MEAL_KEYWORDS[v])
      .filter(Boolean);
    if (mealKeywordArrays.length > 0) {
      const mealOrConditions = mealKeywordArrays.map(keywords => ({
        OR: [
          { description: { contains: keywords[0] } },
          { amenities: { some: { name: { in: keywords } } } },
        ],
      }));
      andConditions.push({ OR: mealOrConditions });
    }
  }

  // ── Visa filter ──
  const visa = searchParams.getAll("visa");
  if (visa.length > 0) {
    const visaKeywordArrays = visa.map(v => VISA_KEYWORDS[v]).filter(Boolean);
    if (visaKeywordArrays.length > 0) {
      const visaOrConditions = visaKeywordArrays.map(keywords => ({
        OR: keywords.map(kw => ({ description: { contains: kw } })),
      }));
      andConditions.push({ OR: visaOrConditions });
    }
  }

  // ── Language filter ──
  const languages = searchParams.getAll("language");
  if (languages.length > 0) {
    andConditions.push({
      OR: languages.map(lang => ({
        languages: { contains: lang.toUpperCase() },
      })),
    });
  }

  // ── Cancellation filter ──
  const cancellation = searchParams.getAll("cancellation");
  if (cancellation.length > 0) {
    andConditions.push({
      freeCancellation: true,
    });
  }

  // ── Start date filter (availability) ──
  const startDate = searchParams.get("startDate");
  if (startDate) {
    andConditions.push({
      schedules: {
        some: {
          date: { gte: new Date(startDate) },
          available: true,
        },
      },
    });
  }
}
