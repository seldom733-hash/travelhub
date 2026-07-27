/* ── Amenity name mapping: filter value → DB amenity name(s) ── */
export const AMENITY_MAP: Record<string, string[]> = {
  pool: ["Бассейн", "Hovuz", "Pool", "Hovuz"],
  spa: ["SPA", "Спа", "Spa"],
  wifi: ["Wi-Fi", "WiFi"],
  parking: ["Парковка", "Parkinq", "Parking"],
  gym: ["Фитнес", "İdman zalı", "Gym", "Fitness"],
  beach: ["Пляж", "Çimərlik", "Beach"],
  waterpark: ["Аквапарк", "Akvapark", "Waterpark"],
  kids_club: ["Детская площадка", "Uşaq klubу", "Kids club"],
  restaurant: ["Ресторан", "Restoran", "Restaurant"],
  bar: ["Бар", "Bar"],
  air_conditioner: ["Кондиционер", "Kondisioner", "Air conditioner"],
  breakfast: ["Завтрак", "Südrə", "Breakfast", "Завтрак включён"],
  first_line: ["Первая линия", "Birinci xətt", "First line"],
  all_inclusive: ["Всё включено", "Hər şey daxil", "All inclusive", "AI", "All Inclusive"],
  kids: ["Для детей", "Uşaqlar", "Kids", "Детская площадка"],
};

/* ── Tour meal value → keywords ── */
export const MEAL_KEYWORDS: Record<string, string[]> = {
  none: ["Без питания", "Yeməksiz", "No meals"],
  breakfast: ["Завтрак", "Südrə", "Breakfast", "BB"],
  half: ["Полупансион", "Yarım pansiyon", "Half board", "HB"],
  full: ["Полный пансион", "Tam pansiyon", "Full board", "FB"],
  all_inclusive: ["Всё включено", "Hər şey daxil", "All inclusive", "AI"],
};

/* ── Tour type → keywords ── */
export const TOUR_TYPE_KEYWORDS: Record<string, string[]> = {
  beach: ["Пляжный", "Çimərlik", "Beach", "пляж"],
  group: ["Групповой", "Qrup", "Group", "группа"],
  individual: ["Индивидуальный", "Fərdi", "Individual"],
  cruise: ["Круиз", "Kruiz", "Cruise", "круиз"],
  ski: ["Горнолыжный", "Xizək", "Ski", "лыж"],
};

/* ── Excursion category → keywords ── */
export const EXCURSION_CATEGORY_KEYWORDS: Record<string, string[]> = {
  sightseeing: ["Обзорная", "Baxış", "Sightseeing", "осмотр", "обзор", "Познавательная", "Ночная"],
  adventure: ["Приключенческая", "Macəra", "Adventure", "приключен", "джип", "Джип", "Jeep", "сафари", "Сафари", "Safari"],
  cultural: ["Культурная", "Mədəni", "Cultural", "культур", "Архитектурная", "Историческая", "Architectural", "Historical"],
  nature: ["Природная", "Təbiət", "Nature", "природ", "Ночная", "Night"],
  food: ["Гастро", "Yemək turu", "Food", "гастро", "кулинар", "Гастрономическ", "Gastronomic"],
};

/* ── Excursion transport type → keywords ── */
export const EXCURSION_TRANSPORT_KEYWORDS: Record<string, string[]> = {
  walking: ["Пешая", "Пешеходная", "Piyada", "Walking", "пешком", "Piyada"],
  bus: ["Автобусная", "Avtobusla", "Bus", "автобус", "Avtobus"],
  sea: ["Морская", "Водная", "Dəniz turu", "Sea", "морск", "водн", "Water", "Dəniz"],
};

/* ── Transfer car class → keywords ── */
export const TRANSFER_CAR_CLASS_KEYWORDS: Record<string, string[]> = {
  economy: ["Эконом", "Ekonom", "Economy", "из аэропорта", "в аэропорт", "аэропорт", "Airport"],
  comfort: ["Комфорт", "Komfort", "Comfort", "Междугородний", "Intercity", "междугородн"],
  business: ["Бизнес", "Biznes", "Business", "VIP", "vip"],
  van: ["Минивэн", "Miniven", "Minivan", "Minivan", "Минивэн трансфер"],
  minibus: ["Микроавтобус", "Mikroavtobus", "Minibus", "Индивидуальный"],
};

/* ── Transfer capacity → parse number from description ── */
export const CAPACITY_MAP: Record<string, number> = {
  "3": 3,
  "6": 6,
  "12": 12,
  "20": 20,
};

/* ── Visa keywords ── */
export const VISA_KEYWORDS: Record<string, string[]> = {
  free: ["Без визы", "Виза не нужна", "Vizasız", "Visa free", "visa-free", "визы нет"],
  required: ["Виза нужна", "Viza lazımdır", "Visa required", "нужна виза"],
};

/* ── Sanatorium treatment keywords ── */
export const TREATMENT_KEYWORDS: Record<string, string[]> = {
  mineral_water: ["Минеральные воды", "Mineral sular"],
  mud_therapy: ["Грязелечение", "Palçıq müalicəsi"],
  cardiology: ["Кардиология", "Kardiologiya"],
  musculoskeletal: ["Опорно-двигательный", "Hərəkət sistemi"],
  joints: ["Суставы", "Oynaqlar"],
  nervous: ["Нервная система", "Sinir sistemi"],
  cosmetology: ["Косметология", "Kosmetologiya"],
  dental: ["Стоматология", "Stomatologiya"],
  detox: ["Детокс", "Detoks"],
};

/* ── Sanatorium diet keywords ── */
export const DIET_KEYWORDS: Record<string, string[]> = {
  no_salt: ["Без соли", "Duzsuz"],
  vegan: ["Веганское", "Veqan"],
  diabetic: ["Диабетическое", "Diabetik"],
  hypoallergenic: ["Гипоаллергенное", "Allergik deyil"],
};

/* ── Guide specialization keywords ── */
export const SPEC_KEYWORDS: Record<string, string[]> = {
  history: ["история", "истори"],
  nature: ["природа", "природ"],
  museums: ["музеи", "музе"],
  walking: ["пешеходн"],
  gastronomy: ["гастрономия", "гастроном"],
  adventure: ["приключения", "приключени"],
  vip: ["VIP", "vip"],
};

/* ── Photographer genre keywords ── */
export const GENRE_KEYWORDS: Record<string, string[]> = {
  love_story: ["love story", "Love Story"],
  family: ["семейн"],
  portrait: ["портрет"],
  wedding: ["свадьб", "свадебн"],
  individual: ["индивидуальн"],
  travel: ["путешестви"],
  event: ["события", "событи"],
  commercial: ["коммерческ"],
};

/* ── Excursion type (group/individual) keywords ── */
export const EXCURSION_TYPE_KEYWORDS: Record<string, string[]> = {
  group: ["Группа", "Qrup", "Group", "группов"],
  individual: ["Индивидуал", "Fərdi", "Individual", "персонал"],
};

/* ── Transfer meeting type keywords ── */
export const MEETING_KEYWORDS: Record<string, string[]> = {
  sign: ["Табло", "Təblosu", "табло", "sign"],
  board: ["Табличка", "Ad lövhəsi", "табличк", "board"],
};

/* ── Room name map ── */
export const ROOM_NAME_MAP: Record<string, string[]> = {
  standard: ["Стандартный", "Standard"],
  deluxe: ["Делюкс", "Deluxe"],
  suite: ["Люкс", "Suite"],
  family: ["Семейный", "Family"],
};
