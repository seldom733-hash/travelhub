import { describe, it, expect } from "vitest";
import { createFilterContext } from "./test-utils";
import { applyHotelFilters } from "../hotel";

describe("applyHotelFilters", () => {
  it("adds stars condition using exact star matching", () => {
    const { ctx } = createFilterContext({ stars: ["4", "5"] });
    applyHotelFilters(ctx);
    expect(ctx.andConditions.length).toBe(1);
    const cond = ctx.andConditions[0] as any;
    // Each star value produces an OR entry with tourHotels + description startsWith
    expect(cond.OR).toBeDefined();
    expect(cond.OR.length).toBe(2);
    // 4-star entry
    expect(cond.OR[0].OR).toBeDefined();
    expect(cond.OR[0].OR[0]).toEqual({
      tourHotels: { some: { hotelClass: { equals: 4 } } },
    });
    expect(cond.OR[0].OR[1].AND).toBeDefined();
    // 5-star entry
    expect(cond.OR[1].OR).toBeDefined();
    expect(cond.OR[1].OR[0]).toEqual({
      tourHotels: { some: { hotelClass: { equals: 5 } } },
    });
  });

  it("adds star description startsWith condition", () => {
    const { ctx } = createFilterContext({ stars: ["5"] });
    applyHotelFilters(ctx);
    const cond = ctx.andConditions[0] as any;
    // 5-star: OR entry with startsWith '★★★★★'
    expect(cond.OR).toBeDefined();
    expect(cond.OR.length).toBe(1);
    const starEntry = cond.OR[0];
    expect(starEntry.OR).toBeDefined();
    // Description startsWith ★★★★★
    expect(starEntry.OR[1]).toEqual({
      AND: [
        { description: { startsWith: "★★★★★" } },
      ],
    });
  });

  it("adds roomType condition", () => {
    const { ctx } = createFilterContext({ roomType: ["standard", "suite"] });
    applyHotelFilters(ctx);
    expect(ctx.andConditions.length).toBe(1);
    const cond = ctx.andConditions[0] as any;
    expect(cond.OR).toBeDefined();
    expect(cond.OR.length).toBeGreaterThanOrEqual(2);
  });

  it("adds petsAllowed condition", () => {
    const { ctx } = createFilterContext({ petsAllowed: ["true"] });
    applyHotelFilters(ctx);
    expect(ctx.andConditions).toContainEqual({
      OR: [
        { description: { contains: "Можно с животными" } },
        { description: { contains: "pets" } },
      ],
    });
  });

  it("does nothing when no hotel filters specified", () => {
    const { ctx } = createFilterContext({});
    applyHotelFilters(ctx);
    expect(ctx.andConditions).toHaveLength(0);
  });

  it("combines multiple hotel filters", () => {
    const { ctx } = createFilterContext({
      stars: ["4"],
      roomType: ["deluxe"],
      petsAllowed: ["true"],
    });
    applyHotelFilters(ctx);
    expect(ctx.andConditions.length).toBe(3);
  });
});
