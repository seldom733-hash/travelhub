import {
  ROOM_TYPES, BED_TYPES, VIEWS,
  SMOKING_OPTIONS, BALCONY_OPTIONS, BATHROOM_OPTIONS,
  AREA_OPTIONS, OCCUPANCY_OPTIONS,
} from "@/lib/constants";

export type FilterType = "checkbox" | "radio" | "range" | "rating" | "date" | "country" | "city" | "region";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterDefinition {
  id: string;
  i18nKey: string;
  type: FilterType;
  options?: FilterOption[];
  min?: number;
  max?: number;
  /** Optional group header — filters sharing the same group are visually grouped under a label. */
  group?: string;
}

export type ServiceCategory = "tour" | "hotel" | "sanatorium" | "excursion" | "guide" | "photographer" | "flight" | "train" | "transfer";

// ── Helpers: generate FilterOption[] from shared constant arrays ──

/** Map a slug array to FilterOption[] using a label prefix (e.g. "filter.hotel.roomTypes") */
function slugOptions(slugs: readonly string[], labelPrefix: string): FilterOption[] {
  return slugs.map(s => ({ label: `${labelPrefix}.${s}`, value: s }));
}

/** Room type options with i18n labels */
const roomTypeOptions = slugOptions(ROOM_TYPES, "filter.hotel.roomTypes");

/** Bed type options with i18n labels */
const bedTypeOptions = slugOptions(BED_TYPES, "filter.hotel.bedTypes");

/** Label maps for options where i18n keys don't follow the `${prefix}.${slug}` pattern */
const VIEW_LABELS: Record<string, string> = {
  city: "filter.hotel.viewCity", sea: "filter.hotel.viewSea",
  sea_direct: "filter.hotel.viewSeaDirect", sea_partial: "filter.hotel.viewSeaPartial",
  pool: "filter.hotel.viewPool", garden: "filter.hotel.viewGarden",
  mountain: "filter.hotel.viewMountain", lake: "filter.hotel.viewLake",
  park: "filter.hotel.viewPark", river: "filter.hotel.viewRiver",
  no_view: "filter.hotel.viewNoView", panoramic: "filter.hotel.viewPanoramic",
};
const viewOptions: FilterOption[] = VIEWS.map(s => ({ label: VIEW_LABELS[s] ?? s, value: s }));

const SMOKING_LABELS: Record<string, string> = {
  non_smoking: "filter.hotel.nonSmoking", smoking: "filter.hotel.smokingOption",
};
const smokingOptions: FilterOption[] = SMOKING_OPTIONS.map(s => ({ label: SMOKING_LABELS[s] ?? s, value: s }));

const BALCONY_LABELS: Record<string, string> = {
  no_balcony: "filter.hotel.noBalcony", balcony: "filter.hotel.balconyOption",
  french_balcony: "filter.hotel.frenchBalcony", terrace: "filter.hotel.terrace",
  private_garden: "filter.hotel.privateGarden",
};
const balconyOptions: FilterOption[] = BALCONY_OPTIONS.map(s => ({ label: BALCONY_LABELS[s] ?? s, value: s }));

const BATHROOM_LABELS: Record<string, string> = {
  shower: "filter.hotel.shower", bathtub: "filter.hotel.bathtub",
  jacuzzi: "filter.hotel.jacuzzi", private_pool: "filter.hotel.privatePool",
  shared: "filter.hotel.sharedBathroom",
};
const bathroomOptions: FilterOption[] = BATHROOM_OPTIONS.map(s => ({ label: BATHROOM_LABELS[s] ?? s, value: s }));

const AREA_LABELS: Record<string, string> = {
  under_20: "filter.hotel.under20", "20_30": "filter.hotel.area20_30",
  "30_50": "filter.hotel.area30_50", over_50: "filter.hotel.over50",
};
const areaOptions: FilterOption[] = AREA_OPTIONS.map(s => ({ label: AREA_LABELS[s] ?? s, value: s }));

const OCCUPANCY_LABELS: Record<string, string> = {
  sgl: "SGL", dbl: "DBL", twn: "TWN", tpl: "TPL", qdpl: "QDPL",
  "2_1": "2+1", "2_2": "2+2", "3_1": "3+1", "4_1": "4+1",
};
const occupancyOptions: FilterOption[] = OCCUPANCY_OPTIONS.map(s => ({ label: OCCUPANCY_LABELS[s] ?? s, value: s }));

/** Stars filter options (used by tour, hotel, sanatorium) */
const starsOptions: FilterOption[] = [
  { label: "filter.stars.none", value: "none" },
  { label: "★★★★★", value: "5" },
  { label: "★★★★", value: "4" },
  { label: "★★★", value: "3" },
  { label: "★★", value: "2" },
  { label: "★", value: "1" },
];

export const filterConfigs: Record<ServiceCategory, FilterDefinition[]> = {
  // Туры: Страна, Город, Звёзды, Ночей, Питание, Тип отдыха, Первая линия, Всё включено, Для детей, SPA, Аквапарк, Горящие, Без визы, Рейтинг, Цена
  tour: [
    // ── Туры ──
    { id: "country", i18nKey: "filter.country", type: "country" },
    { id: "city", i18nKey: "filter.city", type: "city" },
    { id: "startDate", i18nKey: "filter.startDate.tour", type: "date" },
    { id: "nights", i18nKey: "filter.tour.nights", type: "radio", options: [
      { label: "filter.tour.nights0", value: "0" },
      { label: "filter.tour.nights1_3", value: "1-3" },
      { label: "filter.tour.nights4_7", value: "4-7" },
      { label: "filter.tour.nights8_14", value: "8-14" },
      { label: "filter.tour.nights15plus", value: "15+" },
    ]},
    { id: "meal", i18nKey: "filter.tour.meal", type: "checkbox", options: [
      { label: "filter.tour.noMeals", value: "none" },
      { label: "filter.tour.breakfast", value: "breakfast" },
      { label: "filter.tour.halfBoard", value: "half" },
      { label: "filter.tour.fullBoard", value: "full" },
      { label: "filter.tour.allInclusive", value: "all_inclusive" },
    ]},
    { id: "tourType", i18nKey: "filter.tour.type", type: "checkbox", options: [
      { label: "filter.tour.beach", value: "beach" },
      { label: "filter.tour.group", value: "group" },
      { label: "filter.tour.individual", value: "individual" },
      { label: "filter.tour.cruise", value: "cruise" },
      { label: "filter.tour.ski", value: "ski" },
    ]},
    { id: "firstLine", i18nKey: "filter.tour.firstLine", type: "checkbox", options: [
      { label: "filter.tour.firstLine", value: "first_line" },
    ]},
    { id: "allInclusive", i18nKey: "filter.tour.allInclusive", type: "checkbox", options: [
      { label: "filter.tour.allInclusive", value: "all_inclusive" },
    ]},
    { id: "kids", i18nKey: "filter.tour.kids", type: "checkbox", options: [
      { label: "filter.tour.kids", value: "kids" },
    ]},
    { id: "waterpark", i18nKey: "filter.tour.waterpark", type: "checkbox", options: [
      { label: "filter.hotel.waterpark", value: "waterpark" },
    ]},
    { id: "hotTour", i18nKey: "filter.tour.hotTour", type: "checkbox", options: [
      { label: "filter.tour.hotTour", value: "hot" },
    ]},
    { id: "visa", i18nKey: "filter.tour.visa", type: "radio", options: [
      { label: "filter.tour.visaFree", value: "free" },
      { label: "filter.tour.visaRequired", value: "required" },
    ]},
    { id: "price", i18nKey: "filter.price", type: "range", min: 0, max: 10000 },
    { id: "rating", i18nKey: "filter.rating", type: "rating" },
    // ── Фильтры отеля ──
    { id: "stars", i18nKey: "filter.tour.stars", type: "checkbox", group: "hotel", options: starsOptions },
    { id: "view", i18nKey: "filter.hotel.view", type: "checkbox", group: "hotel", options: viewOptions },
    { id: "smoking", i18nKey: "filter.hotel.smoking", type: "checkbox", group: "hotel", options: smokingOptions },
    { id: "balcony", i18nKey: "filter.hotel.balcony", type: "checkbox", group: "hotel", options: balconyOptions },
    { id: "bathroom", i18nKey: "filter.hotel.bathroom", type: "checkbox", group: "hotel", options: bathroomOptions },
    { id: "area", i18nKey: "filter.hotel.area", type: "checkbox", group: "hotel", options: areaOptions },
    { id: "occupancy", i18nKey: "filter.hotel.occupancy", type: "checkbox", group: "hotel", options: occupancyOptions },
    { id: "amenities", i18nKey: "filter.hotel.amenities", type: "checkbox", group: "hotel", options: [
      { label: "filter.hotel.pool", value: "pool" },
      { label: "filter.hotel.spa", value: "spa" },
      { label: "filter.hotel.wifi", value: "wifi" },
      { label: "filter.hotel.parking", value: "parking" },
      { label: "filter.hotel.gym", value: "gym" },
      { label: "filter.hotel.beach", value: "beach" },
      { label: "filter.hotel.waterpark", value: "waterpark" },
      { label: "filter.hotel.kidsClub", value: "kids_club" },
    ]},
    { id: "roomAmenities", i18nKey: "filter.hotel.roomAmenities", type: "checkbox", group: "hotel", options: [
      { label: "filter.hotel.wifiRoom", value: "wifi" },
      { label: "filter.hotel.aircon", value: "aircon" },
      { label: "filter.hotel.minibar", value: "minibar" },
      { label: "filter.hotel.safe", value: "safe" },
      { label: "filter.hotel.tv", value: "tv" },
      { label: "filter.hotel.coffee", value: "coffee" },
      { label: "filter.hotel.kettle", value: "kettle" },
      { label: "filter.hotel.desk", value: "desk" },
      { label: "filter.hotel.kitchen", value: "kitchen" },
      { label: "filter.hotel.fridge", value: "fridge" },
      { label: "filter.hotel.microwave", value: "microwave" },
      { label: "filter.hotel.washer", value: "washer" },
      { label: "filter.hotel.hairdryer", value: "hairdryer" },
      { label: "filter.hotel.bathrobes", value: "bathrobes" },
      { label: "filter.hotel.slippers", value: "slippers" },
      { label: "filter.hotel.iron", value: "iron" },
    ]},
    { id: "distanceToSea", i18nKey: "filter.hotel.distanceToSea", type: "radio", group: "hotel", options: [
      { label: "filter.hotel.onBeach", value: "0" },
      { label: "filter.hotel.within100m", value: "100" },
      { label: "filter.hotel.within500m", value: "500" },
      { label: "filter.hotel.within1km", value: "1000" },
    ]},
    { id: "petsAllowed", i18nKey: "filter.hotel.petsAllowed", type: "checkbox", group: "hotel", options: [
      { label: "filter.hotel.petsAllowed", value: "pets" },
    ]},
    // ── Фильтры авиарейса ──
    { id: "stops", i18nKey: "filter.flight.stops", type: "radio", group: "flight", options: [
      { label: "filter.flight.direct", value: "0" },
      { label: "filter.flight.oneStop", value: "1" },
      { label: "filter.flight.twoPlus", value: "2+" },
    ]},
    { id: "airline", i18nKey: "filter.flight.airline", type: "checkbox", group: "flight", options: [
      { label: "filter.flight.airlines.azal", value: "azal" },
      { label: "filter.flight.airlines.turkish", value: "turkish" },
      { label: "filter.flight.airlines.flydubai", value: "flydubai" },
      { label: "filter.flight.airlines.s7", value: "s7" },
      { label: "filter.flight.airlines.qatar", value: "qatar" },
    ]},
    { id: "departureTime", i18nKey: "filter.flight.departureTime", type: "checkbox", group: "flight", options: [
      { label: "filter.flight.morning", value: "morning" },
      { label: "filter.flight.afternoon", value: "afternoon" },
      { label: "filter.flight.evening", value: "evening" },
      { label: "filter.flight.night", value: "night" },
    ]},
    { id: "baggage", i18nKey: "filter.flight.baggage", type: "radio", group: "flight", options: [
      { label: "filter.flight.cabinOnly", value: "cabin" },
      { label: "filter.flight.checked", value: "checked" },
    ]},
  ],
  // Отели: Страна, Город, Звёзды, Питание, Тип номера, Тип кроватей, Вид из окна, Курение, Балкон, Санузел, Площадь, Вместимость, Удобства, Рейтинг, Цена
  hotel: [
    { id: "country", i18nKey: "filter.country", type: "country" },
    { id: "city", i18nKey: "filter.city", type: "city" },
    { id: "startDate", i18nKey: "filter.startDate.hotel", type: "date" },
    { id: "stars", i18nKey: "filter.hotel.stars", type: "checkbox", options: starsOptions },
    { id: "roomType", i18nKey: "filter.hotel.roomType", type: "checkbox", options: roomTypeOptions },
    { id: "bedType", i18nKey: "filter.hotel.bedType", type: "checkbox", options: bedTypeOptions },
    { id: "meal", i18nKey: "filter.hotel.meal", type: "checkbox", options: [
      { label: "filter.tour.noMeals", value: "none" },
      { label: "filter.tour.breakfast", value: "breakfast" },
      { label: "filter.tour.halfBoard", value: "half" },
      { label: "filter.tour.fullBoard", value: "full" },
      { label: "filter.tour.allInclusive", value: "all_inclusive" },
    ]},
    { id: "view", i18nKey: "filter.hotel.view", type: "checkbox", options: viewOptions },
    { id: "smoking", i18nKey: "filter.hotel.smoking", type: "checkbox", options: smokingOptions },
    { id: "balcony", i18nKey: "filter.hotel.balcony", type: "checkbox", options: balconyOptions },
    { id: "bathroom", i18nKey: "filter.hotel.bathroom", type: "checkbox", options: bathroomOptions },
    { id: "area", i18nKey: "filter.hotel.area", type: "checkbox", options: areaOptions },
    { id: "occupancy", i18nKey: "filter.hotel.occupancy", type: "checkbox", options: occupancyOptions },
    { id: "amenities", i18nKey: "filter.hotel.amenities", type: "checkbox", options: [
      { label: "filter.hotel.pool", value: "pool" },
      { label: "filter.hotel.spa", value: "spa" },
      { label: "filter.hotel.wifi", value: "wifi" },
      { label: "filter.hotel.parking", value: "parking" },
      { label: "filter.hotel.gym", value: "gym" },
      { label: "filter.hotel.beach", value: "beach" },
      { label: "filter.hotel.waterpark", value: "waterpark" },
      { label: "filter.hotel.kidsClub", value: "kids_club" },
    ]},
    { id: "roomAmenities", i18nKey: "filter.hotel.roomAmenities", type: "checkbox", options: [
      { label: "filter.hotel.wifiRoom", value: "wifi" },
      { label: "filter.hotel.aircon", value: "aircon" },
      { label: "filter.hotel.minibar", value: "minibar" },
      { label: "filter.hotel.safe", value: "safe" },
      { label: "filter.hotel.tv", value: "tv" },
      { label: "filter.hotel.coffee", value: "coffee" },
      { label: "filter.hotel.kettle", value: "kettle" },
      { label: "filter.hotel.desk", value: "desk" },
      { label: "filter.hotel.kitchen", value: "kitchen" },
      { label: "filter.hotel.fridge", value: "fridge" },
      { label: "filter.hotel.microwave", value: "microwave" },
      { label: "filter.hotel.washer", value: "washer" },
      { label: "filter.hotel.hairdryer", value: "hairdryer" },
      { label: "filter.hotel.bathrobes", value: "bathrobes" },
      { label: "filter.hotel.slippers", value: "slippers" },
      { label: "filter.hotel.iron", value: "iron" },
    ]},
    { id: "distanceToSea", i18nKey: "filter.hotel.distanceToSea", type: "radio", options: [
      { label: "filter.hotel.onBeach", value: "0" },
      { label: "filter.hotel.within100m", value: "100" },
      { label: "filter.hotel.within500m", value: "500" },
      { label: "filter.hotel.within1km", value: "1000" },
    ]},
    { id: "petsAllowed", i18nKey: "filter.hotel.petsAllowed", type: "checkbox", options: [
      { label: "filter.hotel.petsAllowed", value: "pets" },
    ]},
    { id: "price", i18nKey: "filter.price", type: "range", min: 0, max: 5000 },
    { id: "rating", i18nKey: "filter.rating", type: "rating" },
    { id: "cancellation", i18nKey: "filter.cancellation", type: "checkbox", options: [
      { label: "filter.options.freeCancel", value: "free_cancel" },
    ]},
  ],
  // Санатории: Страна, Город, Профиль лечения, Минеральные воды, Грязелечение, Кардиология, Опорно-двиг., SPA, Бассейн, Диета, Врач, Рейтинг
  sanatorium: [
    { id: "country", i18nKey: "filter.country", type: "country" },
    { id: "city", i18nKey: "filter.city", type: "city" },
    { id: "startDate", i18nKey: "filter.startDate.sanatorium", type: "date" },
    { id: "stars", i18nKey: "filter.sanatorium.stars", type: "checkbox", options: starsOptions },
    { id: "treatment", i18nKey: "filter.sanatorium.treatment", type: "checkbox", options: [
      { label: "filter.sanatorium.mineralWater", value: "mineral_water" },
      { label: "filter.sanatorium.mudTherapy", value: "mud_therapy" },
      { label: "filter.sanatorium.cardiology", value: "cardiology" },
      { label: "filter.sanatorium.musculoskeletal", value: "musculoskeletal" },
      { label: "filter.sanatorium.joints", value: "joints" },
      { label: "filter.sanatorium.nervous", value: "nervous" },
      { label: "filter.sanatorium.cosmetology", value: "cosmetology" },
      { label: "filter.sanatorium.dental", value: "dental" },
      { label: "filter.sanatorium.detox", value: "detox" },
    ]},
    { id: "amenities", i18nKey: "filter.sanatorium.amenities", type: "checkbox", options: [
      { label: "filter.hotel.pool", value: "pool" },
      { label: "filter.hotel.spa", value: "spa" },
      { label: "filter.hotel.wifi", value: "wifi" },
      { label: "filter.hotel.gym", value: "gym" },
    ]},
    { id: "diet", i18nKey: "filter.sanatorium.diet", type: "checkbox", options: [
      { label: "filter.sanatorium.dietNoSalt", value: "no_salt" },
      { label: "filter.sanatorium.dietVegan", value: "vegan" },
      { label: "filter.sanatorium.dietDiabetic", value: "diabetic" },
      { label: "filter.sanatorium.dietHypo", value: "hypoallergenic" },
    ]},
    { id: "hasDoctor", i18nKey: "filter.sanatorium.hasDoctor", type: "checkbox", options: [
      { label: "filter.sanatorium.hasDoctor", value: "doctor" },
    ]},
    { id: "price", i18nKey: "filter.price", type: "range", min: 0, max: 3000 },
    { id: "rating", i18nKey: "filter.rating", type: "rating" },
  ],
  // Экскурсии: Страна, Город, Категория, Длительность, Язык, Индивидуальная/Групповая, Для детей, Пешая/Автобусная/Морская, Входные билеты включены
  excursion: [
    { id: "country", i18nKey: "filter.country", type: "country" },
    { id: "city", i18nKey: "filter.city", type: "city" },
    { id: "startDate", i18nKey: "filter.startDate.excursion", type: "date" },
    { id: "category", i18nKey: "filter.excursion.category", type: "checkbox", options: [
      { label: "filter.excursion.sightseeing", value: "sightseeing" },
      { label: "filter.excursion.adventure", value: "adventure" },
      { label: "filter.excursion.cultural", value: "cultural" },
      { label: "filter.excursion.nature", value: "nature" },
      { label: "filter.excursion.food", value: "food" },
    ]},
    { id: "duration", i18nKey: "filter.excursion.duration", type: "radio", options: [
      { label: "filter.excursion.upTo2h", value: "2" },
      { label: "filter.excursion.upTo4h", value: "4" },
      { label: "filter.excursion.upTo8h", value: "8" },
      { label: "filter.excursion.fullDay", value: "full" },
      { label: "filter.excursion.multiDay", value: "multi" },
    ]},
    { id: "language", i18nKey: "filter.excursion.language", type: "checkbox", options: [
      { label: "filter.language.ru", value: "ru" },
      { label: "filter.language.en", value: "en" },
      { label: "filter.language.az", value: "az" },
      { label: "filter.language.tr", value: "tr" },
      { label: "filter.language.ar", value: "ar" },
    ]},
    { id: "excursionType", i18nKey: "filter.excursion.type", type: "radio", options: [
      { label: "filter.excursion.group", value: "group" },
      { label: "filter.excursion.individual", value: "individual" },
    ]},
    { id: "kids", i18nKey: "filter.excursion.kids", type: "checkbox", options: [
      { label: "filter.excursion.kids", value: "kids" },
    ]},
    { id: "tourType", i18nKey: "filter.excursion.tourType", type: "checkbox", options: [
      { label: "filter.excursion.walking", value: "walking" },
      { label: "filter.excursion.bus", value: "bus" },
      { label: "filter.excursion.sea", value: "sea" },
    ]},
    { id: "ticketsIncluded", i18nKey: "filter.excursion.ticketsIncluded", type: "checkbox", options: [
      { label: "filter.excursion.ticketsIncluded", value: "tickets_included" },
    ]},
    { id: "price", i18nKey: "filter.price", type: "range", min: 0, max: 500 },
    { id: "rating", i18nKey: "filter.rating", type: "rating" },
  ],
  // Гиды: Страна, Город, Язык, Опыт, Рейтинг, Автомобиль, Лицензия, Специализация
  guide: [
    { id: "country", i18nKey: "filter.country", type: "country" },
    { id: "city", i18nKey: "filter.city", type: "city" },
    { id: "startDate", i18nKey: "filter.startDate.guide", type: "date" },
    { id: "language", i18nKey: "filter.guide.language", type: "checkbox", options: [
      { label: "filter.language.ru", value: "ru" },
      { label: "filter.language.en", value: "en" },
      { label: "filter.language.az", value: "az" },
      { label: "filter.language.tr", value: "tr" },
      { label: "filter.language.de", value: "de" },
      { label: "filter.language.fr", value: "fr" },
    ]},
    { id: "experience", i18nKey: "filter.guide.experience", type: "radio", options: [
      { label: "filter.guide.upTo1year", value: "1" },
      { label: "filter.guide.upTo3years", value: "3" },
      { label: "filter.guide.upTo5years", value: "5" },
      { label: "filter.guide.over5years", value: "5+" },
    ]},
    { id: "hasCar", i18nKey: "filter.guide.hasCar", type: "checkbox", options: [
      { label: "filter.guide.hasCar", value: "car" },
    ]},
    { id: "hasLicense", i18nKey: "filter.guide.hasLicense", type: "checkbox", options: [
      { label: "filter.guide.hasLicense", value: "license" },
    ]},
    { id: "specialization", i18nKey: "filter.guide.specialization", type: "checkbox", options: [
      { label: "filter.guide.history", value: "history" },
      { label: "filter.guide.nature", value: "nature" },
      { label: "filter.guide.museums", value: "museums" },
      { label: "filter.guide.walking", value: "walking" },
      { label: "filter.guide.gastronomy", value: "gastronomy" },
      { label: "filter.guide.adventure", value: "adventure" },
      { label: "filter.guide.vip", value: "vip" },
    ]},
    { id: "price", i18nKey: "filter.price", type: "range", min: 0, max: 500 },
    { id: "rating", i18nKey: "filter.rating", type: "rating" },
  ],
  // Фотографы: Страна, Город, Язык, Опыт, Жанр, Рейтинг
  photographer: [
    { id: "country", i18nKey: "filter.country", type: "country" },
    { id: "city", i18nKey: "filter.city", type: "city" },
    { id: "startDate", i18nKey: "filter.startDate.photographer", type: "date" },
    { id: "language", i18nKey: "filter.photographer.language", type: "checkbox", options: [
      { label: "filter.language.ru", value: "ru" },
      { label: "filter.language.en", value: "en" },
      { label: "filter.language.az", value: "az" },
    ]},
    { id: "experience", i18nKey: "filter.photographer.experience", type: "radio", options: [
      { label: "filter.guide.upTo1year", value: "1" },
      { label: "filter.guide.upTo3years", value: "3" },
      { label: "filter.guide.upTo5years", value: "5" },
      { label: "filter.guide.over5years", value: "5+" },
    ]},
    { id: "genre", i18nKey: "filter.photographer.genre", type: "checkbox", options: [
      { label: "filter.photographer.loveStory", value: "love_story" },
      { label: "filter.photographer.family", value: "family" },
      { label: "filter.photographer.portrait", value: "portrait" },
      { label: "filter.photographer.wedding", value: "wedding" },
      { label: "filter.photographer.individual", value: "individual" },
      { label: "filter.photographer.travel", value: "travel" },
      { label: "filter.photographer.event", value: "event" },
      { label: "filter.photographer.commercial", value: "commercial" },
    ]},
    { id: "price", i18nKey: "filter.price", type: "range", min: 0, max: 2000 },
    { id: "rating", i18nKey: "filter.rating", type: "rating" },
  ],
  // Авиабилеты
  flight: [
    { id: "startDate", i18nKey: "filter.flight.departureDate", type: "date" },
    { id: "stops", i18nKey: "filter.flight.stops", type: "radio", options: [
      { label: "filter.flight.direct", value: "0" },
      { label: "filter.flight.oneStop", value: "1" },
      { label: "filter.flight.twoPlus", value: "2+" },
    ]},
    { id: "airline", i18nKey: "filter.flight.airline", type: "checkbox", options: [
      { label: "filter.flight.airlines.azal", value: "azal" },
      { label: "filter.flight.airlines.turkish", value: "turkish" },
      { label: "filter.flight.airlines.flydubai", value: "flydubai" },
      { label: "filter.flight.airlines.s7", value: "s7" },
      { label: "filter.flight.airlines.qatar", value: "qatar" },
    ]},
    { id: "departureTime", i18nKey: "filter.flight.departureTime", type: "checkbox", options: [
      { label: "filter.flight.morning", value: "morning" },
      { label: "filter.flight.afternoon", value: "afternoon" },
      { label: "filter.flight.evening", value: "evening" },
      { label: "filter.flight.night", value: "night" },
    ]},
    { id: "baggage", i18nKey: "filter.flight.baggage", type: "radio", options: [
      { label: "filter.flight.cabinOnly", value: "cabin" },
      { label: "filter.flight.checked", value: "checked" },
    ]},
    { id: "refundable", i18nKey: "filter.flight.refundable", type: "checkbox", options: [
      { label: "filter.flight.refundable", value: "refundable" },
    ]},
    { id: "price", i18nKey: "filter.price", type: "range", min: 0, max: 5000 },
  ],
  // ЖД билеты
  train: [
    { id: "startDate", i18nKey: "filter.train.departureDate", type: "date" },
    { id: "wagonType", i18nKey: "filter.train.wagonType", type: "checkbox", options: [
      { label: "filter.train.platzkart", value: "platzkart" },
      { label: "filter.train.kupe", value: "kupe" },
      { label: "filter.train.sv", value: "sv" },
      { label: "filter.train.business", value: "business" },
    ]},
    { id: "departureTime", i18nKey: "filter.train.departureTime", type: "checkbox", options: [
      { label: "filter.flight.morning", value: "morning" },
      { label: "filter.flight.afternoon", value: "afternoon" },
      { label: "filter.flight.evening", value: "evening" },
      { label: "filter.flight.night", value: "night" },
    ]},
    { id: "carrier", i18nKey: "filter.train.carrier", type: "checkbox", options: [
      { label: "filter.train.carriers.ady", value: "ady" },
      { label: "filter.train.carriers.rzd", value: "rzd" },
      { label: "filter.train.carriers.tcdd", value: "tcdd" },
    ]},
    { id: "price", i18nKey: "filter.price", type: "range", min: 0, max: 1000 },
  ],
  // Трансферы: Страна, Город, Класс авто, Вместимость, Встреча
  transfer: [
    { id: "country", i18nKey: "filter.country", type: "country" },
    { id: "city", i18nKey: "filter.city", type: "city" },
    { id: "startDate", i18nKey: "filter.startDate.transfer", type: "date" },
    { id: "carClass", i18nKey: "filter.transfer.carClass", type: "radio", options: [
      { label: "filter.transfer.economy", value: "economy" },
      { label: "filter.transfer.comfort", value: "comfort" },
      { label: "filter.transfer.business", value: "business" },
      { label: "filter.transfer.van", value: "van" },
      { label: "filter.transfer.minibus", value: "minibus" },
    ]},
    { id: "capacity", i18nKey: "filter.transfer.capacity", type: "radio", options: [
      { label: "filter.transfer.upTo3", value: "3" },
      { label: "filter.transfer.upTo6", value: "6" },
      { label: "filter.transfer.upTo12", value: "12" },
      { label: "filter.transfer.upTo20", value: "20" },
    ]},
    { id: "meetingType", i18nKey: "filter.transfer.meetingType", type: "radio", options: [
      { label: "filter.transfer.withSign", value: "sign" },
      { label: "filter.transfer.nameBoard", value: "board" },
    ]},
    { id: "price", i18nKey: "filter.price", type: "range", min: 0, max: 500 },
  ],
};
