import { describe, it, expect } from "vitest";
import {
  parseDurationHours,
  durationFitsRange,
  matchesKeywords,
  buildKeywordOrConditions,
  resolveKeywords,
  parseNumericParam,
  parseNumericArray,
} from "../helpers";

describe("parseNumericParam", () => {
  it("returns null for null input", () => {
    expect(parseNumericParam(null)).toBeNull();
    expect(parseNumericParam(undefined)).toBeNull();
  });

  it("parses valid numeric strings", () => {
    expect(parseNumericParam("42")).toBe(42);
    expect(parseNumericParam("3.14")).toBeCloseTo(3.14);
    expect(parseNumericParam("-5")).toBe(-5);
    expect(parseNumericParam("0")).toBe(0);
  });

  it("returns null for non-numeric strings", () => {
    expect(parseNumericParam("abc")).toBeNull();
    expect(parseNumericParam("")).toBeNull();
    expect(parseNumericParam("hello world")).toBeNull();
  });

  it("returns null for Infinity and NaN", () => {
    expect(parseNumericParam("Infinity")).toBeNull();
    expect(parseNumericParam("NaN")).toBeNull();
  });

  it("rejects partial numeric strings (Number is stricter than parseFloat)", () => {
    // parseFloat('123abc') returns 123, but Number('123abc') returns NaN
    expect(parseNumericParam("123abc")).toBeNull();
    expect(parseNumericParam("42.5px")).toBeNull();
    expect(parseNumericParam("10.0.0")).toBeNull();
  });
});

describe("parseNumericArray", () => {
  it("parses valid numbers from string array", () => {
    expect(parseNumericArray(["1", "2", "3"])).toEqual([1, 2, 3]);
  });

  it("filters out non-numeric values", () => {
    expect(parseNumericArray(["1", "abc", "3"])).toEqual([1, 3]);
  });

  it("returns empty array for all non-numeric", () => {
    expect(parseNumericArray(["abc", "xyz"])).toEqual([]);
  });

  it("applies min/max range filtering", () => {
    expect(parseNumericArray(["1", "3", "5", "7"], 3, 5)).toEqual([3, 5]);
  });

  it("applies only min bound", () => {
    expect(parseNumericArray(["1", "3", "5", "7"], 5)).toEqual([5, 7]);
  });

  it("applies only max bound", () => {
    expect(parseNumericArray(["1", "3", "5", "7"], undefined, 3)).toEqual([1, 3]);
  });

  it("filters out empty strings (Number(\"\") === 0)", () => {
    expect(parseNumericArray(["", "1", "2"])).toEqual([1, 2]);
  });

  it("handles 1-5 range for stars", () => {
    expect(parseNumericArray(["3", "5", "7", "99"], 1, 5)).toEqual([3, 5]);
  });
});

describe("parseDurationHours", () => {
  it("returns null for null input", () => {
    expect(parseDurationHours(null)).toBeNull();
  });

  it("extracts number from duration string", () => {
    expect(parseDurationHours("3 часа")).toBe(3);
    expect(parseDurationHours("8ч")).toBe(8);
    expect(parseDurationHours("24 часа")).toBe(24);
  });

  it("returns null for string without numbers", () => {
    expect(parseDurationHours("нет данных")).toBeNull();
  });
});

describe("durationFitsRange", () => {
  it("returns false for null hours", () => {
    expect(durationFitsRange(null, "2")).toBe(false);
  });

  it("matches '2' range (<=2)", () => {
    expect(durationFitsRange(1, "2")).toBe(true);
    expect(durationFitsRange(2, "2")).toBe(true);
    expect(durationFitsRange(3, "2")).toBe(false);
  });

  it("matches '4' range (3-4)", () => {
    expect(durationFitsRange(2, "4")).toBe(false);
    expect(durationFitsRange(3, "4")).toBe(true);
    expect(durationFitsRange(4, "4")).toBe(true);
    expect(durationFitsRange(5, "4")).toBe(false);
  });

  it("matches '8' range (5-8)", () => {
    expect(durationFitsRange(4, "8")).toBe(false);
    expect(durationFitsRange(5, "8")).toBe(true);
    expect(durationFitsRange(8, "8")).toBe(true);
    expect(durationFitsRange(9, "8")).toBe(false);
  });

  it("matches 'full' range (>8)", () => {
    expect(durationFitsRange(8, "full")).toBe(false);
    expect(durationFitsRange(9, "full")).toBe(true);
  });

  it("matches 'multi' range (>24)", () => {
    expect(durationFitsRange(24, "multi")).toBe(false);
    expect(durationFitsRange(25, "multi")).toBe(true);
  });

  it("returns true for unknown range", () => {
    expect(durationFitsRange(5, "unknown")).toBe(true);
  });
});

describe("matchesKeywords", () => {
  it("matches case-insensitive keywords", () => {
    expect(matchesKeywords("Бассейн большой", ["бассейн"])).toBe(true);
    expect(matchesKeywords("Pool area", ["pool"])).toBe(true);
  });

  it("returns false when no keyword matches", () => {
    expect(matchesKeywords("Wi-Fi доступен", ["бассейн", "спа"])).toBe(false);
  });

  it("matches any keyword in the array", () => {
    expect(matchesKeywords("Спа-зона", ["бассейн", "спа"])).toBe(true);
  });
});

describe("buildKeywordOrConditions", () => {
  it("builds OR conditions for keyword arrays", () => {
    const result = buildKeywordOrConditions([["Бассейн", "Pool"]]);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("OR");
    // 2 keywords × 2 fields (title + description) = 4 conditions
    expect((result[0] as any).OR).toHaveLength(4);
  });

  it("builds conditions for multiple keyword arrays", () => {
    const result = buildKeywordOrConditions([
      ["Бассейн", "Pool"],
      ["Спа", "SPA"],
    ]);
    expect(result).toHaveLength(2);
  });

  it("uses custom fields when specified", () => {
    const result = buildKeywordOrConditions([["VIP"]], ["title"]);
    expect((result[0] as any).OR).toEqual([{ title: { contains: "VIP" } }]);
  });
});

describe("resolveKeywords", () => {
  it("resolves filter values to keyword arrays", () => {
    const map = { pool: ["Бассейн", "Pool"], spa: ["Спа", "SPA"] };
    const result = resolveKeywords(["pool", "spa"], map);
    expect(result).toEqual([["Бассейн", "Pool"], ["Спа", "SPA"]]);
  });

  it("filters out unknown values", () => {
    const map = { pool: ["Бассейн", "Pool"] };
    const result = resolveKeywords(["pool", "unknown"], map);
    expect(result).toEqual([["Бассейн", "Pool"]]);
  });

  it("returns empty array for all unknown values", () => {
    const result = resolveKeywords(["x", "y"], {});
    expect(result).toEqual([]);
  });
});
