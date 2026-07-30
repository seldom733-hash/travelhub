/**
 * Shared constants used by both seed data generation and filter system.
 * Centralizes all valid slugs so seed.ts and keywords.ts stay in sync.
 */

// ── Room types ──
export const ROOM_TYPES = [
  "standard", "superior", "deluxe", "premium", "executive", "club",
  "family", "studio", "junior_suite", "suite", "executive_suite",
  "presidential_suite", "royal_suite", "honeymoon_suite", "apartment",
  "villa", "bungalow", "cottage", "chalet", "duplex", "penthouse",
  "connecting_rooms", "accessible",
] as const;

export const ROOM_TYPE_NAMES: Record<string, string> = {
  standard: "Standard Room", superior: "Superior Room", deluxe: "Deluxe Room",
  premium: "Premium Room", executive: "Executive Room", club: "Club Room",
  family: "Family Room", studio: "Studio", junior_suite: "Junior Suite",
  suite: "Suite", executive_suite: "Executive Suite", presidential_suite: "Presidential Suite",
  royal_suite: "Royal Suite", honeymoon_suite: "Honeymoon Suite", apartment: "Apartment",
  villa: "Villa", bungalow: "Bungalow", cottage: "Cottage", chalet: "Chalet",
  duplex: "Duplex", penthouse: "Penthouse", connecting_rooms: "Connecting Rooms",
  accessible: "Accessible Room",
};

export const ROOM_TYPE_NAMES_RU: Record<string, string> = {
  standard: "Стандартный", superior: "Улучшенный", deluxe: "Делюкс",
  premium: "Премиум", executive: "Представительский", club: "Клубный",
  family: "Семейный", studio: "Студия", junior_suite: "Полулюкс",
  suite: "Люкс", executive_suite: "Представительский люкс", presidential_suite: "Президентский люкс",
  royal_suite: "Королевский люкс", honeymoon_suite: "Свадебный люкс", apartment: "Апартаменты",
  villa: "Вилла", bungalow: "Бунгало", cottage: "Коттедж", chalet: "Шале",
  duplex: "Двухуровневый", penthouse: "Пентхаус", connecting_rooms: "Смежные номера",
  accessible: "Доступный номер",
};

// ── Bed types ──
export const BED_TYPES = [
  "single", "twin", "double", "queen", "king", "super_king",
  "sofa", "bunk", "baby_cot", "extra_bed",
] as const;

// ── View types ──
export const VIEWS = [
  "city", "sea", "sea_direct", "sea_partial", "pool", "garden",
  "mountain", "lake", "park", "river", "no_view", "panoramic",
] as const;

// ── Smoking options ──
export const SMOKING_OPTIONS = ["non_smoking", "smoking"] as const;

// ── Balcony options ──
export const BALCONY_OPTIONS = [
  "no_balcony", "balcony", "french_balcony", "terrace", "private_garden",
] as const;

// ── Bathroom options ──
export const BATHROOM_OPTIONS = [
  "shower", "bathtub", "jacuzzi", "private_pool", "shared",
] as const;

// ── Area options ──
export const AREA_OPTIONS = ["under_20", "20_30", "30_50", "over_50"] as const;

// ── Occupancy options ──
export const OCCUPANCY_OPTIONS = [
  "sgl", "dbl", "twn", "tpl", "qdpl", "2_1", "2_2", "3_1", "4_1",
] as const;

// ── Room amenities (Russian names used in descriptions) ──
export const ROOM_AMENITIES_LIST = [
  "Wi-Fi", "Кондиционер", "Мини-бар", "Сейф", "Телевизор", "Кофемашина",
  "Чайник", "Рабочий стол", "Кухня", "Холодильник", "Стиральная машина",
  "Фен", "Халаты", "Тапочки", "Микроволновая печь", "Утюг",
] as const;

// ── Room base prices [adultPrice, childPrice] ──
export const ROOM_BASE_PRICES: Record<string, [number, number]> = {
  standard: [60, 30], superior: [80, 40], deluxe: [120, 60], premium: [150, 75],
  executive: [180, 90], club: [200, 100], family: [140, 70], studio: [90, 45],
  junior_suite: [200, 100], suite: [300, 150], executive_suite: [350, 175],
  presidential_suite: [500, 250], royal_suite: [600, 300], honeymoon_suite: [400, 200],
  apartment: [110, 55], villa: [450, 225], bungalow: [180, 90], cottage: [160, 80],
  chalet: [220, 110], duplex: [250, 125], penthouse: [400, 200],
  connecting_rooms: [180, 90], accessible: [70, 35],
};

// ── Meal plans ──
export const MEAL_PLANS = ["RO", "BB", "HB", "FB", "AI"] as const;

// ── Languages ──
export const LANGUAGES = ["RU", "EN", "TR", "AZ", "GE", "DE", "FR", "IT", "ES", "TH", "EL"] as const;
