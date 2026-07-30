import { readFileSync, writeFileSync } from 'fs';

let content = readFileSync('prisma/seed.ts', 'utf8');

// Fix 1: Replace the broken "undefined" line with proper ROOM_BASE_PRICES constant
content = content.replace(
  /const ROOM_AMENITIES_LIST = \[.*\];\n\nundefined/,
  `const ROOM_AMENITIES_LIST = ["Wi-Fi", "Кондиционер", "Мини-бар", "Сейф", "Телевизор", "Кофемашина", "Чайник", "Рабочий стол", "Кухня", "Холодильник", "Стиральная машина", "Фен", "Халаты", "Тапочки", "Микроволновая печь", "Утюг"];

const ROOM_BASE_PRICES: Record<string, [number, number]> = {
  standard: [60, 30], superior: [80, 40], deluxe: [120, 60], premium: [150, 75],
  executive: [180, 90], club: [200, 100], family: [140, 70], studio: [90, 45],
  junior_suite: [200, 100], suite: [300, 150], executive_suite: [350, 175],
  presidential_suite: [500, 250], royal_suite: [600, 300], honeymoon_suite: [400, 200],
  apartment: [110, 55], villa: [450, 225], bungalow: [180, 90], cottage: [160, 80],
  chalet: [220, 110], duplex: [250, 125], penthouse: [400, 200],
  connecting_rooms: [180, 90], accessible: [70, 35],
};
`
);

// Fix 2: Add childPrice to room type creation if not already present
if (!content.includes('childPrice: child + randInt')) {
  content = content.replace(
    '          basePrice: base + randInt(-10, 30),\n          currency: "AZN",',
    '          basePrice: base + randInt(-10, 30),\n          childPrice: child + randInt(-5, 15),\n          currency: "AZN",'
  );
}

writeFileSync('prisma/seed.ts', content, 'utf8');
console.log('Fixed seed.ts successfully');
