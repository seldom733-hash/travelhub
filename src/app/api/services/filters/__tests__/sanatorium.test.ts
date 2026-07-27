import { describe, it, expect } from "vitest";
import { createFilterContext } from "./test-utils";
import { applySanatoriumFilters } from "../sanatorium";

describe("applySanatoriumFilters", () => {
  it("adds treatment condition when type is SANATORIUM", () => {
    const { ctx } = createFilterContext({ treatment: ["cardiology"] }, "SANATORIUM");
    applySanatoriumFilters(ctx);
    expect(ctx.andConditions.length).toBe(1);
  });

  it("ignores treatment when type is not SANATORIUM", () => {
    const { ctx } = createFilterContext({ treatment: ["cardiology"] }, "HOTEL");
    applySanatoriumFilters(ctx);
    expect(ctx.andConditions).toHaveLength(0);
  });

  it("adds diet condition when type is SANATORIUM", () => {
    const { ctx } = createFilterContext({ diet: ["vegan"] }, "SANATORIUM");
    applySanatoriumFilters(ctx);
    expect(ctx.andConditions.length).toBe(1);
  });

  it("adds hasDoctor condition", () => {
    const { ctx } = createFilterContext({ hasDoctor: ["true"] }, "SANATORIUM");
    applySanatoriumFilters(ctx);
    expect(ctx.andConditions.length).toBe(1);
    const cond = ctx.andConditions[0] as any;
    expect(cond.OR).toHaveLength(3); // 3 languages
  });

  it("combines multiple sanatorium filters", () => {
    const { ctx } = createFilterContext(
      { treatment: ["mineral_water"], diet: ["diabetic"], hasDoctor: ["true"] },
      "SANATORIUM"
    );
    applySanatoriumFilters(ctx);
    expect(ctx.andConditions.length).toBe(3);
  });
});
