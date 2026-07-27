/* ── Numeric parsing ── */

/** Parse a string to a finite number, returning null if invalid. */
export function parseNumericParam(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Parse an array of strings to an array of valid numbers within an optional range. */
export function parseNumericArray(
  values: string[],
  min?: number,
  max?: number
): number[] {
  return values
    .filter(v => v.trim() !== "")
    .map(Number)
    .filter(n => Number.isFinite(n) && (min === undefined || n >= min) && (max === undefined || n <= max));
}

/* ── Duration range parsing ── */
export function parseDurationHours(duration: string | null): number | null {
  if (!duration) return null;
  const match = duration.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

export function durationFitsRange(hours: number | null, range: string): boolean {
  if (hours === null) return false;
  switch (range) {
    case "2": return hours <= 2;
    case "4": return hours > 2 && hours <= 4;
    case "8": return hours > 4 && hours <= 8;
    case "full": return hours > 8;
    case "multi": return hours > 24;
    default: return true;
  }
}

/* ── Nights range parsing ── */

/** Parse a nights range string into min/max values for Prisma WHERE */
export function parseNightsRange(range: string): { gte: number; lte: number } | null {
  switch (range) {
    case "1-3": return { gte: 1, lte: 3 };
    case "4-7": return { gte: 4, lte: 7 };
    case "8-14": return { gte: 8, lte: 14 };
    case "15+": return { gte: 15, lte: 999 };
    default: return null;
  }
}

export function matchesKeywords(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some(kw => lower.includes(kw.toLowerCase()));
}

/** Build an OR condition from keyword arrays — matches any keyword in each array */
export function buildKeywordOrConditions(
  keywordArrays: string[][],
  fields: string[] = ["title", "description"]
): Record<string, unknown>[] {
  return keywordArrays.map(keywords => ({
    OR: keywords.flatMap(kw =>
      fields.map(f => ({ [f]: { contains: kw } }))
    ),
  }));
}

/** Get keyword arrays for given filter values from a keyword map */
export function resolveKeywords(
  values: string[],
  keywordMap: Record<string, string[]>
): string[][] {
  return values
    .map(v => keywordMap[v])
    .filter(Boolean) as string[][];
}
