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

/* ── Room type name map (slug → display names) ── */
/* Keys must match ROOM_TYPES from @/lib/constants */
export const ROOM_TYPE_MAP: Record<string, string[]> = {
  standard: ["Стандартный", "Standard Room"],
  superior: ["Улучшенный", "Superior Room"],
  deluxe: ["Делюкс", "Deluxe Room"],
  premium: ["Премиум", "Premium Room"],
  executive: ["Представительский", "Executive Room"],
  club: ["Клубный", "Club Room"],
  family: ["Семейный", "Family Room"],
  studio: ["Студия", "Studio"],
  junior_suite: ["Полулюкс", "Junior Suite"],
  suite: ["Люкс", "Suite"],
  executive_suite: ["Представительский люкс", "Executive Suite"],
  presidential_suite: ["Президентский люкс", "Presidential Suite"],
  royal_suite: ["Королевский люкс", "Royal Suite"],
  honeymoon_suite: ["Свадебный люкс", "Honeymoon Suite"],
  apartment: ["Апартаменты", "Apartment"],
  villa: ["Вилла", "Villa"],
  bungalow: ["Бунгало", "Bungalow"],
  cottage: ["Коттедж", "Cottage"],
  chalet: ["Шале", "Chalet"],
  duplex: ["Двухуровневый", "Duplex"],
  penthouse: ["Пентхаус", "Penthouse"],
  accessible: ["Для гостей с ОВЗ", "Accessible Room"],
  connecting_rooms: ["Смежные номера", "Connecting Rooms"],
};



/* ── Bed type name map ── */
/* Keys must match BED_TYPES from @/lib/constants */
export const BED_TYPE_MAP: Record<string, string[]> = {
  single: ["Односпальная", "Single Bed"],
  twin: ["2 односпальные", "Twin Beds"],
  double: ["Двуспальная", "Double Bed"],
  queen: ["Queen", "Queen Bed"],
  king: ["King", "King Bed"],
  super_king: ["Super King", "Super King Bed"],
  sofa: ["Диван-кровать", "Sofa Bed"],
  bunk: ["Двухъярусная", "Bunk Bed"],
  baby_cot: ["Детская кроватка", "Baby Cot"],
  extra_bed: ["Дополнительная кровать", "Extra Bed"],
};

/* ── View name map ── */
/* Keys must match VIEWS from @/lib/constants */
export const VIEW_MAP: Record<string, string[]> = {
  city: ["Вид на город", "City View"],
  sea: ["Вид на море", "Sea View"],
  sea_direct: ["Прямой вид на море", "Direct Sea View"],
  sea_partial: ["Частичный вид на море", "Partial Sea View"],
  pool: ["Вид на бассейн", "Pool View"],
  garden: ["Вид на сад", "Garden View"],
  mountain: ["Вид на горы", "Mountain View"],
  lake: ["Вид на озеро", "Lake View"],
  park: ["Вид на парк", "Park View"],
  river: ["Вид на реку", "River View"],
  no_view: ["Без вида", "No View"],
  panoramic: ["Панорамный вид", "Panoramic View"],
};

/* ── Smoking name map ── */
/* Keys must match SMOKING_OPTIONS from @/lib/constants */
export const SMOKING_MAP: Record<string, string[]> = {
  non_smoking: ["Для некурящих", "Non-Smoking"],
  smoking: ["Для курящих", "Smoking"],
};

/* ── Balcony name map ── */
/* Keys must match BALCONY_OPTIONS from @/lib/constants */
export const BALCONY_MAP: Record<string, string[]> = {
  no_balcony: ["Без балкона", "No Balcony"],
  balcony: ["Балкон", "Balcony"],
  french_balcony: ["Французский балкон", "French Balcony"],
  terrace: ["Терраса", "Terrace"],
  private_garden: ["Частный сад", "Private Garden"],
};

/* ── Bathroom name map ── */
/* Keys must match BATHROOM_OPTIONS from @/lib/constants */
export const BATHROOM_MAP: Record<string, string[]> = {
  shower: ["Душ", "Shower"],
  bathtub: ["Ванна", "Bathtub"],
  jacuzzi: ["Джакузи", "Jacuzzi"],
  private_pool: ["Собственный бассейн", "Private Pool"],
  shared: ["Общая ванная комната", "Shared Bathroom"],
};

/* ── Excursion duration keywords (mapped to shared durationFitsRange ranges) ── */
export const EXCURSION_DURATION_KEYWORDS: Record<string, string[]> = {
  "2": ["1 час", "2 часа"],
  "4": ["3 часа", "4 часа", "5 часов", "Полдня"],
  "8": ["6 часов", "7 часов", "8 часов"],
  full: ["Весь день"],
  multi: ["дн"],
};

/* ── Room amenities map ── */
export const ROOM_AMENITIES_MAP: Record<string, string[]> = {
  wifi: ["Wi-Fi", "WiFi"],
  aircon: ["Кондиционер", "Air conditioner"],
  minibar: ["Мини-бар", "Minibar"],
  safe: ["Сейф", "Safe"],
  tv: ["Телевизор", "TV", "Телевізор"],
  coffee: ["Кофемашина", "Coffee machine"],
  kettle: ["Чайник", "Kettle"],
  desk: ["Рабочий стол", "Desk"],
  kitchen: ["Кухня", "Kitchen"],
  fridge: ["Холодильник", "Fridge"],
  washer: ["Стиральная машина", "Washing machine"],
  hairdryer: ["Фен", "Hairdryer"],
  bathrobes: ["Халаты", "Bathrobes"],
  slippers: ["Тапочки", "Slippers"],
  microwave: ["Микроволновая печь", "Microwave"],
  iron: ["Утюг", "Iron"],
};
