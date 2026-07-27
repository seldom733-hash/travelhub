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
}

export type ServiceCategory = "tour" | "hotel" | "sanatorium" | "excursion" | "guide" | "photographer" | "flight" | "train" | "transfer";

export const filterConfigs: Record<ServiceCategory, FilterDefinition[]> = {
  // Туры: Страна, Город, Звёзды, Ночей, Питание, Тип отдыха, Первая линия, Всё включено, Для детей, SPA, Аквапарк, Горящие, Без визы, Рейтинг, Цена
  tour: [
    { id: "country", i18nKey: "filter.country", type: "country" },
    { id: "city", i18nKey: "filter.city", type: "city" },
    { id: "stars", i18nKey: "filter.tour.stars", type: "checkbox", options: [
      { label: "★★★★★", value: "5" },
      { label: "★★★★", value: "4" },
      { label: "★★★", value: "3" },
      { label: "★★", value: "2" },
    ]},
    { id: "nights", i18nKey: "filter.tour.nights", type: "radio", options: [
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
    { id: "spa", i18nKey: "filter.tour.spa", type: "checkbox", options: [
      { label: "filter.hotel.spa", value: "spa" },
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
  ],
  // Отели: Страна, Город, Звёзды, Питание, Тип номера, SPA, Бассейн, Wi-Fi, Парковка, Пляж, Расстояние, Рейтинг, С животными, Бесплатная отмена
  hotel: [
    { id: "country", i18nKey: "filter.country", type: "country" },
    { id: "city", i18nKey: "filter.city", type: "city" },
    { id: "stars", i18nKey: "filter.hotel.stars", type: "checkbox", options: [
      { label: "★★★★★", value: "5" },
      { label: "★★★★", value: "4" },
      { label: "★★★", value: "3" },
      { label: "★★", value: "2" },
    ]},
    { id: "meal", i18nKey: "filter.hotel.meal", type: "checkbox", options: [
      { label: "filter.tour.noMeals", value: "none" },
      { label: "filter.tour.breakfast", value: "breakfast" },
      { label: "filter.tour.halfBoard", value: "half" },
      { label: "filter.tour.fullBoard", value: "full" },
      { label: "filter.tour.allInclusive", value: "all_inclusive" },
    ]},
    { id: "roomType", i18nKey: "filter.hotel.roomType", type: "checkbox", options: [
      { label: "filter.hotel.standard", value: "standard" },
      { label: "filter.hotel.deluxe", value: "deluxe" },
      { label: "filter.hotel.suite", value: "suite" },
      { label: "filter.hotel.family", value: "family" },
    ]},
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
    { id: "stars", i18nKey: "filter.sanatorium.stars", type: "checkbox", options: [
      { label: "★★★★★", value: "5" },
      { label: "★★★★", value: "4" },
      { label: "★★★", value: "3" },
    ]},
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
      { label: "Ru", value: "ru" },
      { label: "En", value: "en" },
      { label: "Az", value: "az" },
      { label: "Tr", value: "tr" },
      { label: "Ar", value: "ar" },
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
    { id: "language", i18nKey: "filter.guide.language", type: "checkbox", options: [
      { label: "Ru", value: "ru" },
      { label: "En", value: "en" },
      { label: "Az", value: "az" },
      { label: "Tr", value: "tr" },
      { label: "De", value: "de" },
      { label: "Fr", value: "fr" },
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
    { id: "language", i18nKey: "filter.photographer.language", type: "checkbox", options: [
      { label: "Ru", value: "ru" },
      { label: "En", value: "en" },
      { label: "Az", value: "az" },
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
    { id: "stops", i18nKey: "filter.flight.stops", type: "radio", options: [
      { label: "filter.flight.direct", value: "0" },
      { label: "filter.flight.oneStop", value: "1" },
      { label: "filter.flight.twoPlus", value: "2+" },
    ]},
    { id: "airline", i18nKey: "filter.flight.airline", type: "checkbox", options: [
      { label: "AZAL", value: "azal" },
      { label: "Turkish Airlines", value: "turkish" },
      { label: "FlyDubai", value: "flydubai" },
      { label: "S7", value: "s7" },
      { label: "Qatar Airways", value: "qatar" },
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
      { label: "ADY", value: "ady" },
      { label: "RZD", value: "rzd" },
      { label: "TCDD", value: "tcdd" },
    ]},
    { id: "price", i18nKey: "filter.price", type: "range", min: 0, max: 1000 },
  ],
  // Трансферы: Страна, Город, Класс авто, Вместимость, Встреча
  transfer: [
    { id: "country", i18nKey: "filter.country", type: "country" },
    { id: "city", i18nKey: "filter.city", type: "city" },
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
