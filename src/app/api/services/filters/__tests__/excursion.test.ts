import { describe, it, expect } from "vitest";
import { createFilterContext } from "./test-utils";
import { applyExcursionFilters } from "../excursion";

describe("applyExcursionFilters", () => {
  it("adds transport condition when type is EXCURSION", () => {
    const { ctx } = createFilterContext({ tourType: ["walking"] }, "EXCURSION");
    applyExcursionFilters(ctx);
    expect(ctx.andConditions.length).toBe(1);
  });

  it("ignores transport when type is not EXCURSION", () => {
    const { ctx } = createFilterContext({ tourType: ["walking"] }, "TOUR");
    applyExcursionFilters(ctx);
    expect(ctx.andConditions).toHaveLength(0);
  });

  it("adds category condition when type is EXCURSION", () => {
    const { ctx } = createFilterContext({ category: ["adventure"] }, "EXCURSION");
    applyExcursionFilters(ctx);
    expect(ctx.andConditions.length).toBe(1);
  });

  it("adds excursionType condition", () => {
    const { ctx } = createFilterContext({ excursionType: ["group"] }, "EXCURSION");
    applyExcursionFilters(ctx);
    expect(ctx.andConditions.length).toBe(1);
  });

  it("adds ticketsIncluded condition", () => {
    const { ctx } = createFilterContext({ ticketsIncluded: ["true"] }, "EXCURSION");
    applyExcursionFilters(ctx);
    expect(ctx.andConditions).toContainEqual({
      description: { contains: "билет" },
    });
  });

  it("combines multiple excursion filters", () => {
    const { ctx } = createFilterContext(
      { category: ["cultural"], excursionType: ["individual"], ticketsIncluded: ["true"] },
      "EXCURSION"
    );
    applyExcursionFilters(ctx);
    expect(ctx.andConditions.length).toBe(3);
  });
});
