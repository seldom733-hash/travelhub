// Region → country codes mapping for tour filtering
// Used by /api/countries/route.ts and /api/services/route.ts
// Uses ISO 3166-1 alpha-2 codes (locale-independent)

export const regionCountryMap: Record<string, string[]> = {
  western_europe: ["FR", "DE", "IT", "ES", "PT", "NL", "BE", "CH", "AT", "GB", "IE"],
  eastern_europe: ["TR", "GR", "ME", "HR", "BG", "RO", "HU", "CZ", "PL", "GE", "AM"],
  central_asia: ["KZ", "UZ", "KG", "TJ", "TM"],
  middle_east: ["AE", "IL", "JO", "OM", "QA", "BH", "SA"],
  south_asia: ["IN", "LK", "NP", "MV", "BD"],
  southeast_asia: ["TH", "VN", "ID", "PH", "MY", "SG", "KH", "MM", "LA"],
  east_asia: ["CN", "JP", "KR", "TW"],
  north_america: ["US", "CA", "MX"],
  latin_america: ["BR", "AR", "CL", "CO", "PE", "EC", "BO", "UY"],
  caribbean: ["CU", "DO", "JM", "PR", "BB", "AW"],
  africa: ["EG", "MA", "TN", "ZA", "KE", "TZ"],
  australia_oceania: ["AU", "NZ", "FJ"],
};
