import { describe, it, expect } from "vitest";
import { createFilterContext } from "./test-utils";
import { applyCommonFilters } from "../common";
import { applyHotelFilters } from "../hotel";
import { applyTourFilters } from "../tour";
import { applyExcursionFilters } from "../excursion";
import { applyTransferFilters } from "../transfer";
import { applySanatoriumFilters } from "../sanatorium";
import { applyGuideFilters } from "../guide";
import { applyPhotographerFilters } from "../photographer";
import { parseDurationHours, durationFitsRange, matchesKeywords, resolveKeywords } from "../helpers";

describe("Edge cases — common filters", () => {
  it("discards non-numeric minPrice instead of passing NaN to Prisma", () => {
    const { ctx, params } = createFilterContext({ minPrice: "abc" });
    applyCommonFilters({ ctx, params });
    // Non-numeric values are now discarded — no price condition added
    expect(ctx.where.price).toBeUndefined();
  });

  it("discards non-numeric maxPrice instead of passing NaN to Prisma", () => {
    const { ctx, params } = createFilterContext({ maxPrice: "xyz" });
    applyCommonFilters({ ctx, params });
    expect(ctx.where.price).toBeUndefined();
  });

  it("handles mixed valid and invalid price values", () => {
    const { ctx, params } = createFilterContext({ minPrice: "100", maxPrice: "xyz" });
    applyCommonFilters({ ctx, params });
    // Only valid minPrice is applied
    expect(ctx.where.price).toEqual({ gte: 100 });
  });

  it("handles empty countryCode values", () => {
    const { ctx, params } = createFilterContext({ countryCode: [""] });
    applyCommonFilters({ ctx, params });
    expect(ctx.where.countryCode).toEqual({ in: [""] });
  });

  it("handles empty city values", () => {
    const { ctx, params } = createFilterContext({ city: [""] });
    applyCommonFilters({ ctx, params });
    expect(ctx.where.city).toEqual({ in: [""] });
  });

  it("discards non-numeric minRating instead of passing NaN to Prisma", () => {
    const { ctx, params } = createFilterContext({ minRating: "good" });
    applyCommonFilters({ ctx, params });
    expect(ctx.where.rating).toBeUndefined();
  });

  it("handles unknown amenity values without crashing", () => {
    const { ctx, params } = createFilterContext({ amenities: ["unknown_amenity", "nonexistent"] });
    applyCommonFilters({ ctx, params });
    // No amenity names resolved, so no condition added
    expect(ctx.andConditions).toHaveLength(0);
  });

  it("handles unknown meal values without crashing", () => {
    const { ctx, params } = createFilterContext({ meal: ["unknown_meal"] });
    applyCommonFilters({ ctx, params });
    expect(ctx.andConditions).toHaveLength(0);
  });

  it("handles unknown visa values without crashing", () => {
    const { ctx, params } = createFilterContext({ visa: ["unknown_visa"] });
    applyCommonFilters({ ctx, params });
    expect(ctx.andConditions).toHaveLength(0);
  });

  it("handles multiple identical countryCodes", () => {
    const { ctx, params } = createFilterContext({ countryCode: ["TR", "TR", "TR"] });
    applyCommonFilters({ ctx, params });
    expect(ctx.where.countryCode).toEqual({ in: ["TR", "TR", "TR"] });
  });
});

describe("Edge cases — hotel filters", () => {
  it("handles non-numeric stars (NaN filtering)", () => {
    const { ctx } = createFilterContext({ stars: ["abc", "def"] });
    applyHotelFilters(ctx);
    // NaN is filtered out by .filter(n => !isNaN(n))
    expect(ctx.andConditions).toHaveLength(0);
  });

  it("mixes valid and invalid stars", () => {
    const { ctx } = createFilterContext({ stars: ["4", "abc", "5"] });
    applyHotelFilters(ctx);
    expect(ctx.andConditions).toHaveLength(1);
    const cond = ctx.andConditions[0] as any;
    expect(cond.OR[0]).toEqual({
      tourHotels: { some: { hotelClass: { in: [4, 5] } } },
    });
  });

  it("handles unknown roomType values", () => {
    const { ctx } = createFilterContext({ roomType: ["unknown_type"] });
    applyHotelFilters(ctx);
    expect(ctx.andConditions).toHaveLength(1);
    // Falls back to capitalized version: "Unknown_type"
    const cond = ctx.andConditions[0] as any;
    expect(cond.OR.length).toBeGreaterThanOrEqual(2);
  });

  it("handles empty roomType array", () => {
    const { ctx } = createFilterContext({ roomType: [] });
    applyHotelFilters(ctx);
    expect(ctx.andConditions).toHaveLength(0);
  });

  it("discards empty string stars (Number(\"\") === 0 is now filtered out)", () => {
    const { ctx } = createFilterContext({ stars: [""] });
    applyHotelFilters(ctx);
    // Number("") → 0, but n >= 1 filter excludes it
    expect(ctx.andConditions).toHaveLength(0);
  });

  it("discards out-of-range stars (>5)", () => {
    const { ctx } = createFilterContext({ stars: ["99"] });
    applyHotelFilters(ctx);
    // 99 > 5, so filtered out by n <= 5 guard
    expect(ctx.andConditions).toHaveLength(0);
  });
});

describe("Edge cases — tour filters", () => {
  it("ignores tourType for non-TOUR types", () => {
    const { ctx } = createFilterContext({ tourType: ["beach"] }, "HOTEL");
    applyTourFilters(ctx);
    expect(ctx.andConditions).toHaveLength(0);
  });

  it("handles unknown tourType values", () => {
    const { ctx } = createFilterContext({ tourType: ["unknown_type"] }, "TOUR");
    applyTourFilters(ctx);
    expect(ctx.andConditions).toHaveLength(0);
  });

  it("adds nights condition even without type check", () => {
    const { ctx } = createFilterContext({ nights: ["4-7"] }, null);
    applyTourFilters(ctx);
    expect(ctx.andConditions).toContainEqual({ tourCategory: "MULTI_DAY" });
  });
});

describe("Edge cases — excursion filters", () => {
  it("ignores all excursion filters for non-EXCURSION type", () => {
    const { ctx } = createFilterContext(
      { tourType: ["walking"], category: ["adventure"], excursionType: ["group"], ticketsIncluded: ["true"] },
      "TOUR"
    );
    applyExcursionFilters(ctx);
    expect(ctx.andConditions).toHaveLength(0);
  });

  it("handles unknown category values", () => {
    const { ctx } = createFilterContext({ category: ["unknown_cat"] }, "EXCURSION");
    applyExcursionFilters(ctx);
    expect(ctx.andConditions).toHaveLength(0);
  });

  it("handles unknown excursionType values", () => {
    const { ctx } = createFilterContext({ excursionType: ["unknown_type"] }, "EXCURSION");
    applyExcursionFilters(ctx);
    expect(ctx.andConditions).toHaveLength(0);
  });
});

describe("Edge cases — transfer filters", () => {
  it("ignores all transfer filters for non-TRANSFER type", () => {
    const { ctx } = createFilterContext(
      { carClass: ["economy"], capacity: ["6"], meetingType: ["sign"] },
      "HOTEL"
    );
    applyTransferFilters(ctx);
    expect(ctx.andConditions).toHaveLength(0);
  });

  it("handles unknown carClass values", () => {
    const { ctx } = createFilterContext({ carClass: ["unknown_class"] }, "TRANSFER");
    applyTransferFilters(ctx);
    expect(ctx.andConditions).toHaveLength(0);
  });

  it("handles zero capacity", () => {
    const { ctx } = createFilterContext({ capacity: ["0"] }, "TRANSFER");
    applyTransferFilters(ctx);
    // CAPACITY_MAP["0"] is undefined → 0, max(0) = 0, so no condition added
    expect(ctx.andConditions).toHaveLength(0);
  });

  it("handles unknown capacity values", () => {
    const { ctx } = createFilterContext({ capacity: ["999"] }, "TRANSFER");
    applyTransferFilters(ctx);
    // CAPACITY_MAP["999"] is undefined → 0, max(0) = 0, so no condition added
    expect(ctx.andConditions).toHaveLength(0);
  });

  it("handles unknown meetingType values", () => {
    const { ctx } = createFilterContext({ meetingType: ["unknown_meeting"] }, "TRANSFER");
    applyTransferFilters(ctx);
    expect(ctx.andConditions).toHaveLength(0);
  });
});

describe("Edge cases — sanatorium filters", () => {
  it("ignores all sanatorium filters for non-SANATORIUM type", () => {
    const { ctx } = createFilterContext(
      { treatment: ["cardiology"], diet: ["vegan"], hasDoctor: ["true"] },
      "HOTEL"
    );
    applySanatoriumFilters(ctx);
    expect(ctx.andConditions).toHaveLength(0);
  });

  it("handles unknown treatment values", () => {
    const { ctx } = createFilterContext({ treatment: ["unknown_treatment"] }, "SANATORIUM");
    applySanatoriumFilters(ctx);
    expect(ctx.andConditions).toHaveLength(0);
  });

  it("handles unknown diet values", () => {
    const { ctx } = createFilterContext({ diet: ["unknown_diet"] }, "SANATORIUM");
    applySanatoriumFilters(ctx);
    expect(ctx.andConditions).toHaveLength(0);
  });
});

describe("Edge cases — guide filters", () => {
  it("ignores experience for non-GUIDE/PHOTOGRAPHER types", () => {
    const { ctx } = createFilterContext({ experience: ["5"] }, "HOTEL");
    applyGuideFilters(ctx);
    expect(ctx.andConditions).toHaveLength(0);
  });

  it("handles non-numeric experience values", () => {
    const { ctx } = createFilterContext({ experience: ["abc"] }, "GUIDE");
    applyGuideFilters(ctx);
    // NaN is filtered out
    expect(ctx.andConditions).toHaveLength(0);
  });

  it("ignores hasCar/hasLicense for non-GUIDE type", () => {
    const { ctx } = createFilterContext({ hasCar: ["true"], hasLicense: ["true"] }, "PHOTOGRAPHER");
    applyGuideFilters(ctx);
    expect(ctx.andConditions).toHaveLength(0);
  });

  it("handles unknown specialization values", () => {
    const { ctx } = createFilterContext({ specialization: ["unknown_spec"] }, "GUIDE");
    applyGuideFilters(ctx);
    expect(ctx.andConditions).toHaveLength(0);
  });
});

describe("Edge cases — photographer filters", () => {
  it("ignores genre for non-PHOTOGRAPHER type", () => {
    const { ctx } = createFilterContext({ genre: ["wedding"] }, "GUIDE");
    applyPhotographerFilters(ctx);
    expect(ctx.andConditions).toHaveLength(0);
  });

  it("handles unknown genre values", () => {
    const { ctx } = createFilterContext({ genre: ["unknown_genre"] }, "PHOTOGRAPHER");
    applyPhotographerFilters(ctx);
    expect(ctx.andConditions).toHaveLength(0);
  });
});

describe("Edge cases — helpers", () => {
  it("parseDurationHours handles various malformed inputs", () => {
    expect(parseDurationHours("")).toBeNull();
    expect(parseDurationHours("нет данных")).toBeNull();
    expect(parseDurationHours("abc123def")).toBe(123);
    expect(parseDurationHours("  42  ")).toBe(42);
  });

  it("durationFitsRange handles edge values", () => {
    expect(durationFitsRange(0, "2")).toBe(true); // 0 <= 2
    expect(durationFitsRange(-1, "2")).toBe(true); // -1 <= 2
    expect(durationFitsRange(100, "full")).toBe(true);
  });

  it("matchesKeywords handles empty text and empty keywords", () => {
    expect(matchesKeywords("", ["test"])).toBe(false);
    expect(matchesKeywords("hello", [])).toBe(false);
    expect(matchesKeywords("", [])).toBe(false);
  });

  it("resolveKeywords handles empty values array", () => {
    const result = resolveKeywords([], { pool: ["Бассейн"] });
    expect(result).toEqual([]);
  });

  it("resolveKeywords handles empty keyword map", () => {
    const result = resolveKeywords(["pool"], {});
    expect(result).toEqual([]);
  });
});
