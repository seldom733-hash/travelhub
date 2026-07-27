import { describe, it, expect } from "vitest";
import { createFilterContext } from "./test-utils";
import { applyGuideFilters } from "../guide";

describe("applyGuideFilters", () => {
  it("adds experience condition for GUIDE type", () => {
    const { ctx } = createFilterContext({ experience: ["5"] }, "GUIDE");
    applyGuideFilters(ctx);
    expect(ctx.andConditions.length).toBe(1);
    const cond = ctx.andConditions[0] as any;
    expect(cond.OR[0]).toEqual({ description: { contains: "5 лет" } });
  });

  it("adds experience condition for PHOTOGRAPHER type", () => {
    const { ctx } = createFilterContext({ experience: ["3"] }, "PHOTOGRAPHER");
    applyGuideFilters(ctx);
    expect(ctx.andConditions.length).toBe(1);
  });

  it("ignores experience for other types", () => {
    const { ctx } = createFilterContext({ experience: ["5"] }, "HOTEL");
    applyGuideFilters(ctx);
    expect(ctx.andConditions).toHaveLength(0);
  });

  it("adds hasCar condition for GUIDE type", () => {
    const { ctx } = createFilterContext({ hasCar: ["true"] }, "GUIDE");
    applyGuideFilters(ctx);
    expect(ctx.andConditions).toContainEqual({
      description: { contains: "автомобиль" },
    });
  });

  it("adds hasLicense condition for GUIDE type", () => {
    const { ctx } = createFilterContext({ hasLicense: ["true"] }, "GUIDE");
    applyGuideFilters(ctx);
    expect(ctx.andConditions).toContainEqual({
      description: { contains: "Лицензия" },
    });
  });

  it("adds specialization condition for GUIDE type", () => {
    const { ctx } = createFilterContext({ specialization: ["history"] }, "GUIDE");
    applyGuideFilters(ctx);
    expect(ctx.andConditions.length).toBe(1);
  });

  it("combines multiple guide filters", () => {
    const { ctx } = createFilterContext(
      { experience: ["10"], hasCar: ["true"], hasLicense: ["true"], specialization: ["museums"] },
      "GUIDE"
    );
    applyGuideFilters(ctx);
    expect(ctx.andConditions.length).toBe(4);
  });
});
