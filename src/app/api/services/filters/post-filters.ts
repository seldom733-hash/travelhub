import { parseDurationHours, durationFitsRange } from "./helpers";

/** Apply post-fetch filters that can't be done in Prisma WHERE */
export function applyPostFilters<T extends Record<string, unknown>>(
  services: T[],
  filters: {
    durations: string[];
    distanceToSea: string[];
    type: string | null;
  }
): T[] {
  let result = services;

  // Duration filter for excursions
  if (filters.durations.length > 0 && filters.type === "EXCURSION") {
    result = result.filter(s => {
      const hours = parseDurationHours(s.duration as string | null);
      return filters.durations.some(d => durationFitsRange(hours, d));
    });
  }

  // Distance to sea filter for hotels
  if (filters.distanceToSea.length > 0 && filters.type === "HOTEL") {
    result = result.filter(s => {
      const desc = (s.description as string || "").toLowerCase();
      return filters.distanceToSea.some(d => {
        if (d === "0") return desc.includes("пляж") || desc.includes("на пляже") || desc.includes("çimərlikdə");
        if (d === "100") return desc.includes("100") || desc.includes("пляж");
        if (d === "500") return desc.includes("500") || desc.includes("пляж");
        if (d === "1000") return desc.includes("1км") || desc.includes("1 км") || desc.includes("1 km") || desc.includes("пляж");
        return true;
      });
    });
  }

  // Note: nights filtering moved to Prisma level in applyTourFilters
  // using the nights Int? field for better performance

  return result;
}
