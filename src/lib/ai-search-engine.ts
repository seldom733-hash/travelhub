/**
 * Rule-based AI Search Engine for TravelHub
 * Parses natural language travel queries (Russian) into structured search parameters.
 * No external API required — uses regex patterns and keyword dictionaries.
 */

export interface ParsedQuery {
  destination: string | null;
  country: string | null;
  serviceTypes: string[];
  budget: number | null;
  duration: number | null;
  guests: number;
  preferences: string[];
  amenities: string[];
  dateFrom: string | null;
  dateTo: string | null;
  isNaturalLanguage: boolean;
  summary: string;
}

// ─── Country / City dictionaries ───────────────────────────────────────────────

const countryMap: Record<string, string> = {
  турция: "Турция", турции: "Турция", турцию: "Турция", турцией: "Турция",
  стамбул: "Турция", стамбула: "Турция", стамбуле: "Турция",
  анталья: "Турция", антальи: "Турция", анталью: "Турция",
  кемер: "Турция", кемера: "Турция",
  каппадокия: "Турция", каппадокии: "Турция",
  оаэ: "ОАЭ",
  дубай: "ОАЭ", дубая: "ОАЭ", дубае: "ОАЭ",
  абудаби: "ОАЭ",
  италия: "Италия", италии: "Италия", италию: "Италия",
  рим: "Италия", рима: "Италия", риме: "Италия",
  венеция: "Италия", венеции: "Италия",
  испания: "Испания", испании: "Испания", испанию: "Испания",
  барселона: "Испания", барселоны: "Испания",
  греция: "Греция", греции: "Греция", грецию: "Греция",
  санторини: "Греция", корфу: "Греция", крит: "Греция",
  египет: "Египет", египта: "Египет", египте: "Египет",
  хургада: "Египет", шарм: "Египет",
  чехия: "Чехия", чехии: "Чехия",
  прага: "Чехия", праги: "Чехия", праге: "Чехия",
  грузия: "Грузия", грузии: "Грузия", грузию: "Грузия",
  тбилиси: "Грузия", батуми: "Грузия",
  азербайджан: "Азербайджан", азербайджана: "Азербайджан",
  баку: "Азербайджан",
  мальдивы: "Мальдивы", мальдив: "Мальдивы", мальдивах: "Мальдивы",
  таиланд: "Таиланд", таиланда: "Таиланд", таиланде: "Таиланд",
  пхукет: "Таиланд", паттайя: "Таиланд", бангкок: "Таиланд",
  индонезия: "Индонезия", бали: "Индонезия",
  франция: "Франция", франции: "Франция", францию: "Франция",
  париж: "Франция",
  россия: "Россия", россии: "Россия",
  москва: "Россия",
};

const cityToCountry: Record<string, string> = {
  стамбул: "Турция", анталья: "Турция", кемер: "Турция", каппадокия: "Турция",
  дубай: "ОАЭ", абудаби: "ОАЭ",
  рим: "Италия", венеция: "Италия", милан: "Италия",
  барселона: "Испания", мадрид: "Испания",
  санторини: "Греция", корфу: "Греция", крит: "Греция",
  хургада: "Египет", шарм: "Египет",
  прага: "Чехия",
  тбилиси: "Грузия", батуми: "Грузия",
  баку: "Азербайджан",
  пхукет: "Таиланд", паттайя: "Таиланд", бангкок: "Таиланд",
  бали: "Индонезия",
  париж: "Франция",
  москва: "Россия",
};

// ─── Intent / preference keywords ──────────────────────────────────────────────

const serviceKeywords: Record<string, string[]> = {
  TOUR: ["тур", "путешествие", "отпуск", "круиз", "горящий", "горящие", "горячий", "горячие"],
  HOTEL: ["отель", "отеля", "отеле", "гостиница", "проживание", "номер", "заселение", "бронирование номера"],
  SANATORIUM: ["санаторий", "санатория", "санатории", "лечение", "оздоровление", "реабилитация"],
  EXCURSION: ["экскурсия", "экскурсии", "экскурсию", "экскурсией", "осмотр", "музей", "достопримечательности"],
  GUIDE: ["гид", "гида", "гиде", "экскурсовод", "проводник"],
  PHOTOGRAPHER: ["фотограф", "фотографа", "фотографе", "фотосессия", "фото"],
  TRANSFER: ["трансфер", "трансфера", "трансфере", "перевозка", "встреча", "аэропорт"],
  FLIGHT: ["авиабилет", "авиабилеты", "перелёт", "перелет", "рейс", "самолёт", "аэропорт вылета"],
  TRAIN: ["ж/д", "железнодорожный", "поезд", "поезда", "вагон", "билет на поезд"],
};

const preferenceKeywords: Record<string, string> = {
  море: "sea", у_моря: "sea", морем: "sea", пляж: "beach", пляжный: "beach",
  горы: "mountains", горах: "mountains", горный: "mountains", горнолыжный: "ski",
  все_включено: "all_inclusive", all_inclusive: "all_inclusive", allinclusive: "all_inclusive",
  семейный: "family", семья: "family", с_детьми: "family", детский: "family",
  романтика: "romantic", романтический: "romantic", медовый: "romantic",
  бюджетный: "budget", дешево: "budget", дешёвый: "budget", недорого: "budget",
  премиум: "premium", люкс: "premium", элитный: "premium",
  экскурсии: "excursions", экскурсий: "excursions",
};

// Amenity keywords that map to ServiceAmenity names
const amenityKeywords: Record<string, string> = {
  бассейн: "Бассейн", бассейном: "Бассейн", "с бассейном": "Бассейн",
  спа: "Спа", "спа центр": "Спа", "спа-центр": "Спа",
  wifi: "Wi-Fi", вайфай: "Wi-Fi",
  парковка: "Парковка", паркинг: "Парковка",
  завтрак: "Завтрак", завтраком: "Завтрак", "с завтраком": "Завтрак",
  ресторан: "Ресторан", "с рестораном": "Ресторан",
  бар: "Бар", "с баром": "Бар",
  фитнес: "Фитнес", спортзал: "Фитнес",
  кондиционер: "Кондиционер", кондиционером: "Кондиционер",
  камера: "Камера", "видеонаблюдение": "Камера",
  лифт: "Лифт",
  аквапарк: "Детская площадка",
};

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseTravelQuery(input: string): ParsedQuery {
  const normalized = input
    .toLowerCase()
    .replace(/[!?.,;:]+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const isNaturalLanguage = /\b(хочу|нужен|нужна|нужно|ищу|хотел|хотела|подбер|найд|дай|дайте|рекоменд|посоветуй|что\s+есть|что\s+есть\s+хорош)\b/i.test(normalized);

  // Extract destination
  let destination: string | null = null;
  let country: string | null = null;

  for (const [keyword, c] of Object.entries(cityToCountry)) {
    if (normalized.includes(keyword)) {
      destination = keyword.charAt(0).toUpperCase() + keyword.slice(1);
      country = c;
      break;
    }
  }

  if (!country) {
    for (const [keyword, c] of Object.entries(countryMap)) {
      if (normalized.includes(keyword)) {
        country = c;
        break;
      }
    }
  }

  // Extract service types
  const serviceTypes: string[] = [];
  for (const [type, keywords] of Object.entries(serviceKeywords)) {
    for (const kw of keywords) {
      if (normalized.includes(kw)) {
        serviceTypes.push(type);
        break;
      }
    }
  }

  // Extract budget
  let budget: number | null = null;
  // Pattern: "до 1000", "бюджет 1000", "максимум 1500", "не дороже 800"
  const budgetPatterns = [
    /до\s+(\d[\d\s]*)/,
    /бюджет\s+(\d[\d\s]*)/,
    /максимум\s+(\d[\d\s]*)/,
    /не\s+дороже\s+(\d[\d\s]*)/,
    /макс\.?\s+(\d[\d\s]*)/,
    /(\d[\d\s]*)\s*(?:азн|usd|\$|₽|евро)/i,
    /за\s+(\d[\d\s]*)/,
  ];

  for (const pattern of budgetPatterns) {
    const match = normalized.match(pattern);
    if (match) {
      budget = parseInt(match[1].replace(/\s/g, ""), 10);
      if (budget > 0 && budget < 100000) break;
      budget = null;
    }
  }

  // Extract duration
  let duration: number | null = null;
  const durationPatterns = [
    /на\s+(\d+)\s*(?:дн|день|дня|дней)/,
    /(\d+)\s*(?:дн|день|дня|дней)/,
    /на\s+неделю/,
    /недел[яью]/,
    /на\s+две\s+недели/,
    /две\s+недели/,
    /на\s+(\d+)\s*нед/,
    /(\d+)\s*нед/,
  ];

  for (const pattern of durationPatterns) {
    const match = normalized.match(pattern);
    if (match) {
      if (pattern.source.includes("недел")) {
        if (pattern.source.includes("две")) {
          duration = 14;
        } else {
          const weekMatch = normalized.match(/на\s+(\d+)\s*нед/);
          duration = weekMatch ? parseInt(weekMatch[1]) * 7 : 7;
        }
      } else {
        duration = parseInt(match[1], 10);
      }
      if (duration > 0 && duration <= 365) break;
      duration = null;
    }
  }

  // Extract guests
  let guests = 2; // default
  const guestPatterns = [
    /для\s+тр[оиеаю]\w*/,
    /трое/,
    /3\s*(?:чел|человек|турист)/,
    /для\s+четыр[еёаю]\w*/,
    /четверо/,
    /4\s*(?:чел|человек|турист)/,
    /для\s+(?:двух|двоих)/,
    /вдвоём/,
    /вдвоем/,
    /для\s+одного/,
    /один\s*(?:чел|человек|турист)/,
    /втроем/,
    /втроём/,
    /для\s+пяти/,
    /пятеро/,
    /5\s*(?:чел|человек|турист)/,
  ];

  if (/трое|втроем|втроём|для\s+тр[оиеаю]/.test(normalized)) guests = 3;
  else if (/четверо|для\s+четыр[еёаю]/.test(normalized)) guests = 4;
  else if (/пятеро|для\s+пяти/.test(normalized)) guests = 5;
  else if (/один\s*(?:чел|турист)|для\s+одного/.test(normalized)) guests = 1;
  else if (/для\s+(?:двух|двоих)|вдво[ёмем]/.test(normalized)) guests = 2;

  // Extract preferences
  const preferences: string[] = [];
  for (const [keyword, pref] of Object.entries(preferenceKeywords)) {
    const kw = keyword.replace(/_/g, " ");
    if (normalized.includes(kw)) {
      preferences.push(pref);
    }
  }
  const uniquePrefs = [...new Set(preferences)];

  // Extract amenity requirements
  const amenities: string[] = [];
  for (const [keyword, amenity] of Object.entries(amenityKeywords)) {
    const kw = keyword.replace(/_/g, " ");
    if (normalized.includes(kw)) {
      amenities.push(amenity);
    }
  }
  const uniqueAmenities = [...new Set(amenities)];

  // Infer service types from preferences if none explicitly stated
  if (serviceTypes.length === 0) {
    if (uniquePrefs.some((p) => ["sea", "beach", "all_inclusive", "ski", "mountains"].includes(p))) {
      serviceTypes.push("TOUR", "HOTEL");
    }
    if (uniquePrefs.includes("excursions")) {
      serviceTypes.push("EXCURSION");
    }
  }

  // Default service types if nothing matched
  if (serviceTypes.length === 0) {
    serviceTypes.push("TOUR", "HOTEL", "EXCURSION");
  }

  // Build summary
  const parts: string[] = [];
  if (destination) parts.push(`Направление: ${destination}`);
  if (country) parts.push(`Страна: ${country}`);
  if (budget) parts.push(`Бюджет: до ${budget} AZN`);
  if (duration) parts.push(`Длительность: ${duration} дн.`);
  parts.push(`Туристов: ${guests}`);
  if (uniquePrefs.length > 0) parts.push(`Предпочтения: ${uniquePrefs.join(", ")}`);

  const summary = isNaturalLanguage
    ? `AI-подборка: ${parts.join(" | ")}`
    : `Поиск: ${parts.join(" | ")}`;

  return {
    destination,
    country,
    serviceTypes: [...new Set(serviceTypes)],
    budget,
    duration,
    guests,
    preferences: uniquePrefs,
    amenities: uniqueAmenities,
    dateFrom: null,
    dateTo: null,
    isNaturalLanguage,
    summary,
  };
}

/**
 * Detect if a query looks like natural language (for showing "Try AI search" hint)
 */
export function isNaturalLanguageQuery(input: string): boolean {
  const normalized = input.toLowerCase().trim();
  if (normalized.length < 5) return false;
  const nlPatterns = ["хочу", "нужен", "нужна", "нужно", "ищу", "хотел", "хотела", "подбер", "найди", "дай", "рекоменд", "посоветуй", "что есть", "хочется"];
  return nlPatterns.some((p) => normalized.includes(p));
}
