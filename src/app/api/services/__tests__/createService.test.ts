import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──

const mockPrisma = {
  service: { create: vi.fn() },
  tourHotel: { create: vi.fn() },
  flightDetail: { createMany: vi.fn() },
  transferDetail: { create: vi.fn() },
  $transaction: vi.fn(async (fn: any) => fn(mockPrisma)),
};

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

const mockVerifyToken = vi.fn();
vi.mock("@/lib/auth", () => ({
  verifyToken: (...args: any[]) => mockVerifyToken(...args),
}));

// ── Import after mocks ──

import { createService } from "../createService";

function makeRequest(body: any, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return new Request("http://localhost/api/services", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  }) as any;
}

const VALID_BODY = {
  title: "Test Tour",
  description: "A great tour",
  type: "TOUR",
  price: 99.99,
  city: "Baku",
  country: "Azerbaijan",
};

describe("createService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.service.create.mockResolvedValue({
      id: "svc-1",
      title: "Test Tour",
      amenities: [],
    });
  });

  // ── Auth ──

  it("returns 401 when no token provided", async () => {
    const res = await createService(makeRequest({}));
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is not PARTNER", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "u1", role: "BUYER" });
    const res = await createService(makeRequest({}, "token123"));
    expect(res.status).toBe(403);
  });

  // ── Body format ──

  it("returns 400 when body is not an object", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "u1", role: "PARTNER" });
    const res = await createService(makeRequest(null, "token123"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Неверный формат");
  });

  // ── Required fields ──

  it("returns 400 when title is missing", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "u1", role: "PARTNER" });
    const res = await createService(makeRequest({ ...VALID_BODY, title: undefined }, "token123"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("title");
  });

  it("returns 400 when title is not a string", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "u1", role: "PARTNER" });
    const res = await createService(makeRequest({ ...VALID_BODY, title: 123 }, "token123"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when description is missing", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "u1", role: "PARTNER" });
    const res = await createService(makeRequest({ ...VALID_BODY, description: "" }, "token123"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("description");
  });

  it("returns 400 when type is missing", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "u1", role: "PARTNER" });
    const res = await createService(makeRequest({ ...VALID_BODY, type: undefined }, "token123"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when type is invalid", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "u1", role: "PARTNER" });
    const res = await createService(makeRequest({ ...VALID_BODY, type: "INVALID" }, "token123"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Допустимые");
  });

  it("returns 400 when price is missing", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "u1", role: "PARTNER" });
    const res = await createService(makeRequest({ ...VALID_BODY, price: undefined }, "token123"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when price is not a number", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "u1", role: "PARTNER" });
    const res = await createService(makeRequest({ ...VALID_BODY, price: "abc" }, "token123"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when price is NaN", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "u1", role: "PARTNER" });
    const res = await createService(makeRequest({ ...VALID_BODY, price: NaN }, "token123"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when price is negative", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "u1", role: "PARTNER" });
    const res = await createService(makeRequest({ ...VALID_BODY, price: -10 }, "token123"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when price is zero", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "u1", role: "PARTNER" });
    const res = await createService(makeRequest({ ...VALID_BODY, price: 0 }, "token123"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when city is missing", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "u1", role: "PARTNER" });
    const res = await createService(makeRequest({ ...VALID_BODY, city: "" }, "token123"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when country is missing", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "u1", role: "PARTNER" });
    const res = await createService(makeRequest({ ...VALID_BODY, country: "" }, "token123"));
    expect(res.status).toBe(400);
  });

  // ── Optional field validation ──

  it("returns 400 when countryCode is too long", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "u1", role: "PARTNER" });
    const res = await createService(makeRequest({ ...VALID_BODY, countryCode: "TOOLONG" }, "token123"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when images is not a string", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "u1", role: "PARTNER" });
    const res = await createService(makeRequest({ ...VALID_BODY, images: ["url1"] }, "token123"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when amenities is not an array", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "u1", role: "PARTNER" });
    const res = await createService(makeRequest({ ...VALID_BODY, amenities: "pool" }, "token123"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when amenities contains non-strings", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "u1", role: "PARTNER" });
    const res = await createService(makeRequest({ ...VALID_BODY, amenities: [123] }, "token123"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when tourCategory is invalid", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "u1", role: "PARTNER" });
    const res = await createService(makeRequest({ ...VALID_BODY, tourCategory: "WEEKLY" }, "token123"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when title exceeds 200 characters", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "u1", role: "PARTNER" });
    const res = await createService(makeRequest({ ...VALID_BODY, title: "x".repeat(201) }, "token123"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when description exceeds 5000 characters", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "u1", role: "PARTNER" });
    const res = await createService(makeRequest({ ...VALID_BODY, description: "x".repeat(5001) }, "token123"));
    expect(res.status).toBe(400);
  });

  // ── Success cases ──

  it("creates a basic service with valid data", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "u1", role: "PARTNER" });
    const res = await createService(makeRequest(VALID_BODY, "token123"));
    expect(res.status).toBe(201);
    expect(mockPrisma.service.create).toHaveBeenCalledTimes(1);
    const createArg = mockPrisma.service.create.mock.calls[0][0];
    expect(createArg.data.title).toBe("Test Tour");
    expect(createArg.data.type).toBe("TOUR");
    expect(createArg.data.price).toBe(99.99);
    expect(createArg.data.providerId).toBe("u1");
  });

  it("creates a service with amenities", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "u1", role: "PARTNER" });
    const body = {
      ...VALID_BODY,
      title: "Hotel Stay",
      type: "HOTEL",
      price: 150,
      city: "Istanbul",
      country: "Turkey",
      amenities: ["Pool", "Spa"],
    };
    await createService(makeRequest(body, "token123"));
    const createArg = mockPrisma.service.create.mock.calls[0][0];
    expect(createArg.data.amenities).toEqual({
      create: [{ name: "Pool" }, { name: "Spa" }],
    });
  });

  it("creates multi-day tour with hotel, flight, and transfer", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "u1", role: "PARTNER" });
    const body = {
      ...VALID_BODY,
      title: "Multi Day Tour",
      price: 500,
      tourCategory: "MULTI_DAY",
      multiDay: {
        hotel: { hotelName: "Grand Hotel", hotelClass: 5, roomType: "Suite" },
        flight: {
          depCity: "Moscow", depCode: "SVO", depTime: "08:00",
          arrCity: "Baku", arrCode: "GYD", arrTime: "12:00",
          retDepTime: "18:00", retArrTime: "22:00",
        },
        transfer: { included: true, type: "standard" },
      },
    };
    const res = await createService(makeRequest(body, "token123"));
    expect(res.status).toBe(201);
    expect(mockPrisma.tourHotel.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.flightDetail.createMany).toHaveBeenCalledTimes(1);
    expect(mockPrisma.transferDetail.create).toHaveBeenCalledTimes(1);
  });

  it("does not create multi-day details for non-TOUR type", async () => {
    mockVerifyToken.mockResolvedValue({ userId: "u1", role: "PARTNER" });
    const body = {
      ...VALID_BODY,
      title: "Hotel Only",
      type: "HOTEL",
      price: 200,
      multiDay: {
        hotel: { hotelName: "Grand Hotel" },
      },
    };
    await createService(makeRequest(body, "token123"));
    expect(mockPrisma.tourHotel.create).not.toHaveBeenCalled();
    expect(mockPrisma.flightDetail.createMany).not.toHaveBeenCalled();
    expect(mockPrisma.transferDetail.create).not.toHaveBeenCalled();
  });
});
