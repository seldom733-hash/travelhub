import { describe, it, expect } from "vitest";
import { createFilterContext } from "./test-utils";
import { applyPhotographerFilters } from "../photographer";

describe("applyPhotographerFilters", () => {
  it("adds genre condition when type is PHOTOGRAPHER", () => {
    const { ctx } = createFilterContext({ genre: ["wedding"] }, "PHOTOGRAPHER");
    applyPhotographerFilters(ctx);
    expect(ctx.andConditions.length).toBe(1);
  });

  it("ignores genre when type is not PHOTOGRAPHER", () => {
    const { ctx } = createFilterContext({ genre: ["wedding"] }, "GUIDE");
    applyPhotographerFilters(ctx);
    expect(ctx.andConditions).toHaveLength(0);
  });

  it("combines multiple genres", () => {
    const { ctx } = createFilterContext({ genre: ["wedding", "portrait"] }, "PHOTOGRAPHER");
    applyPhotographerFilters(ctx);
    expect(ctx.andConditions.length).toBe(1);
    const cond = ctx.andConditions[0] as any;
    expect(cond.OR).toHaveLength(2); // 2 genre arrays
  });
});
