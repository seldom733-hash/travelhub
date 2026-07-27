import { describe, it, expect } from "vitest";
import { createFilterContext } from "./test-utils";
import { applyTransferFilters } from "../transfer";

describe("applyTransferFilters", () => {
  it("adds carClass condition when type is TRANSFER", () => {
    const { ctx } = createFilterContext({ carClass: ["economy"] }, "TRANSFER");
    applyTransferFilters(ctx);
    expect(ctx.andConditions.length).toBe(1);
  });

  it("ignores carClass when type is not TRANSFER", () => {
    const { ctx } = createFilterContext({ carClass: ["economy"] }, "HOTEL");
    applyTransferFilters(ctx);
    expect(ctx.andConditions).toHaveLength(0);
  });

  it("adds capacity condition with maxGuests", () => {
    const { ctx } = createFilterContext({ capacity: ["6"] }, "TRANSFER");
    applyTransferFilters(ctx);
    expect(ctx.andConditions.length).toBe(1);
    const cond = ctx.andConditions[0] as any;
    expect(cond.OR[0]).toEqual({ maxGuests: { gte: 6 } });
  });

  it("adds meetingType condition", () => {
    const { ctx } = createFilterContext({ meetingType: ["sign"] }, "TRANSFER");
    applyTransferFilters(ctx);
    expect(ctx.andConditions.length).toBe(1);
  });

  it("combines multiple transfer filters", () => {
    const { ctx } = createFilterContext(
      { carClass: ["comfort"], capacity: ["12"], meetingType: ["board"] },
      "TRANSFER"
    );
    applyTransferFilters(ctx);
    expect(ctx.andConditions.length).toBe(3);
  });
});
