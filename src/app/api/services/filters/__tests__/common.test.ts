import { describe, it, expect } from "vitest";
import { createFilterContext } from "./test-utils";
import { applyCommonFilters } from "../common";

describe("applyCommonFilters", () => {
  it("sets type in where clause", () => {
    const { ctx, params } = createFilterContext({ type: "HOTEL" }, "HOTEL");
    applyCommonFilters({ ctx, params });
    expect(ctx.where.type).toBe("HOTEL");
  });

  it("sets tourCategory in where clause", () => {
    const { ctx, params } = createFilterContext({ tourCategory: "MULTI_DAY" });
    applyCommonFilters({ ctx, params });
    expect(ctx.where.tourCategory).toBe("MULTI_DAY");
  });

  it("sets country filter with countryCode", () => {
    const { ctx, params } = createFilterContext({ countryCode: ["TR", "AZ"] });
    applyCommonFilters({ ctx, params });
    expect(ctx.where.countryCode).toEqual({ in: ["TR", "AZ"] });
  });

  it("sets city filter", () => {
    const { ctx, params } = createFilterContext({ city: ["Baku", "Istanbul"] });
    applyCommonFilters({ ctx, params });
    expect(ctx.where.city).toEqual({ in: ["Baku", "Istanbul"] });
  });

  it("sets rating filter", () => {
    const { ctx, params } = createFilterContext({ minRating: "4.5" });
    applyCommonFilters({ ctx, params });
    expect(ctx.where.rating).toEqual({ gte: 4.5 });
  });

  it("sets price range filter", () => {
    const { ctx, params } = createFilterContext({ minPrice: "100", maxPrice: "500" });
    applyCommonFilters({ ctx, params });
    expect(ctx.where.price).toEqual({ gte: 100, lte: 500 });
  });

  it("sets minPrice only", () => {
    const { ctx, params } = createFilterContext({ minPrice: "100" });
    applyCommonFilters({ ctx, params });
    expect(ctx.where.price).toEqual({ gte: 100 });
  });

  it("sets maxPrice only", () => {
    const { ctx, params } = createFilterContext({ maxPrice: "500" });
    applyCommonFilters({ ctx, params });
    expect(ctx.where.price).toEqual({ lte: 500 });
  });

  it("sets isHot when hotTour param present", () => {
    const { ctx, params } = createFilterContext({ hotTour: ["true"] });
    applyCommonFilters({ ctx, params });
    expect(ctx.where.isHot).toBe(true);
  });

  it("adds amenity condition for amenities filter", () => {
    const { ctx, params } = createFilterContext({ amenities: ["pool"] });
    applyCommonFilters({ ctx, params });
    expect(ctx.andConditions.length).toBeGreaterThan(0);
    const amenityCond = ctx.andConditions.find(
      (c: any) => c.amenities !== undefined
    );
    expect(amenityCond).toBeDefined();
  });

  it("adds meal condition for meal filter", () => {
    const { ctx, params } = createFilterContext({ meal: ["breakfast"] });
    applyCommonFilters({ ctx, params });
    expect(ctx.andConditions.length).toBeGreaterThan(0);
  });

  it("adds visa condition for visa filter", () => {
    const { ctx, params } = createFilterContext({ visa: ["free"] });
    applyCommonFilters({ ctx, params });
    expect(ctx.andConditions.length).toBeGreaterThan(0);
  });

  it("adds language condition", () => {
    const { ctx, params } = createFilterContext({ language: ["ru", "en"] });
    applyCommonFilters({ ctx, params });
    expect(ctx.andConditions.length).toBeGreaterThan(0);
    const langCond = ctx.andConditions[0] as any;
    expect(langCond.OR).toHaveLength(2);
  });

  it("adds cancellation condition", () => {
    const { ctx, params } = createFilterContext({ cancellation: ["free"] });
    applyCommonFilters({ ctx, params });
    expect(ctx.andConditions).toContainEqual({
      freeCancellation: true,
    });
  });

  it("does not add conditions when no filters specified", () => {
    const { ctx, params } = createFilterContext({});
    applyCommonFilters({ ctx, params });
    expect(ctx.andConditions).toHaveLength(0);
  });
});
