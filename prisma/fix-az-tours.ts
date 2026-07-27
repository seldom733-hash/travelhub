import * as fs from "fs";

const filePath = "src/locales/az.json";
let content = fs.readFileSync(filePath, "utf8");

const replacements: [string, string][] = [
  ["Turlərə", "Turlara"],
  ["turlərə", "turlara"],
  ["Turlarə", "Turlara"],
  ["turlarə", "turlara"],
  ["Turlər", "Turlar"],
  ["turlər", "turlar"],
];

let total = 0;
for (const [from, to] of replacements) {
  const count = content.split(from).length - 1;
  content = content.split(from).join(to);
  if (count > 0) console.log(`${from} -> ${to}: ${count}`);
  total += count;
}

fs.writeFileSync(filePath, content);
console.log(`Total replacements: ${total}`);

// Verify
const d = JSON.parse(fs.readFileSync(filePath, "utf8"));
console.log("--- Verified translations ---");
console.log("nav.tours:", d.nav?.tours);
console.log("categories.items.tours:", d.categories?.items?.tours);
console.log("footer.tours:", d.footer?.tours);
console.log("bookings.viewTours:", d.bookings?.viewTours);
console.log("header.searchPlaceholder:", d.header?.searchPlaceholder);
console.log("hotTours.badge:", d.hotTours?.badge);
console.log("filter.options.tours:", d.filter?.options?.tours);
