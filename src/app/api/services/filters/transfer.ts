import { FilterContext } from "./types";
import { TRANSFER_CAR_CLASS_KEYWORDS, CAPACITY_MAP, MEETING_KEYWORDS } from "./keywords";
import { buildKeywordOrConditions, resolveKeywords } from "./helpers";

/** Apply transfer-specific filters */
export function applyTransferFilters(ctx: FilterContext): void {
  const { searchParams, type, andConditions } = ctx;

  // ── Transfer car class filter ──
  const carClasses = searchParams.getAll("carClass");
  if (carClasses.length > 0 && type === "TRANSFER") {
    const TRANSFER_CAR_KEYWORDS_CLEAN: Record<string, string[]> = {
      economy: ["Эконом", "Ekonom", "Economy"],
      comfort: ["Комфорт", "Komfort", "Comfort"],
      business: ["Бизнес", "Biznes", "Business", "VIP", "vip"],
      van: ["Минивэн", "Miniven", "Minivan"],
      minibus: ["Микроавтобус", "Mikroavtobus", "Minibus"],
    };
    const carKeywordArrays = carClasses
      .map(v => TRANSFER_CAR_KEYWORDS_CLEAN[v] || TRANSFER_CAR_CLASS_KEYWORDS[v])
      .filter(Boolean);
    if (carKeywordArrays.length > 0) {
      andConditions.push({ OR: buildKeywordOrConditions(carKeywordArrays) });
    }
  }

  // ── Transfer capacity filter ──
  const capacities = searchParams.getAll("capacity");
  if (capacities.length > 0 && type === "TRANSFER") {
    const maxCapacity = Math.max(...capacities.map(c => CAPACITY_MAP[c] || 0));
    if (maxCapacity > 0) {
      andConditions.push({
        OR: [
          { maxGuests: { gte: maxCapacity } },
          { description: { contains: `${maxCapacity}` } },
        ],
      });
    }
  }

  // ── Transfer meeting type filter ──
  const meetingTypes = searchParams.getAll("meetingType");
  if (meetingTypes.length > 0 && type === "TRANSFER") {
    const mtKeywordArrays = resolveKeywords(meetingTypes, MEETING_KEYWORDS);
    if (mtKeywordArrays.length > 0) {
      andConditions.push({
        OR: mtKeywordArrays.map(keywords => ({
          OR: keywords.map(kw => ({ description: { contains: kw } })),
        })),
      });
    }
  }
}
