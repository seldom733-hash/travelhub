import { describe, it, expect } from "vitest";
import {
  ROOM_TYPES,
  BED_TYPES,
  VIEWS,
  SMOKING_OPTIONS,
  BALCONY_OPTIONS,
  BATHROOM_OPTIONS,
} from "@/lib/constants";
import {
  ROOM_TYPE_MAP,
  BED_TYPE_MAP,
  VIEW_MAP,
  SMOKING_MAP,
  BALCONY_MAP,
  BATHROOM_MAP,
} from "../keywords";

/**
 * Verifies that every key in a keyword map exists in the corresponding
 * shared constant array. This catches drift when someone adds a key to
 * one file but forgets the other.
 */
function expectMapKeysMatchArray(
  mapKeys: string[],
  arrayValues: readonly string[] | string[],
  mapName: string,
  arrayName: string,
) {
  const arraySet = new Set(arrayValues);

  // Every map key must exist in the shared array
  const missingFromArray = mapKeys.filter((k) => !arraySet.has(k));
  expect(
    missingFromArray,
    `${mapName} has keys not in ${arrayName}: ${missingFromArray.join(", ")}`,
  ).toEqual([]);

  // Every shared array value must have a corresponding map key
  const missingFromMap = arrayValues.filter((k) => !mapKeys.includes(k));
  expect(
    missingFromMap,
    `${arrayName} has values not in ${mapName}: ${missingFromMap.join(", ")}`,
  ).toEqual([]);
}

describe("Constants sync between @/lib/constants and keywords.ts", () => {
  it("ROOM_TYPE_MAP keys match ROOM_TYPES array", () => {
    expectMapKeysMatchArray(
      Object.keys(ROOM_TYPE_MAP),
      ROOM_TYPES,
      "ROOM_TYPE_MAP",
      "ROOM_TYPES",
    );
  });

  it("BED_TYPE_MAP keys match BED_TYPES array", () => {
    expectMapKeysMatchArray(
      Object.keys(BED_TYPE_MAP),
      BED_TYPES,
      "BED_TYPE_MAP",
      "BED_TYPES",
    );
  });

  it("VIEW_MAP keys match VIEWS array", () => {
    expectMapKeysMatchArray(
      Object.keys(VIEW_MAP),
      VIEWS,
      "VIEW_MAP",
      "VIEWS",
    );
  });

  it("SMOKING_MAP keys match SMOKING_OPTIONS array", () => {
    expectMapKeysMatchArray(
      Object.keys(SMOKING_MAP),
      SMOKING_OPTIONS,
      "SMOKING_MAP",
      "SMOKING_OPTIONS",
    );
  });

  it("BALCONY_MAP keys match BALCONY_OPTIONS array", () => {
    expectMapKeysMatchArray(
      Object.keys(BALCONY_MAP),
      BALCONY_OPTIONS,
      "BALCONY_MAP",
      "BALCONY_OPTIONS",
    );
  });

  it("BATHROOM_MAP keys match BATHROOM_OPTIONS array", () => {
    expectMapKeysMatchArray(
      Object.keys(BATHROOM_MAP),
      BATHROOM_OPTIONS,
      "BATHROOM_MAP",
      "BATHROOM_OPTIONS",
    );
  });
});
