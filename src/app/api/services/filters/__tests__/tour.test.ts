import { describe, it, expect } from "vitest";
import { createFilterContext } from "./test-utils";
import { applyTourFilters } from "../tour";

describe("applyTourFilters", () => {
  it("adds tourType condition when type is TOUR", () => {
    const { ctx } = createFilterContext({ tourType: ["beach", "ski"] }, "TOUR");
    applyTourFilters(ctx);
    expect(ctx.andConditions.length).toBe(1);
  });

  it("ignores tourType when type is not TOUR", () => {
    const { ctx } = createFilterContext({ tourType: ["beach"] }, "HOTEL");
    applyTourFilters(ctx);
    expect(ctx.andConditions).toHaveLength(0);
  });

  it("adds nights condition as MULTI_DAY", () => {
    const { ctx } = createFilterContext({ nights: ["4-7"] });
    applyTourFilters(ctx);
    expect(ctx.andConditions).toContainEqual({ tourCategory: "MULTI_DAY" });
  });

  it("does nothing when no tour filters specified", () => {
    const { ctx } = createFilterContext({});
    applyTourFilters(ctx);
    expect(ctx.andConditions).toHaveLength(0);
  });
});
