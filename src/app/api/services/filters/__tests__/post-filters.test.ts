import { describe, it, expect } from "vitest";
import { applyPostFilters } from "../post-filters";

describe("applyPostFilters", () => {
  const excursionServices = [
    { id: "1", title: "Quick Tour", duration: "2 часа", description: "Обзорная экскурсия" },
    { id: "2", title: "Full Day", duration: "8 часов", description: "Полная программа" },
    { id: "3", title: "Long Tour", duration: "10 часов", description: "Экскурсия на весь день" },
  ];

  const hotelServices = [
    { id: "4", title: "Beach Hotel", duration: null, description: "Отель на пляже, рядом море" },
    { id: "5", title: "City Hotel", duration: null, description: "Городской отель, центр" },
    { id: "6", title: "Hilltop Resort", duration: null, description: "Горный отель с видом" },
  ];

  describe("duration filter", () => {
    it("filters excursions by 2-hour range (<=2)", () => {
      const result = applyPostFilters(excursionServices, {
        durations: ["2"],
        distanceToSea: [],
        type: "EXCURSION",
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });

    it("filters excursions by 8-hour range (5-8)", () => {
      const result = applyPostFilters(excursionServices, {
        durations: ["8"],
        distanceToSea: [],
        type: "EXCURSION",
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("2");
    });

    it("filters excursions by full-day range (>8)", () => {
      const result = applyPostFilters(excursionServices, {
        durations: ["full"],
        distanceToSea: [],
        type: "EXCURSION",
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("3");
    });

    it("does not apply duration filter for non-EXCURSION type", () => {
      const result = applyPostFilters(excursionServices, {
        durations: ["2"],
        distanceToSea: [],
        type: "TOUR",
      });
      expect(result).toHaveLength(3);
    });
  });

  describe("distanceToSea filter", () => {
    it("filters hotels by distance 0 (on beach)", () => {
      const result = applyPostFilters(hotelServices, {
        durations: [],
        distanceToSea: ["0"],
        type: "HOTEL",
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("4");
    });
  });

  // Note: nights filter tests removed — nights filtering moved to Prisma level
  // in applyTourFilters using the nights Int? field

  describe("combined filters", () => {
    it("applies multiple post-filters together", () => {
      const result = applyPostFilters(excursionServices, {
        durations: ["full"],
        distanceToSea: [],
        type: "EXCURSION",
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("3");
    });
  });

  describe("no filters", () => {
    it("returns all services when no filters specified", () => {
      const result = applyPostFilters(hotelServices, {
        durations: [],
        distanceToSea: [],
        type: "HOTEL",
      });
      expect(result).toHaveLength(3);
    });
  });
});
