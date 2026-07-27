import { describe, it, expect } from "vitest";
import { buildContext } from "../types";

function makeRequest(url: string) {
  return new Request(url) as any;
}

describe("buildContext", () => {
  it("parses basic params from URL", () => {
    const { ctx, params, type } = buildContext(
      makeRequest("http://localhost/api/services?type=HOTEL&countryCode=TR&city=Baku&sort=price_asc&page=2&limit=20")
    );
    expect(type).toBe("HOTEL");
    expect(ctx.type).toBe("HOTEL");
    expect(params.countryCodes).toEqual(["TR"]);
    expect(params.cities).toEqual(["Baku"]);
    expect(params.sort).toBe("price_asc");
    expect(params.page).toBe(2);
    expect(params.limit).toBe(20);
  });

  it("uses defaults for missing params", () => {
    const { ctx, params, type } = buildContext(makeRequest("http://localhost/api/services"));
    expect(type).toBeNull();
    expect(ctx.type).toBeNull();
    expect(params.sort).toBe("popular");
    expect(params.page).toBe(1);
    expect(params.limit).toBe(12);
    expect(params.countryCodes).toEqual([]);
    expect(params.cities).toEqual([]);
    expect(params.region).toBeNull();
    expect(params.minPrice).toBeNull();
    expect(params.maxPrice).toBeNull();
    expect(params.minRating).toBeNull();
    expect(params.tourCategory).toBeNull();
  });

  it("initializes where with isActive: true", () => {
    const { ctx } = buildContext(makeRequest("http://localhost/api/services"));
    expect(ctx.where).toEqual({ isActive: true });
  });

  it("initializes empty andConditions array", () => {
    const { ctx } = buildContext(makeRequest("http://localhost/api/services"));
    expect(ctx.andConditions).toEqual([]);
  });

  it("parses multiple countryCode values", () => {
    const { params } = buildContext(
      makeRequest("http://localhost/api/services?countryCode=TR&countryCode=AZ&countryCode=GE")
    );
    expect(params.countryCodes).toEqual(["TR", "AZ", "GE"]);
  });

  it("parses multiple city values", () => {
    const { params } = buildContext(
      makeRequest("http://localhost/api/services?city=Baku&city=Istanbul")
    );
    expect(params.cities).toEqual(["Baku", "Istanbul"]);
  });

  it("parses price filters", () => {
    const { params } = buildContext(
      makeRequest("http://localhost/api/services?minPrice=100&maxPrice=500")
    );
    expect(params.minPrice).toBe("100");
    expect(params.maxPrice).toBe("500");
  });

  it("parses region and tourCategory", () => {
    const { params } = buildContext(
      makeRequest("http://localhost/api/services?region=caspian&tourCategory=MULTI_DAY")
    );
    expect(params.region).toBe("caspian");
    expect(params.tourCategory).toBe("MULTI_DAY");
  });

  it("parses minRating", () => {
    const { params } = buildContext(
      makeRequest("http://localhost/api/services?minRating=4.5")
    );
    expect(params.minRating).toBe("4.5");
  });

  it("exposes searchParams for downstream filter access", () => {
    const { ctx } = buildContext(
      makeRequest("http://localhost/api/services?amenities=pool&spa=true&meal=breakfast")
    );
    expect(ctx.searchParams.getAll("amenities")).toEqual(["pool"]);
    expect(ctx.searchParams.getAll("spa")).toEqual(["true"]);
    expect(ctx.searchParams.getAll("meal")).toEqual(["breakfast"]);
  });

  it("handles non-numeric page/limit gracefully", () => {
    const { params } = buildContext(
      makeRequest("http://localhost/api/services?page=abc&limit=xyz")
    );
    // parseInt("abc") → NaN, but || "1" / "12" fallback doesn't apply because "abc" is truthy
    expect(params.page).toBeNaN();
    expect(params.limit).toBeNaN();
  });

  it("handles empty string page/limit", () => {
    const { params } = buildContext(
      makeRequest("http://localhost/api/services?page=&limit=")
    );
    // "" is falsy, so fallback applies: page=1, limit=12
    expect(params.page).toBe(1);
    expect(params.limit).toBe(12);
  });

  it("returns same searchParams instance in ctx", () => {
    const { ctx } = buildContext(makeRequest("http://localhost/api/services?type=TOUR"));
    // searchParams should be a real URLSearchParams instance
    expect(ctx.searchParams).toBeInstanceOf(URLSearchParams);
    expect(ctx.searchParams.get("type")).toBe("TOUR");
  });
});
