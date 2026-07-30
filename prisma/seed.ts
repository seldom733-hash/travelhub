import { PrismaClient, UserRole, PartnerType, ServiceType, BookingStatus, UserLevel, TourCategory } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  ROOM_TYPES, ROOM_TYPE_NAMES, ROOM_TYPE_NAMES_RU,
  BED_TYPES, VIEWS, SMOKING_OPTIONS, BALCONY_OPTIONS,
  BATHROOM_OPTIONS, AREA_OPTIONS, OCCUPANCY_OPTIONS,
  ROOM_AMENITIES_LIST, ROOM_BASE_PRICES, MEAL_PLANS, LANGUAGES,
} from "../src/lib/constants";

const prisma = new PrismaClient();

// ==================== CONSTANTS ====================

const COUNTRIES = [
  { name: "Турция", code: "TR", cities: ["Стамбул", "Анталья", "Бодрум", "Каппадокия", "Измир", "Мармарис", "Фетхие", "Аланья", "Памуккале", "Кушадасы"], lat: [41.0, 36.9, 37.0, 38.6, 38.4, 36.8, 36.6, 36.3, 37.9, 37.9], lng: [29.0, 30.7, 27.4, 34.8, 27.1, 28.3, 29.1, 32.0, 29.1, 27.3] },
  { name: "ОАЭ", code: "AE", cities: ["Дубай", "Абу-Даби", "Рас-эль-Хайма", "Шарджа", "Аджман", "Фуджейра"], lat: [25.2, 24.5, 25.8, 25.3, 25.4, 25.1], lng: [55.3, 54.4, 55.9, 55.4, 55.5, 56.3] },
  { name: "Грузия", code: "GE", cities: ["Тбилиси", "Батуми", "Кутаиси", "Мцхета", "Казбеги", "Сигнаги"], lat: [41.7, 41.6, 42.3, 41.8, 42.7, 41.6], lng: [44.8, 41.6, 42.7, 44.7, 44.5, 45.9] },
  { name: "Таиланд", code: "TH", cities: ["Бангкок", "Пхукет", "Чиангмай", "Паттайя", "Краби", "Самуи"], lat: [13.8, 7.9, 18.8, 12.9, 8.1, 9.5], lng: [100.5, 98.3, 99.0, 100.9, 98.8, 100.1] },
  { name: "Египет", code: "EG", cities: ["Каир", "Хургада", "Шарм-эль-Шейх", "Луксор", "Александрия", "Марса Алам"], lat: [30.0, 27.2, 27.9, 25.7, 31.2, 25.6], lng: [31.2, 33.8, 34.3, 32.6, 29.9, 34.6] },
  { name: "Италия", code: "IT", cities: ["Рим", "Милан", "Флоренция", "Венеция", "Неаполь", "Амальфи"], lat: [41.9, 45.5, 43.8, 45.4, 40.9, 40.6], lng: [12.5, 9.2, 11.2, 12.3, 14.3, 14.6] },
  { name: "Испания", code: "ES", cities: ["Барселона", "Мадрид", "Севилья", "Валенсия", "Малага", "Гранада"], lat: [41.4, 40.4, 37.4, 39.5, 36.7, 37.2], lng: [2.2, -3.7, -6.0, -0.4, -4.4, -3.6] },
  { name: "Греция", code: "GR", cities: ["Афины", "Санторини", "Родос", "Крит", "Миконос", "Корфу"], lat: [37.9, 36.4, 36.4, 35.3, 37.4, 39.6], lng: [23.7, 25.4, 28.2, 25.1, 25.3, 19.9] },
  { name: "Черногория", code: "ME", cities: ["Будва", "Подгорица", "Котор", "Херцег-Нови", "Улцинь", "Бар"], lat: [42.3, 42.4, 42.4, 42.4, 41.9, 42.1], lng: [18.8, 19.3, 18.8, 18.5, 19.1, 19.1] },
  { name: "Мальдивы", code: "MV", cities: ["Мале", "Ари", "Баа", "Северный Мале", "Лхавияни", "Раа"], lat: [4.2, 3.9, 5.1, 4.3, 6.0, 5.6], lng: [73.5, 72.8, 50.0, 73.5, 73.5, 73.0] },
  { name: "Бали", code: "ID", cities: ["Денпасар", "Кута", "Семиньяк", "Убуд", "Нуса-Дуа", "Джимбаран"], lat: [-8.7, -8.7, -8.7, -8.5, -8.8, -8.8], lng: [115.2, 115.2, 115.2, 115.3, 115.2, 115.2] },
  { name: "Доминикана", code: "DO", cities: ["Пунта-Кана", "Санто-Доминго", "Пуэрто-Плата", "Самана", "Бока-Чика", "Кабарете"], lat: [18.6, 18.5, 19.8, 19.3, 18.4, 19.3], lng: [-68.4, -69.9, -70.9, -69.3, -69.6, -70.4] },
  { name: "Марокко", code: "MA", cities: ["Марракеш", "Касабланка", "Фес", "Танжер", "Мешекель", "Агадир"], lat: [31.6, 33.6, 34.0, 35.8, 31.0, 30.4], lng: [-8.0, -7.6, -5.0, -5.8, -5.3, -9.6] },
  { name: "Вьетнам", code: "VN", cities: ["Ханой", "Хошимин", "Дананг", "Халонг", "Нячанг", "Фукок"], lat: [21.0, 10.8, 16.1, 20.9, 12.3, 10.2], lng: [105.9, 106.6, 108.2, 107.1, 109.2, 103.9] },
  { name: "Израиль", code: "IL", cities: ["Тель-Авив", "Иерусалим", "Хайфа", "Нетания", "Эйлат", "Вифлеем"], lat: [32.1, 31.8, 32.8, 32.3, 29.6, 31.7], lng: [34.8, 35.2, 35.0, 34.9, 35.0, 35.2] },
  { name: "Россия", code: "RU", cities: ["Москва", "Санкт-Петербург", "Сочи", "Казань", "Нижний Новгород", "Калининград"], lat: [55.8, 59.9, 43.6, 55.8, 56.3, 54.7], lng: [37.6, 30.3, 39.6, 49.1, 44.0, 20.5] },
];

const SERVICE_TITLES: Record<string, string[]> = {
  TOUR: ["Полёт на воздушном шаре", "Вечерний круиз", "Гастротур", "Винный тур", "Шопинг-тур", "Приключенческий тур", "Культурный тур", "Горный тур", "Пляжный тур", "Экотур", "Сафари", "Круиз по реке", "Поездка на лошадях", "Сплав на рафте", "Ночной тур", "Фототур", "Кулинарный тур"],
  HOTEL: ["Премиум отель", "Бутик-отель", "Семейный отель", "Пляжный курорт", "Горный отель", "Городской отель", "Спа-отель", "All-Inclusive курорт", "Апартаменты", "Вилла", "Резорт", "Бизнес отель"],
  SANATORIUM: ["Термальный санаторий", "Спа-курорт", "Йога-ретрит", "Детокс-программа", "Грязелечение", "Минеральные воды", "Оздоровление", "Аюрведа"],
  EXCURSION: ["Обзорная экскурсия", "Пешеходная экскурсия", "Автобусная экскурсия", "Водная экскурсия", "Ночная экскурсия", "Гастрономическая экскурсия", "Историческая экскурсия", "Архитектурная экскурсия", "Природная экскурсия", "Экскурсия на джипах"],
  GUIDE: ["Личный гид", "Гид-переводчик", "Гид по городу", "Гид по музеям", "Гид по природе", "Гид-фотограф", "Гид-историк", "Гид-кулинар"],
  PHOTOGRAPHER: ["Портретная съёмка", "Свадебная съёмка", "Фотосессия", "Семейная фотосессия", "Фотосессия в путешествии", "Коммерческая съёмка"],
  TRANSFER: ["Трансфер из аэропорта", "Трансфер в аэропорт", "Междугородний трансфер", "VIP трансфер", "Минивэн трансфер", "Индивидуальный трансфер"],
  FLIGHT: ["Прямой рейс", "Чартерный рейс", "Бизнес-класс", "Эконом-класс", "Семейный рейс"],
};

const HOTEL_IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
];
const TOUR_IMAGES = [
  "https://images.unsplash.com/photo-1507608616759-54f48f0af0ee?w=800&q=80",
  "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800&q=80",
  "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80",
];
const GUIDE_IMAGES = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80",
];
const PHOTO_IMAGES = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
  "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&q=80",
];
const SPA_IMAGES = [
  "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80",
  "https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=800&q=80",
];
const TRANSFER_IMAGES = [
  "https://images.unsplash.com/photo-1449965408869-ebd3fee19d3e?w=800&q=80",
  "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=800&q=80",
];

const AMENITIES = [
  { name: "Wi-Fi", icon: "📶" }, { name: "Бассейн", icon: "🏊" }, { name: "Спа", icon: "💆" },
  { name: "Ресторан", icon: "🍽" }, { name: "Парковка", icon: "🅿" }, { name: "Кондиционер", icon: "❄" },
  { name: "Завтрак", icon: "🥐" }, { name: "Фитнес", icon: "💪" }, { name: "Бар", icon: "🍸" },
  { name: "Детская площадка", icon: "🎠" },
];

// Constants imported from shared file
// ==================== HELPERS ====================

function pick<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min: number, max: number): number { return Math.round((Math.random() * (max - min) + min) * 10) / 10; }
function slugify(s: string): string { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

function getImages(type: string): string {
  let pool: string[];
  switch (type) {
    case "HOTEL": pool = HOTEL_IMAGES; break;
    case "SANATORIUM": pool = SPA_IMAGES; break;
    case "GUIDE": case "PHOTOGRAPHER": pool = GUIDE_IMAGES; break;
    case "TRANSFER": pool = TRANSFER_IMAGES; break;
    default: pool = TOUR_IMAGES;
  }
  return pickN(pool, randInt(1, 3)).join(",");
}

function generateDescription(type: string, city: string, country: string): string {
  const stars = pick([3, 4, 5]);
  const starStr = "★".repeat(stars);
  const meal = pick(MEAL_PLANS);
  const mealNames: Record<string, string> = { RO: "Без питания", BB: "Завтрак включён", HB: "Полупансион", FB: "Полный пансион", AI: "Всё включено" };
  const mealName = mealNames[meal] || "Завтрак включён";
  const room = pick(ROOM_TYPES);
  const roomName = ROOM_TYPE_NAMES_RU[room] || "Стандартный";
  const distance = pick(["на пляже", "100м от пляжа", "300м от пляжа", "500м от пляжа", "1 км от пляжа"]);
  const hasPool = Math.random() > 0.3;
  const hasSpa = Math.random() > 0.4;
  const hasWifi = Math.random() > 0.2;
  const hasKids = Math.random() > 0.5;
  const hasParking = Math.random() > 0.5;
  const cancelFree = Math.random() > 0.5;
  const petsAllowed = Math.random() > 0.7;
  const experience = pick(["1", "3", "5", "7", "10", "15"]);
  const guideLangs = pickN(["русский", "английский", "турецкий", "азербайджанский", "грузинский", "немецкий", "французский"], randInt(2, 4));
  const spec = pick(["история", "природа", "музеи", "пешеходные прогулки", "гастрономия", "приключения", "VIP-экскурсии"]);
  const genre = pick(["love story", "свадьбы", "портрет", "семейная", "путешествия", "коммерческая", "события"]);
  const carClass = pick(["Эконом", "Комфорт", "Бизнес", "Минивэн", "Микроавтобус"]);
  const capacity = pick(["3", "6", "12", "20"]);
  const meetingType = pick(["Табло с именем", "Табличка с именем"]);
  const excCategories = ["Обзорная", "Приключенческая", "Культурная", "Природная", "Гастрономическая"];
  const excCategory = pick(excCategories);
  const excTransport = pick(["Пешеходная", "Автобусная", "Морская"]);
  const treatments = ["Минеральные воды", "Грязелечение", "Кардиология", "Опорно-двигательный аппарат", "Нервная система", "Косметология", "Стоматология", "Детокс"];
  const selectedTreatments = pickN(treatments, randInt(2, 4));
  const diets = ["Без соли", "Веганское", "Диабетическое", "Гипоаллергенное"];
  const selectedDiets = pickN(diets, randInt(1, 2));

  const descs: Record<string, string[]> = {
    TOUR: [
      `${starStr} Пляжный тур по ${city}, ${country}. ${mealName}. Профессиональное руководство и яркие впечатления. ${hasPool ? "Бассейн." : ""} ${hasSpa ? "Спа-процедуры." : ""}`,
      `Откройте красоту ${city} с нашим уникальным турам. ${mealName}. ${hasKids ? "Для детей." : ""} ${cancelFree ? "Бесплатная отмена за 48 часов." : ""} Без визы`
    ],
    HOTEL: [
      `${starStr} ${roomName} номер в ${city}, ${country}. ${mealName}. ${room === "suite" ? "Люкс" : room === "deluxe" ? "Делюкс" : "Комфортабельный"} номер с видом. ${distance}. ${hasPool ? "Бассейн." : ""} ${hasSpa ? "Спа-комплекс." : ""} ${hasWifi ? "Бесплатный Wi-Fi." : ""} ${hasKids ? "Детская площадка." : ""} ${hasParking ? "Бесплатная парковка." : ""} ${cancelFree ? "Бесплатная отмена." : ""} ${petsAllowed ? "Можно с животными." : ""} Бар, ресторан, кондиционер, фитнес`
    ],
    EXCURSION: [
      `${excCategory} экскурсия по ${city}. ${excTransport} экскурсия. ${pick(["2", "4", "6", "8"])} часов. Билеты включены. ${hasKids ? "Для детей." : ""} Групповая`
    ],
    SANATORIUM: [
      `${starStr} Санаторий в ${city}. ${selectedTreatments.join(", ")}. ${selectedDiets.join(", ")}. ${hasPool ? "Бассейн." : ""} ${hasSpa ? "Спа." : ""} ${hasWifi ? "Wi-Fi." : ""} Имеется врач. Инфраструктура: фитнес, кондиционер`
    ],
    GUIDE: [
      `Профессиональный гид по ${city}. Опыт работы ${experience} лет. Языки: ${guideLangs.join(", ")}. Специализация: ${spec}. Имеет автомобиль. Лицензия. Знание истории и культуры города. Индивидуальные и групповые экскурсии`
    ],
    PHOTOGRAPHER: [
      `Профессиональный фотограф в ${city}. Опыт ${experience} лет. Жанры: ${genre}, портрет. Языки: ${guideLangs.slice(0, 3).join(", ")}. Креативный подход, работа с локациями. Свадебная, семейная, коммерческая съёмка`
    ],
    TRANSFER: [
      `${carClass} трансфер в ${city}, ${country}. Вместимость: ${capacity} пассажиров. ${meetingType}. Современные автомобили, Wi-Fi, кондиционер`
    ],
    FLIGHT: [`Авиарейс в ${city}, ${country}. Надёжная авиакомпания и конкурентные цены.`],
  };
  return pick(descs[type] || descs.TOUR);
}

// ==================== MAIN ====================

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data (order matters for foreign keys)
  const tables = [
    "loyalty_transactions", "user_achievements", "achievements", "promo_codes",
    "cancellations", "payments", "bookings", "review_replies", "reviews",
    "favorites", "collections", "notifications", "messages",
    "conversation_participants", "conversations", "service_price_variants",
    "service_schedules", "service_amenities", "pricing_rules", "room_types",
    "flight_details", "tour_hotels", "transfer_details",
    "services", "users", "blog_posts",
  ];
  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
  }
  console.log("🗑  Cleared all data");

  const pw = await bcrypt.hash("password123", 10);

  // ==================== ADMIN ====================
  const admin = await prisma.user.create({
    data: {
      email: "admin@travelhub.az", passwordHash: pw,
      firstName: "Admin", lastName: "TravelHub",
      role: UserRole.ADMIN, isVerified: true, bonusPoints: 1000,
    },
  });
  console.log("👑 Admin created: admin@travelhub.az / password123");

  // ==================== PARTNERS (15 specific accounts) ====================
  console.log("👥 Creating partners...");

  const partnerDefs = [
    // ГИДЫ (4) — guides are individuals, no companyName
    { email: "guide-antalya@travelhub.az", firstName: "Mehmet", lastName: "Yilmaz", partnerType: PartnerType.GUIDE as PartnerType, companyName: null, bio: "Лицензированный гид по Анталье. 10 лет опыта. Русский, турецкий, английский." },
    { email: "guide-istanbul@travelhub.az", firstName: "Ali", lastName: "Kaya", partnerType: PartnerType.GUIDE as PartnerType, companyName: null, bio: "Гид по Стамбулу. Специализация — исторические экскурсии и гастротуры." },
    { email: "guide-tbilisi@travelhub.az", firstName: "Давид", lastName: "Мамулашвили", partnerType: PartnerType.GUIDE as PartnerType, companyName: null, bio: "Гид по Тбилиси и Грузии. Знаю секретные места." },
    { email: "guide-dubai@travelhub.az", firstName: "Omar", lastName: "Al-Rashid", partnerType: PartnerType.GUIDE as PartnerType, companyName: null, bio: "Гид по Дубаю. VIP-экскурсии по пустыне и городу." },
    // ЭКСКУРСИОНЕРЫ (4) — companies
    { email: "excursion-rome@travelhub.az", firstName: "Marco", lastName: "Rossi", partnerType: PartnerType.EXCURSION_ORGANIZER as PartnerType, companyName: "Roma Excursions S.r.l.", bio: "Организация экскурсий по Риму и Италии. Автобусные, пешеходные, велосипедные." },
    { email: "excursion-bali@travelhub.az", firstName: "Wayan", lastName: "Suardana", partnerType: PartnerType.EXCURSION_ORGANIZER as PartnerType, companyName: "Bali Adventures PT", bio: "Экскурсии по Бали. Водные, природные, культурные." },
    { email: "excursion-cairo@travelhub.az", firstName: "Ahmed", lastName: "Hassan", partnerType: PartnerType.EXCURSION_ORGANIZER as PartnerType, companyName: "Egypt Discoveries LLC", bio: "Экскурсии в Египте. Пирамиды, Луксор, Красное море." },
    { email: "excursion-budva@travelhub.az", firstName: "Milan", lastName: "Petrović", partnerType: PartnerType.EXCURSION_ORGANIZER as PartnerType, companyName: "Montenegro Tours DOO", bio: "Экскурсии по Черногории. Морские прогулки, горные маршруты." },
    // ОТЕЛИ (3) — companies
    { email: "hotel-antalya@travelhub.az", firstName: "Hasan", lastName: "Demir", partnerType: PartnerType.HOTEL as PartnerType, companyName: "Demir Hotels Group", bio: "Сеть отелей в Анталье. 5 отелей от 3* до 5*." },
    { email: "hotel-dubai@travelhub.az", firstName: "Sultan", lastName: "Al-Maktoum", partnerType: PartnerType.HOTEL as PartnerType, companyName: "Al-Maktoum Hospitality", bio: "Премиум-отели в Дубае. Jumeirah Beach, Downtown." },
    { email: "hotel-greece@travelhub.az", firstName: "Nikos", lastName: "Papadopoulos", partnerType: PartnerType.HOTEL as PartnerType, companyName: "Aegean Hotels SA", bio: "Отели на Санторини и Крит. С видом на море." },
    // ФОТОГРАФЫ (2) — individual/small company
    { email: "photo-rome@travelhub.az", firstName: "Giulia", lastName: "Bianchi", partnerType: PartnerType.PHOTOGRAPHER as PartnerType, companyName: "Bianchi Photo Studio", bio: "Фотограф в Риме. Свадьбы, портреты, путешествия." },
    { email: "photo-bali@travelhub.az", firstName: "Putu", lastName: "Wijaya", partnerType: PartnerType.PHOTOGRAPHER as PartnerType, companyName: "Bali Lens Photography", bio: "Фотограф на Бали. Свадебные и LOVE STORY фотосессии." },
    // ТРАНСПОРТЕРЫ (1) — company
    { email: "transfer-antalya@travelhub.az", firstName: "Yusuf", lastName: "Aksoy", partnerType: PartnerType.TRANSPORTER as PartnerType, companyName: "Aksoy Transfer & VIP", bio: "Трансферы по Анталье и всей Турции. Минивэны, VIP." },
  ];

  const partners = await Promise.all(
    partnerDefs.map((p) =>
      prisma.user.create({
        data: {
          email: p.email, passwordHash: pw,
          firstName: p.firstName, lastName: p.lastName,
          role: UserRole.PARTNER, partnerType: p.partnerType,
          companyName: p.companyName,
          isVerified: true, bio: p.bio, bonusPoints: randInt(100, 500),
        },
      })
    )
  );
  console.log(`👥 Created ${partners.length} partners`);

  // ==================== BUYERS (10 accounts) ====================
  console.log("🛒 Creating buyers...");

  const buyerDefs = [
    { email: "ahmed@example.com", firstName: "Ahmed", lastName: "Mammadov", level: UserLevel.PREMIUM },
    { email: "anna@example.com", firstName: "Anna", lastName: "Kozlova", level: UserLevel.EXPLORER },
    { email: "ruslan@example.com", firstName: "Ruslan", lastName: "Mamedov", level: UserLevel.TRAVELER },
    { email: "elena@example.com", firstName: "Elena", lastName: "Petrova", level: UserLevel.PREMIUM },
    { email: "mikhail@example.com", firstName: "Mikhail", lastName: "Sidorov", level: UserLevel.ELITE },
    { email: "lara@example.com", firstName: "Lara", lastName: "Ivanova", level: UserLevel.TRAVELER },
    { email: "john@example.com", firstName: "John", lastName: "Smith", level: UserLevel.EXPLORER },
    { email: "fatima@example.com", firstName: "Fatima", lastName: "Aliyeva", level: UserLevel.PREMIUM },
    { email: "sofia@example.com", firstName: "Sofia", lastName: "Petrova", level: UserLevel.TRAVELER },
    { email: "alex@example.com", firstName: "Alex", lastName: "Johnson", level: UserLevel.EXPLORER },
  ];

  const buyers = await Promise.all(
    buyerDefs.map((b) =>
      prisma.user.create({
        data: {
          email: b.email, passwordHash: pw,
          firstName: b.firstName, lastName: b.lastName,
          role: UserRole.BUYER, isVerified: true,
          level: b.level, bonusPoints: randInt(50, 500),
        },
      })
    )
  );
  console.log(`🛒 Created ${buyers.length} buyers`);

  // ==================== SERVICES ====================
  console.log("📦 Creating services...");

  const serviceTypes = Object.keys(SERVICE_TITLES) as string[];
  const PER_TYPE = 200;

  const servicesToCreate: Array<{
    title: string; slug: string; description: string; shortDesc: string;
    type: ServiceType; price: number; currency: string; discountPrice: number | null;
    city: string; country: string; countryCode: string;
    latitude: number; longitude: number;
    rating: number; reviewCount: number; images: string;
    duration: string | null; maxGuests: number | null;
    languages: string; isActive: boolean; isFeatured: boolean;
    isHot: boolean; hotDiscount: number | null; providerId: string;
    freeCancellation: boolean;
  }> = [];

  for (const type of serviceTypes) {
    for (let i = 0; i < PER_TYPE; i++) {
      const country = pick(COUNTRIES);
      const cityIdx = i % country.cities.length;
      const city = country.cities[cityIdx];
      const lat = country.lat[cityIdx] + (Math.random() - 0.5) * 0.5;
      const lng = country.lng[cityIdx] + (Math.random() - 0.5) * 0.5;
      const partner = partners[i % partners.length];
      const titleSuffix = pick(SERVICE_TITLES[type]);
      const title = `${titleSuffix} — ${city} ${i + 1}`;
      const price = randInt(20, 900);
      const hasDiscount = Math.random() > 0.7;
      const rating = randFloat(3.5, 5.0);
      const reviewCount = randInt(0, 800);
      const duration = type === "HOTEL" ? "1 ночь" : type === "FLIGHT" ? `${randInt(1, 12)}ч ${randInt(0, 59)}м` : type === "TOUR" ? `${pick(["1 день", "2 дня", "3 дня", "4 дня", "5 дней", "6 дней", "7 дней", "8 дней", "10 дней", "14 дней"])}` : type === "EXCURSION" ? `${pick(["2 часа", "3 часа", "4 часа", "5 часов", "6 часов", "7 часов", "8 часов", "Полдня", "Весь день"])}` : `${randInt(1, 14)} часов`;
      const maxGuests = type === "FLIGHT" ? 1 : type === "HOTEL" ? 4 : randInt(2, 20);

      servicesToCreate.push({
        title, slug: slugify(`${title}-${type}-${i}-${country.code}`),
        description: generateDescription(type, city, country.name),
        shortDesc: `${titleSuffix} в ${city}`,
        type: type as ServiceType, price, currency: "AZN",
        discountPrice: hasDiscount ? Math.round(price * 0.85) : null,
        city, country: country.name, countryCode: country.code,
        latitude: Math.round(lat * 10000) / 10000,
        longitude: Math.round(lng * 10000) / 10000,
        rating, reviewCount, images: getImages(type), duration, maxGuests,
        languages: pickN(LANGUAGES, randInt(2, 5)).join(","),
        isActive: true, isFeatured: Math.random() > 0.85,
        isHot: Math.random() > 0.8,
        hotDiscount: Math.random() > 0.8 ? randInt(5, 25) : null,
        providerId: partner.id,
        freeCancellation: Math.random() > 0.5,
      });
    }
  }

  // ==================== MULTI-DAY TOURS (50 specific multi-day tours) ====================
  console.log("🗺  Creating multi-day tours...");

  const MULTI_DAY_TOURS = [
    { title: "Классический тур по Каппадокии", city: "Каппадокия", country: "Турция", countryCode: "TR", nights: 4, basePrice: 890, meal: "HB", hotelName: "Argos in Cappadocia", hotelClass: 5, roomType: "Deluxe Cave Suite", depCity: "Баку", depCode: "GYD", depTime: "06:30", arrCity: "Невшехир", arrCode: "NAV", arrTime: "10:15", retDepTime: "14:00", retArrTime: "17:45", transfer: true, transferType: "private", desc: "4 дня в волшебной Каппадокии: полёты на воздушных шарах, долина роз, подземные города, конные прогулки."
    },
    { title: "Анталья All Inclusive 7 ночей", city: "Анталья", country: "Турция", countryCode: "TR", nights: 7, basePrice: 1250, meal: "AI", hotelName: "Rixos Premium Belek", hotelClass: 5, roomType: "Superior Room", depCity: "Москва", depCode: "SVO", depTime: "08:00", arrCity: "Анталья", arrCode: "AYT", arrTime: "12:30", retDepTime: "15:00", retArrTime: "19:20", transfer: true, transferType: "standard", desc: "Незабываемый отдых на побережье Средиземного моря. 5-звёздочный отель, всё включено, частный пляж."
    },
    { title: "Турция: Стамбул + Каппадокия 10 дней", city: "Стамбул", country: "Турция", countryCode: "TR", nights: 9, basePrice: 1680, meal: "BB", hotelName: "Hagia Sophia Mansions", hotelClass: 5, roomType: "Historic Suite", depCity: "Баку", depCode: "GYD", depTime: "07:00", arrCity: "Стамбул", arrCode: "IST", arrTime: "09:30", retDepTime: "13:00", retArrTime: "16:30", transfer: true, transferType: "vip", desc: "10 дней: 3 дня в Стамбуле (Айя-София, базар, Босфор) + 6 дней в Каппадокии."
    },
    { title: "ОАЭ: Дубай + Абу-Даби 7 ночей", city: "Дубай", country: "ОАЭ", countryCode: "AE", nights: 7, basePrice: 2100, meal: "BB", hotelName: "Atlantis The Royal", hotelClass: 5, roomType: "Ocean King", depCity: "Москва", depCode: "SVO", depTime: "22:30", arrCity: "Дубай", arrCode: "DXB", arrTime: "05:00", retDepTime: "08:00", retArrTime: "12:30", transfer: true, transferType: "vip", desc: "7 ночей в роскоши: Бурдж-Халифа, пустынное сафари, острова Пальма, Абу-Даби Феррари Ворлд."
    },
    { title: "Египет: Хургада 10 ночей", city: "Хургада", country: "Египет", countryCode: "EG", nights: 10, basePrice: 1450, meal: "AI", hotelName: "Steigenberger Aqua Magic", hotelClass: 5, roomType: "Superior Room", depCity: "Москва", depCode: "SVO", depTime: "10:00", arrCity: "Хургада", arrCode: "HRG", arrTime: "16:00", retDepTime: "17:30", retArrTime: "23:10", transfer: true, transferType: "standard", desc: "10 ночейropical paradise: дайвинг, Луксор, Каир, Красное море."
    },
    { title: "Грузия: Тбилиси + Батуми 7 дней", city: "Тбилиси", country: "Грузия", countryCode: "GE", nights: 6, basePrice: 780, meal: "BB", hotelName: "Rooms Hotel Tbilisi", hotelClass: 5, roomType: "Standard Room", depCity: "Баку", depCode: "GYD", depTime: "09:00", arrCity: "Тбилиси", arrCode: "TBS", arrTime: "10:30", retDepTime: "16:00", retArrTime: "17:30", transfer: true, transferType: "standard", desc: "7 дней по Грузии: Тбилиси (старый город, Сулфо), Кахетия (вино), Батуми (набережная)."
    },
    { title: "Италия: Рим + Флоренция 10 дней", city: "Рим", country: "Италия", countryCode: "IT", nights: 9, basePrice: 2350, meal: "BB", hotelName: "Hotel de Russie", hotelClass: 5, roomType: "Deluxe Room", depCity: "Москва", depCode: "SVO", depTime: "07:30", arrCity: "Рим", arrCode: "FCO", arrTime: "10:00", retDepTime: "12:00", retArrTime: "17:30", transfer: false, transferType: "none", desc: "10 дней в Италии: Колизей, Ватикан, Флоренция (Уффици, Понте Веккьо), Пиза."
    },
    { title: "Испания: Барселона + Мадрид 10 дней", city: "Барселона", country: "Испания", countryCode: "ES", nights: 9, basePrice: 2200, meal: "BB", hotelName: "Hotel Arts Barcelona", hotelClass: 5, roomType: "Superior Room", depCity: "Москва", depCode: "SVO", depTime: "06:00", arrCity: "Барселона", arrCode: "BCN", arrTime: "09:30", retDepTime: "11:00", retArrTime: "17:00", transfer: false, transferType: "none", desc: "10 дней: Барселона (Саграда Фамилия, Парк Гуэль, Лас-Рамблас) + Мадрид (Прадо, Ретiro)."
    },
    { title: "Греция: Крит 7 ночей", city: "Крит", country: "Греция", countryCode: "GR", nights: 7, basePrice: 1350, meal: "AI", hotelName: "Domes of Elounda", hotelClass: 5, roomType: "Bungalow Sea View", depCity: "Москва", depCode: "SVO", depTime: "08:30", arrCity: "Ираклион", arrCode: "HER", arrTime: "12:30", retDepTime: "14:00", retArrTime: "18:00", transfer: true, transferType: "standard", desc: "7 ночей на острове Крит: Старый город Ханья, ущелье Самариа, пляжи Элафониси, критская кухня."
    },
    { title: "Мальдивы: Royal Island Resort 7 ночей", city: "Мале", country: "Мальдивы", countryCode: "MV", nights: 7, basePrice: 4500, meal: "AI", hotelName: "Royal Island Resort & Spa", hotelClass: 5, roomType: "Beach Villa", depCity: "Дубай", depCode: "DXB", depTime: "02:00", arrCity: "Мале", arrCode: "MLE", arrTime: "07:00", retDepTime: "20:00", retArrTime: "23:30", transfer: true, transferType: "vip", desc: "7 ночей рая: виллы на пляже, дайвинг, спа, романтические ужины на пляже."
    },
    { title: "Таиланд: Бангкок + Пхукет 14 ночей", city: "Бангкок", country: "Таиланд", countryCode: "TH", nights: 14, basePrice: 1800, meal: "BB", hotelName: "Anantara Riverside Resort", hotelClass: 5, roomType: "Deluxe Garden View", depCity: "Москва", depCode: "SVO", depTime: "21:00", arrCity: "Бангкок", arrCode: "BKK", arrTime: "08:30", retDepTime: "10:00", retArrTime: "17:30", transfer: true, transferType: "standard", desc: "14 ночей: 5 ночей Бангкок (храмы, базары) + 9 ночей Пхукет (пляжи, острова)."
    },
    { title: "Черногория: Будва + Котор 7 дней", city: "Будва", country: "Черногория", countryCode: "ME", nights: 6, basePrice: 850, meal: "BB", hotelName: "Aman Sveti Stefan", hotelClass: 5, roomType: "Adriatic Suite", depCity: "Москва", depCode: "SVO", depTime: "07:00", arrCity: "Тиват", arrCode: "TIV", arrTime: "10:00", retDepTime: "13:00", retArrTime: "16:30", transfer: true, transferType: "standard", desc: "7 дней: Будва (старый город), Котор (фьорд), Ловчен, Скадарское озеро, остров Святой Стефан."
    },
    { title: "Бали: Культурный тур 10 ночей", city: "Убуд", country: "Бали", countryCode: "ID", nights: 10, basePrice: 1600, meal: "BB", hotelName: "Hanging Gardens of Bali", hotelClass: 5, roomType: "Garden Suite", depCity: "Дубай", depCode: "DXB", depTime: "23:00", arrCity: "Денпасар", arrCode: "DPS", arrTime: "12:00", retDepTime: "01:00", retArrTime: "07:30", transfer: true, transferType: "vip", desc: "10 ночей: Убуд (храмы, рисовые террасы, обезьяний лес) + Семиньяк (пляжи, закаты)."
    },
    { title: "Доминикана: Пунта-Кана 14 ночей", city: "Пунта-Кана", country: "Доминикана", countryCode: "DO", nights: 14, basePrice: 2800, meal: "AI", hotelName: "Excellence El Carmen", hotelClass: 5, roomType: "One Bedroom Suite", depCity: "Москва", depCode: "SVO", depTime: "20:00", arrCity: "Пунта-Кана", arrCode: "PUJ", arrTime: "05:00", retDepTime: "07:00", retArrTime: "18:00", transfer: true, transferType: "standard", desc: "14 ночейropical dream: белоснежные пляжи, дайвинг, водопады, сафари."
    },
    { title: "Марокко: Марракеш + Фес 10 дней", city: "Марракеш", country: "Марокко", countryCode: "MA", nights: 9, basePrice: 1500, meal: "BB", hotelName: "Royal Mansour", hotelClass: 5, roomType: "Superior Riad", depCity: "Стамбул", depCode: "IST", depTime: "08:00", arrCity: "Марракеш", arrCode: "RAK", arrTime: "12:00", retDepTime: "14:00", retArrTime: "21:00", transfer: true, transferType: "standard", desc: "10 дней: Марракеш (медина, Джема-эль-Фна), Атласские горы, Фес (древний медина), Шефшауен."
    },
    { title: "Вьетнам: Ханой + Халонг 10 дней", city: "Ханой", country: "Вьетнам", countryCode: "VN", nights: 9, basePrice: 1400, meal: "BB", hotelName: "Sofitel Legend Metropole", hotelClass: 5, roomType: "Premium Room", depCity: "Москва", depCode: "SVO", depTime: "18:00", arrCity: "Ханой", arrCode: "HAN", arrTime: "05:30", retDepTime: "07:00", retArrTime: "14:30", transfer: true, transferType: "standard", desc: "10 дней: Ханой (старый город, озеро Хоан-Кием), 3 ночи на джонке в заливе Халонг."
    },
    { title: "Россия: Санкт-Петербург 5 дней", city: "Санкт-Петербург", country: "Россия", countryCode: "RU", nights: 4, basePrice: 950, meal: "BB", hotelName: "Four Seasons Lion Palace", hotelClass: 5, roomType: "Classic Room", depCity: "Москва", depCode: "SVO", depTime: "07:00", arrCity: "Санкт-Петербург", arrCode: "LED", arrTime: "08:30", retDepTime: "20:00", retArrTime: "21:30", transfer: false, transferType: "none", desc: "5 дней: Эрмитаж, Петропавловская крепость, Исаакиевский собор, Невский проспект, Петергоф."
    },
    { title: "Египет: Каир + Луксор 7 дней", city: "Каир", country: "Египет", countryCode: "EG", nights: 6, basePrice: 1100, meal: "BB", hotelName: "Marriott Mena House", hotelClass: 5, roomType: "Pyramid View Room", depCity: "Москва", depCode: "SVO", depTime: "09:00", arrCity: "Каир", arrCode: "CAI", arrTime: "14:00", retDepTime: "16:00", retArrTime: "21:00", transfer: true, transferType: "standard", desc: "7 дней: Великие пирамиды Гизы, Луксор (храмы, Долина Царей), Александрия."
    },
    { title: "Греция: Афины + Санторини 10 дней", city: "Афины", country: "Греция", countryCode: "GR", nights: 9, basePrice: 2000, meal: "BB", hotelName: "Canaves Oia Suites", hotelClass: 5, roomType: "Cave Suite", depCity: "Москва", depCode: "SVO", depTime: "07:00", arrCity: "Афины", arrCode: "ATH", arrTime: "10:00", retDepTime: "12:00", retArrTime: "16:30", transfer: false, transferType: "none", desc: "10 дней: 3 дня в Афинах (Акрополь, Плака) + 7 дней на Санторини (Ойя, вина, закаты)."
    },
    { title: "ОАЭ: Рас-эль-Хайма + Дубай 7 ночей", city: "Рас-эль-Хайма", country: "ОАЭ", countryCode: "AE", nights: 7, basePrice: 1700, meal: "AI", hotelName: "Waldorf Astoria Ras Al Khaimah", hotelClass: 5, roomType: "Deluxe Room Sea View", depCity: "Баку", depCode: "GYD", depTime: "06:00", arrCity: "Дубай", arrCode: "DXB", arrTime: "09:00", retDepTime: "11:00", retArrTime: "14:00", transfer: true, transferType: "vip", desc: "7 ночей: горы Хаджар, пустынное сафари, Дубай за день, пляжный отдых."
    },
    { title: "Турция: Бодрум 7 ночей", city: "Бодрум", country: "Турция", countryCode: "TR", nights: 7, basePrice: 1050, meal: "HB", hotelName: "Montenegro Loyalty Resort", hotelClass: 5, roomType: "Superior Sea View", depCity: "Москва", depCode: "SVO", depTime: "11:00", arrCity: "Бодрум", arrCode: "BJV", arrTime: "16:00", retDepTime: "17:30", retArrTime: "22:00", transfer: true, transferType: "standard", desc: "7 ночей: крепость Святого Петра, острова, яхтинг, ночная жизнь Бодрума."
    },
    { title: "Израиль: Тель-Авив + Иерусалим 7 дней", city: "Тель-Авив", country: "Израиль", countryCode: "IL", nights: 6, basePrice: 1800, meal: "BB", hotelName: "David Kempinski Tel Aviv", hotelClass: 5, roomType: "Deluxe Sea View", depCity: "Москва", depCode: "SVO", depTime: "06:00", arrCity: "Тель-Авив", arrCode: "TLV", arrTime: "11:00", retDepTime: "14:00", retArrTime: "18:30", transfer: false, transferType: "none", desc: "7 дней: Тель-Авив (пляжи, Яффо), Иерусалим (Старый город, Храмовая гора), Мёртвое море."
    },
    { title: "Турция: Памуккале + Кушадасы 5 дней", city: "Памуккале", country: "Турция", countryCode: "TR", nights: 4, basePrice: 680, meal: "BB", hotelName: "Pamukkale Thermal Hotel", hotelClass: 4, roomType: "Thermal Suite", depCity: "Стамбул", depCode: "IST", depTime: "07:00", arrCity: "Дензли", arrCode: "DNZ", arrTime: "08:30", retDepTime: "17:00", retArrTime: "18:30", transfer: true, transferType: "standard", desc: "5 дней: белые террасы Памуккале, древний город Иераполис, Кушадасы."
    },
    { title: "Бали: Пляжный релакс 10 ночей", city: "Нуса-Дуа", country: "Бали", countryCode: "ID", nights: 10, basePrice: 1900, meal: "AI", hotelName: "The Mulia Bali", hotelClass: 5, roomType: "Ocean Suite", depCity: "Москва", depCode: "SVO", depTime: "20:00", arrCity: "Денпасар", arrCode: "DPS", arrTime: "12:30", retDepTime: "02:00", retArrTime: "08:30", transfer: true, transferType: "vip", desc: "10 ночейropical paradise: частный пляж, олл инклузив, спа-процедуры, закатные ужины."
    },
    { title: "Россия: Москва 5 дней", city: "Москва", country: "Россия", countryCode: "RU", nights: 4, basePrice: 800, meal: "BB", hotelName: "Hotel Baltschug Kempinski", hotelClass: 5, roomType: "Superior Room Kremlin View", depCity: "Баку", depCode: "GYD", depTime: "08:00", arrCity: "Москва", arrCode: "SVO", arrTime: "10:30", retDepTime: "19:00", retArrTime: "21:30", transfer: false, transferType: "none", desc: "5 дней: Красная площадь, Третьяковка, Большой театр, Парк Горького, ВДНХ."
    },
  ];

  // TOUR_OPERATOR partner for multi-day tours
  const tourOperatorPartner = await prisma.user.create({
    data: {
      email: "tour-operator@travelhub.az", passwordHash: pw,
      firstName: "Alexander", lastName: "Volkov",
      role: UserRole.PARTNER, partnerType: PartnerType.TOUR_OPERATOR,
      companyName: "TravelHub Tour Operator",
      isVerified: true, bio: "Крупный туроператор. Многодневные туры по всему миру.",
      bonusPoints: 500,
    },
  });
  partners.push(tourOperatorPartner);

  const multiDayServiceIds: string[] = [];
  for (const tour of MULTI_DAY_TOURS) {
    const svc = await prisma.service.create({
      data: {
        title: tour.title,
        slug: slugify(`${tour.title}-tour-${tour.countryCode}-${randInt(1000,9999)}`),
        description: tour.desc,
        shortDesc: `${tour.nights + 1} дней / ${tour.nights} ночей — ${tour.city}, ${tour.country}`,
        type: ServiceType.TOUR,
        tourCategory: TourCategory.MULTI_DAY,
        price: tour.basePrice,
        currency: "AZN",
        city: tour.city,
        country: tour.country,
        countryCode: tour.countryCode,
        latitude: 0,
        longitude: 0,
        rating: randFloat(4.0, 5.0),
        reviewCount: randInt(10, 200),
        images: getImages("TOUR"),
        duration: `${tour.nights + 1} дней / ${tour.nights} ночей`,
        maxGuests: 20,
        languages: "RU,EN",
        isActive: true,
        isFeatured: true,
        isHot: Math.random() > 0.6,
        hotDiscount: Math.random() > 0.7 ? randInt(5, 20) : null,
        providerId: tourOperatorPartner.id,
        freeCancellation: Math.random() > 0.5,
      },
      select: { id: true },
    });
    multiDayServiceIds.push(svc.id);

    // Flight details (outbound + return)
    await prisma.flightDetail.createMany({
      data: [
        {
          serviceId: svc.id, flightNumber: `TK-${randInt(1000, 9999)}`,
          airline: pick(["Turkish Airlines", "AZAL", "FlyDubai", "Emirates", "Pegasus Airlines"]),
          departureCity: tour.depCity, departureCode: tour.depCode, departureTime: tour.depTime,
          arrivalCity: tour.arrCity, arrivalCode: tour.arrCode, arrivalTime: tour.arrTime,
          returnFlight: false, sortOrder: 0,
        },
        {
          serviceId: svc.id, flightNumber: `TK-${randInt(1000, 9999)}`,
          airline: pick(["Turkish Airlines", "AZAL", "FlyDubai", "Emirates", "Pegasus Airlines"]),
          departureCity: tour.arrCity, departureCode: tour.arrCode, departureTime: tour.retDepTime,
          arrivalCity: tour.depCity, arrivalCode: tour.depCode, arrivalTime: tour.retArrTime,
          returnFlight: true, sortOrder: 1,
        },
      ],
    });

    // Tour hotel
    await prisma.tourHotel.create({
      data: {
        serviceId: svc.id, hotelName: tour.hotelName,
        hotelClass: tour.hotelClass, roomType: tour.roomType,
        mealPlan: tour.meal,
        description: `${tour.roomType} в ${tour.hotelName} (${"★".repeat(tour.hotelClass)}), питание: ${tour.meal}`,
        sortOrder: 0,
      },
    });

    // Transfer details
    await prisma.transferDetail.create({
      data: {
        serviceId: svc.id, included: tour.transfer,
        type: tour.transferType,
        description: tour.transfer ? `Трансфер ${tour.transferType}: аэропорт ↔ отель` : "Трансфер не включён",
        fromPlace: "Аэропорт",
        toPlace: tour.hotelName,
        sortOrder: 0,
      },
    });

    // Price variants for multi-day
    const today = new Date();
    const month3 = new Date(today); month3.setMonth(month3.getMonth() + 3);
    const nights = tour.nights;
    for (const adults of [2, 1]) {
      for (const children of [0, 1]) {
        for (const meal of [tour.meal, "BB"]) {
          const mealMod = meal === "AI" ? 45 : meal === "FB" ? 30 : meal === "HB" ? 15 : 0;
          const childMod = children > 0 ? Math.round(tour.basePrice * 0.3) : 0;
          const singleMod = adults === 1 ? Math.round(tour.basePrice * 0.6) : 0;
          await prisma.servicePriceVariant.create({
            data: {
              serviceId: svc.id, dateFrom: today, dateTo: month3,
              roomType: tour.roomType, mealPlan: meal,
              childAgeFrom: children > 0 ? 2 : null,
              childAgeTo: children > 0 ? 11 : null,
              guestsAdults: adults, guestsChildren: children,
              nights, pricePerPerson: Math.max(100, tour.basePrice + mealMod + childMod + singleMod),
              availableSlots: randInt(5, 30),
            },
          });
        }
      }
    }
  }
  console.log(`🗺  Created ${multiDayServiceIds.length} multi-day tours with flights, hotels, transfers`);

  const BATCH = 100;
  const createdServices: { id: string; type: string }[] = [];
  for (let i = 0; i < servicesToCreate.length; i += BATCH) {
    const batch = servicesToCreate.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map((s) => prisma.service.create({ data: s, select: { id: true, type: true } }))
    );
    createdServices.push(...results);
    process.stdout.write(`  📦 ${createdServices.length}/${servicesToCreate.length}\r`);
  }
  console.log(`\n📦 Created ${createdServices.length} services`);

  // Mark TOUR services without tourCategory as ONE_DAY (must run AFTER creation)
  const updated = await prisma.service.updateMany({
    where: { type: ServiceType.TOUR, tourCategory: null },
    data: { tourCategory: TourCategory.ONE_DAY },
  });
  console.log(`🗺  Marked ${updated.count} tours as ONE_DAY`);

  // ==================== AMENITIES ====================
  console.log("🏷  Creating amenities...");
  const amenityData: Array<{ serviceId: string; name: string; icon: string | null }> = [];
  for (const svc of createdServices) {
    for (const a of pickN(AMENITIES, randInt(2, 6))) {
      amenityData.push({ serviceId: svc.id, name: a.name, icon: a.icon });
    }
  }
  for (let i = 0; i < amenityData.length; i += BATCH) {
    await prisma.serviceAmenity.createMany({ data: amenityData.slice(i, i + BATCH) });
  }
  console.log(`🏷  Created ${amenityData.length} amenities`);

  // ==================== SCHEDULES ====================
  console.log("📅 Creating schedules...");
  const scheduleData: Array<{ serviceId: string; date: Date; available: boolean; slots: number }> = [];
  for (const svc of createdServices.slice(0, 500)) {
    for (let d = 1; d <= 60; d++) {
      const date = new Date(); date.setDate(date.getDate() + d);
      const hash = svc.id.charCodeAt(0) * 31 + d * 17;
      scheduleData.push({ serviceId: svc.id, date, available: hash % 5 !== 0, slots: hash % 5 !== 0 ? (hash % 12) + 1 : 0 });
    }
  }
  for (let i = 0; i < scheduleData.length; i += BATCH) {
    await prisma.serviceSchedule.createMany({ data: scheduleData.slice(i, i + BATCH) });
  }
  console.log(`📅 Created ${scheduleData.length} schedules`);

  // ==================== ROOM TYPES (for HOTEL services) ====================
  console.log("🛏  Creating room types...");
  const hotelServicesForRooms = createdServices.filter((s) => s.type === "HOTEL");
  let roomTypeCount = 0;

  for (const svc of hotelServicesForRooms) {
    // Each hotel gets 2-5 random room types
    const selectedRooms = pickN(ROOM_TYPES, randInt(2, 5));
    for (let idx = 0; idx < selectedRooms.length; idx++) {
      const slug = selectedRooms[idx];
      const name = ROOM_TYPE_NAMES[slug] || slug;
      const [base, child] = ROOM_BASE_PRICES[slug] || [80, 40];

      await prisma.roomType.create({
        data: {
          serviceId: svc.id,
          name,
          slug,
          description: `${name} — комфортный номер с современными удобствами`,
          maxAdults: slug === "studio" || slug === "standard" ? 2 : slug.includes("family") || slug === "connecting_rooms" ? 4 : 3,
          maxChildren: slug.includes("family") || slug === "connecting_rooms" ? 2 : 1,
          basePrice: base + randInt(-10, 30),
          currency: "AZN",
          images: pickN(HOTEL_IMAGES, 1).join(","),
          amenities: pickN(ROOM_AMENITIES_LIST, randInt(4, 8)).join(","),
          sortOrder: idx,
          isActive: true,
          // New filter attributes
          bedType: pick(BED_TYPES),
          view: pick(VIEWS),
          smoking: pick(SMOKING_OPTIONS),
          balcony: pick(BALCONY_OPTIONS),
          bathroom: pick(BATHROOM_OPTIONS),
          area: pick(AREA_OPTIONS),
          occupancy: pick(OCCUPANCY_OPTIONS),
          roomCount: randInt(2, 20),
        },
      });
      roomTypeCount++;
    }
  }
  console.log(`🛏  Created ${roomTypeCount} room types for ${hotelServicesForRooms.length} hotels`);

  // ==================== PRICE VARIANTS (for first 200 HOTEL/TOUR services) ====================
  console.log("💰 Creating price variants...");
  const variantData: Array<{
    serviceId: string; dateFrom: Date; dateTo: Date;
    roomType: string | null; mealPlan: string | null;
    childAgeFrom: number | null; childAgeTo: number | null;
    guestsAdults: number; guestsChildren: number; nights: number | null;
    pricePerPerson: number; availableSlots: number;
  }> = [];

  const hotelServices = createdServices.filter((s) => s.type === "HOTEL").slice(0, 50);
  const tourServices = createdServices.filter((s) => s.type === "TOUR").slice(0, 50);

  for (const svc of hotelServices) {
    const base = randInt(60, 400);
    const today = new Date();
    const month3 = new Date(today); month3.setMonth(month3.getMonth() + 3);

    for (const room of pickN(ROOM_TYPES, randInt(2, 4))) {
      for (const meal of pickN(MEAL_PLANS, randInt(2, 4))) {
        const roomMod = room === "suite" ? 60 : room === "deluxe" ? 30 : room === "family" ? 40 : room === "standard" ? 0 : 10;
        const mealMod = meal === "AI" ? 45 : meal === "FB" ? 30 : meal === "HB" ? 15 : 0;
        for (const adults of [2, 3]) {
          for (const children of [0, 1]) {
            const childMod = children > 0 ? 15 : 0;
            variantData.push({
              serviceId: svc.id, dateFrom: today, dateTo: month3,
              roomType: room, mealPlan: meal,
              childAgeFrom: children > 0 ? 0 : null, childAgeTo: children > 0 ? 11 : null,
              guestsAdults: adults, guestsChildren: children, nights: null,
              pricePerPerson: Math.max(10, base + roomMod + mealMod + childMod + (adults - 2) * 20),
              availableSlots: randInt(1, 10),
            });
          }
        }
      }
    }
  }

  for (const svc of tourServices) {
    const base = randInt(80, 600);
    const today = new Date();
    const month3 = new Date(today); month3.setMonth(month3.getMonth() + 3);

    for (const nights of [3, 5, 7]) {
      for (const adults of [2]) {
        for (const children of [0, 1]) {
          const nightMod = nights > 7 ? (nights - 7) * 15 : 0;
          const childMod = children > 0 ? 20 : 0;
          variantData.push({
            serviceId: svc.id, dateFrom: today, dateTo: month3,
            roomType: null, mealPlan: pick(["BB", "HB", "AI"]),
            childAgeFrom: children > 0 ? 5 : null, childAgeTo: children > 0 ? 11 : null,
            guestsAdults: adults, guestsChildren: children, nights,
            pricePerPerson: Math.max(20, base + nightMod + childMod),
            availableSlots: randInt(3, 20),
          });
        }
      }
    }
  }

  for (let i = 0; i < variantData.length; i += BATCH) {
    await prisma.servicePriceVariant.createMany({ data: variantData.slice(i, i + BATCH) });
  }
  console.log(`💰 Created ${variantData.length} price variants`);

  // ==================== REVIEWS ====================
  console.log("⭐ Creating reviews...");
  const reviewTexts = [
    { title: "Отлично!", text: "Всё на высшем уровне. Очень доволен сервисом." },
    { title: "Рекомендую!", text: "Отличный опыт. Обязательно вернусь." },
    { title: "Хорошо", text: "Всё понравилось, есть небольшие замечания." },
    { title: "Супер!", text: "Потрясающий сервис! Лучшее в путешествии." },
    { title: "Нормально", text: "Средний уровень, ничего особенного." },
  ];
  const reviewData: Array<{ rating: number; title: string | null; text: string; userId: string; serviceId: string }> = [];
  for (let i = 0; i < Math.min(300, createdServices.length); i++) {
    const rev = pick(reviewTexts);
    reviewData.push({ rating: randInt(3, 5), title: rev.title, text: rev.text, userId: pick(buyers).id, serviceId: createdServices[i].id });
  }
  for (let i = 0; i < reviewData.length; i += BATCH) {
    await prisma.review.createMany({ data: reviewData.slice(i, i + BATCH), skipDuplicates: true });
  }
  console.log(`⭐ Created ${reviewData.length} reviews`);

  // ==================== BOOKINGS ====================
  console.log("🛒 Creating bookings...");
  const bookingData: Array<{ status: BookingStatus; checkIn: Date; checkOut: Date; guests: number; totalPrice: number; serviceFee: number; currency: string; userId: string; serviceId: string }> = [];
  for (let i = 0; i < 50; i++) {
    const checkIn = new Date(); checkIn.setDate(checkIn.getDate() + randInt(1, 60));
    const checkOut = new Date(checkIn); checkOut.setDate(checkOut.getDate() + randInt(1, 14));
    bookingData.push({
      status: pick([BookingStatus.CONFIRMED, BookingStatus.PENDING, BookingStatus.COMPLETED]),
      checkIn, checkOut, guests: randInt(1, 4),
      totalPrice: randInt(50, 2000), serviceFee: randInt(5, 200),
      currency: "AZN", userId: pick(buyers).id, serviceId: pick(createdServices).id,
    });
  }
  await prisma.booking.createMany({ data: bookingData });
  console.log(`🛒 Created ${bookingData.length} bookings`);

  // ==================== SUMMARY ====================
  console.log("\n✅ Seeding complete!\n");
  console.log("═══════════════════════════════════════════════════════");
  console.log("  LOGIN CREDENTIALS (all passwords: password123)");
  console.log("═══════════════════════════════════════════════════════");
  console.log("  👑 ADMIN");
  console.log("    admin@travelhub.az");
  console.log("");
  console.log("  🤝 PARTNERS (Гиды и Экскурсии)");
  console.log("    guide-antalya@travelhub.az   — Гид, Анталья");
  console.log("    guide-istanbul@travelhub.az  — Гид, Стамбул");
  console.log("    guide-tbilisi@travelhub.az   — Гид, Тбилиси");
  console.log("    guide-dubai@travelhub.az     — Гид, Дубай");
  console.log("    excursion-rome@travelhub.az  — Экскурсионер, Рим");
  console.log("    excursion-bali@travelhub.az  — Экскурсионер, Бали");
  console.log("    excursion-cairo@travelhub.az — Экскурсионер, Египет");
  console.log("    excursion-budva@travelhub.az — Экскурсионер, Черногория");
  console.log("");
  console.log("  🤝 PARTNERS (Отели, Фотографы, Транспорт)");
  console.log("    hotel-antalya@travelhub.az   — Отель, Анталья");
  console.log("    hotel-dubai@travelhub.az     — Отель, Дубай");
  console.log("    hotel-greece@travelhub.az    — Отель, Греция");
  console.log("    photo-rome@travelhub.az      — Фотограф, Рим");
  console.log("    photo-bali@travelhub.az      — Фотограф, Бали");
  console.log("    transfer-antalya@travelhub.az — Трансфер, Анталья");
  console.log("");
  console.log("  🛒 BUYERS (Покупатели)");
  console.log("    ahmed@example.com     — PREMIUM");
  console.log("    anna@example.com      — EXPLORER");
  console.log("    ruslan@example.com    — TRAVELER");
  console.log("    elena@example.com     — PREMIUM");
  console.log("    mikhail@example.com   — ELITE");
  console.log("    lara@example.com      — TRAVELER");
  console.log("    john@example.com      — EXPLORER");
  console.log("    fatima@example.com    — PREMIUM");
  console.log("    sofia@example.com     — TRAVELER");
  console.log("    alex@example.com      — EXPLORER");
  console.log("═══════════════════════════════════════════════════════");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
