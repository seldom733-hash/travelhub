/**
 * i18n Key Audit Script
 * 
 * Scans all tsx/ts files in src/ for t() calls and validates
 * that each key exists in all 3 locale files (ru.json, en.json, az.json).
 * 
 * Usage: npx tsx scripts/check-i18n-keys.ts
 *        npx npm run check:i18n
 * 
 * Exit code 0 = all keys present, 1 = missing keys found
 */

import * as fs from 'fs';
import * as path from 'path';

// ── Config ──
const SRC_DIR = path.resolve(__dirname, '../src');
const LOCALE_DIR = path.resolve(SRC_DIR, 'locales');
const LOCALES = ['ru', 'en', 'az'] as const;

// Known false-positive keys (URL params, HTTP headers, etc. — not i18n keys)
const FALSE_POSITIVES = new Set([
  'Authorization', 'Content-Type', 'application/json',
]);

// ── Flatten nested JSON into dot-notation keys ──
function flattenObj(obj: Record<string, any>, prefix = ''): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const val = obj[key];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      Object.assign(result, flattenObj(val, fullKey));
    } else {
      result[fullKey] = val;
    }
  }
  return result;
}

// ── Load and flatten all locales ──
function loadLocales(): Record<string, Record<string, any>> {
  const result: Record<string, Record<string, any>> = {};
  for (const locale of LOCALES) {
    const filePath = path.join(LOCALE_DIR, `${locale}.json`);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Locale file not found: ${filePath}`);
      process.exit(1);
    }
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    result[locale] = flattenObj(raw);
  }
  return result;
}

// ── Check if a key is likely a real i18n key (not a URL param, etc.) ──
function isLikelyI18nKey(key: string): boolean {
  // Must have a dot (namespaced key like 'nav.tours', 'filter.hotel.view')
  if (!key.includes('.')) return false;
  // Must start with a known prefix
  const validPrefixes = [
    'nav.', 'header.', 'common.', 'auth.', 'hero.', 'categories.', 'search.',
    'popularDestinations.', 'hotTours.', 'excursions.', 'hotels.', 'sanatoriums.',
    'flights.', 'trains.', 'guides.', 'photographers.', 'transfers.',
    'filter.', 'serviceDetail.', 'serviceCard.', 'map.', 'catalog.', 'status.',
    'whyTravelHub.', 'forPartners.', 'footer.', 'cart.', 'bookings.',
    'favorites.', 'notifications.', 'dashboard.', 'notFound.', 'faq.',
    'terms.', 'privacy.', 'returns.', 'settings.', 'loyalty.', 'chat.',
    'checkout.', 'blog.', 'reviews.', 'admin.', 'aiSearch.', 'destinations.',
    'tours.',
  ];
  if (!validPrefixes.some(p => key.startsWith(p))) return false;
  // Reject URL param patterns
  if (FALSE_POSITIVES.has(key)) return false;
  return true;
}

// ── Extract t() keys from source file content ──
function extractKeysFromFile(content: string): Set<string> {
  const keys = new Set<string>();

  // Pattern 1: t('literal.key') or t("literal.key")
  // With optional || fallback or , options
  const literalPattern = /t\(\s*['"]([a-zA-Z][a-zA-Z0-9_.]*?)['"]/g;
  let match;
  while ((match = literalPattern.exec(content)) !== null) {
    const key = match[1];
    if (isLikelyI18nKey(key)) {
      keys.add(key);
    }
  }

  // Pattern 2: Template literals like t(`filter.hotel.${rt.bedType}`)
  // Extract the static prefix and check it exists as a namespace
  const templatePattern = /t\(\s*`([a-zA-Z][a-zA-Z0-9_]*?)\.\$\{/g;
  while ((match = templatePattern.exec(content)) !== null) {
    const namespace = match[1];
    if (isLikelyI18nKey(namespace + '.x')) {
      keys.add(namespace + '.*'); // Mark as namespace check
    }
  }

  return keys;
}

// ── Extract i18nKey from filterConfig.ts ──
function extractFilterConfigKeys(content: string): Set<string> {
  const keys = new Set<string>();

  // Match i18nKey: "filter.xxx.yyy"
  const i18nKeyPattern = /i18nKey:\s*['"]([a-zA-Z][a-zA-Z0-9_.]*?)['"]/g;
  let match;
  while ((match = i18nKeyPattern.exec(content)) !== null) {
    keys.add(match[1]);
  }

  // Match label: "filter.xxx.yyy" (only i18n-style labels)
  const labelPattern = /label:\s*['"]([a-zA-Z][a-zA-Z0-9_]*?\.[a-zA-Z][a-zA-Z0-9_.]*?)['"]/g;
  while ((match = labelPattern.exec(content)) !== null) {
    const label = match[1];
    if (label.startsWith('filter.') && label.includes('.')) {
      keys.add(label);
    }
  }

  return keys;
}

// ── Scan all source files ──
function scanAllSourceFiles(): { literalKeys: Set<string>; namespaces: Set<string> } {
  const literalKeys = new Set<string>();
  const namespaces = new Set<string>();

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (['node_modules', '.next', '.git'].includes(entry.name)) continue;
        walk(fullPath);
      } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
        if (/\.(test|spec)\.(tsx?|jsx?)$/.test(entry.name) || entry.name.endsWith('.d.ts')) {
          continue;
        }
        const content = fs.readFileSync(fullPath, 'utf8');
        const fileKeys = extractKeysFromFile(content);
        for (const k of fileKeys) {
          if (k.endsWith('.*')) {
            namespaces.add(k.slice(0, -2));
          } else {
            literalKeys.add(k);
          }
        }

        // Also extract from filterConfig.ts
        if (entry.name === 'filterConfig.ts') {
          const filterKeys = extractFilterConfigKeys(content);
          for (const k of filterKeys) literalKeys.add(k);
        }
      }
    }
  }

  walk(SRC_DIR);
  return { literalKeys, namespaces };
}

// ── Main ──
function main() {
  console.log('🔍 i18n Key Audit\n');

  // Load locales
  const locales = loadLocales();
  const totalKeys: Record<string, number> = {};
  for (const locale of LOCALES) {
    totalKeys[locale] = Object.keys(locales[locale]).length;
    console.log(`  📄 ${locale}.json: ${totalKeys[locale]} keys`);
  }

  // Scan source files
  console.log('\n📂 Scanning src/ for t() calls...');
  const { literalKeys, namespaces } = scanAllSourceFiles();
  console.log(`  Found ${literalKeys.size} literal keys + ${namespaces.size} namespace prefixes\n`);

  // Check each literal key against all locales
  let totalMissing = 0;
  const missingByLocale: Record<string, string[]> = {};
  const warnings: string[] = [];
  for (const locale of LOCALES) missingByLocale[locale] = [];

  const sortedKeys = Array.from(literalKeys).sort();

  for (const key of sortedKeys) {
    for (const locale of LOCALES) {
      if (!(key in locales[locale])) {
        missingByLocale[locale].push(key);
        totalMissing++;
      }
    }
  }

  // Check namespaces: for each namespace prefix, verify at least some sub-keys exist
  for (const ns of Array.from(namespaces).sort()) {
    for (const locale of LOCALES) {
      const hasSubKeys = Object.keys(locales[locale]).some(k => k.startsWith(ns + '.'));
      if (!hasSubKeys) {
        warnings.push(`⚠️  Namespace "${ns}.*" has no sub-keys in ${locale}.json`);
      }
    }
  }

  // Report warnings
  if (warnings.length > 0) {
    console.log('Warnings:');
    for (const w of warnings) console.log(`  ${w}`);
    console.log('');
  }

  // Report results
  if (totalMissing === 0) {
    console.log('✅ All i18n keys are present in all locale files!\n');
    process.exit(0);
  }

  console.log(`❌ Found ${totalMissing} missing key(s):\n`);

  for (const locale of LOCALES) {
    const missing = missingByLocale[locale];
    if (missing.length > 0) {
      console.log(`  📄 ${locale}.json — ${missing.length} missing:`);
      for (const key of missing) {
        console.log(`     • ${key}`);
      }
      console.log('');
    } else {
      console.log(`  📄 ${locale}.json — ✅ complete\n`);
    }
  }

  // Summary table
  console.log('─── Summary ───');
  console.log(`  Total literal keys used: ${literalKeys.size}`);
  console.log(`  Namespace prefixes: ${namespaces.size}`);
  for (const locale of LOCALES) {
    const missing = missingByLocale[locale].length;
    const status = missing === 0 ? '✅' : `❌ ${missing} missing`;
    console.log(`  ${locale}.json: ${totalKeys[locale]} keys — ${status}`);
  }
  console.log('');

  process.exit(1);
}

main();
