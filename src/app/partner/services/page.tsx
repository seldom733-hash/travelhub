"use client";

import { useState, useRef } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

// ==================== CONSTANTS ====================
const MEAL_PLANS = [
  { value: "RO", label: "RO — Без питания", mod: 0 },
  { value: "BB", label: "BB — Завтрак", mod: 0 },
  { value: "HB", label: "HB — Полупансион", mod: 15 },
  { value: "FB", label: "FB — Полный пансион", mod: 30 },
  { value: "AI", label: "AI — Всё включено", mod: 45 },
];

const ROOM_SIZES = [
  { value: "standard", label: "Standard", mod: 0 },
  { value: "economy", label: "Economy", mod: -20 },
  { value: "comfort", label: "Comfort", mod: 10 },
  { value: "deluxe", label: "Deluxe", mod: 30 },
  { value: "suite", label: "Suite", mod: 60 },
  { value: "family", label: "Family", mod: 40 },
  { value: "presidential", label: "Presidential", mod: 120 },
];

const CHILD_AGE_RANGES: Array<{ value: string; label: string; mod: number }> = [
  { value: "", label: "Без детей", mod: 0 },
  { value: "0-5", label: "0-5 лет", mod: 10 },
  { value: "6-11", label: "6-11 лет", mod: 20 },
  { value: "12-17", label: "12-17 лет", mod: 25 },
  { value: "0-5,6-11", label: "0-5 и 6-11", mod: 30 },
  { value: "0-5,6-11,12-17", label: "Дети всех возрастов", mod: 55 },
];

const NIGHT_OPTIONS = [3, 5, 7, 10, 14, 21];

const PLACEMENT_OPTIONS = [
  { value: "1", label: "1 взрослый" },
  { value: "2", label: "2 взрослых" },
  { value: "2+1", label: "2 взрослых + 1 ребёнок" },
  { value: "2+2", label: "2 взрослых + 2 детей" },
  { value: "3", label: "3 взрослых" },
  { value: "4", label: "4 взрослых" },
];

interface GeneratedVariant {
  roomType: string; mealPlan: string; placement: string;
  childAge: string; nights?: number;
  adults: number; children: number;
  price: number;
}

// ==================== VARIANT GENERATOR ====================
type PricingRuleData = { name: string; type: string; paramKey: string; paramValue: string; modifier: string; value: number };

function applyRule(base: number, rule: PricingRuleData): number {
  switch (rule.modifier) {
    case "ADD": return base + rule.value;
    case "SUBTRACT": return base - rule.value;
    case "MULTIPLY": return Math.round(base * rule.value);
    case "FIXED": return rule.value;
    default: return base;
  }
}

function VariantGenerator({ basePrice, serviceType, pricingRules, onGenerated }: {
  basePrice: number; serviceType: string; pricingRules: PricingRuleData[];
  onGenerated: (variants: GeneratedVariant[]) => void;
}) {
  const [selectedRooms, setSelectedRooms] = useState<string[]>(["standard"]);
  const [selectedMeals, setSelectedMeals] = useState<string[]>(["BB"]);
  const [selectedPlacements, setSelectedPlacements] = useState<string[]>(["2"]);
  const [selectedChildAges, setSelectedChildAges] = useState<string[]>([""]);
  const [selectedNights, setSelectedNights] = useState<number[]>(serviceType === "TOUR" ? [7] : []);
  const [generated, setGenerated] = useState<GeneratedVariant[]>([]);

  const toggleItem = <T,>(arr: T[], val: T, setter: (v: T[]) => void) => {
    setter(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  // Calculate modifier: use custom pricing rules if set, otherwise use defaults
  const getMod = (type: string, paramValue: string, fallback: number): number => {
    const customRules = pricingRules.filter((r) => r.type === type && r.paramValue === paramValue);
    if (customRules.length > 0) {
      let price = 0;
      for (const rule of customRules) { price = applyRule(price, rule); }
      return price;
    }
    return fallback;
  };

  // Get guest count modifier (GUESTS pricing rule)
  const getGuestMod = (totalGuests: number): number => {
    const guestRules = pricingRules.filter((r) => r.type === "GUESTS");
    for (const rule of guestRules) {
      if (totalGuests >= parseInt(rule.paramValue)) {
        return applyRule(0, rule);
      }
    }
    return 0;
  };

  const generate = () => {
    const variants: GeneratedVariant[] = [];
    for (const room of selectedRooms) {
      const roomMod = getMod("ROOM_TYPE", room, ROOM_SIZES.find((r) => r.value === room)?.mod || 0);
      for (const meal of selectedMeals) {
        const mealMod = getMod("MEAL_PLAN", meal, MEAL_PLANS.find((m) => m.value === meal)?.mod || 0);
        for (const placement of selectedPlacements) {
          const parts = placement.split("+");
          const adults = parseInt(parts[0]);
          const childCount = parts.length > 1 ? parseInt(parts[1]) : 0;
          for (const childAge of selectedChildAges) {
            const ages = childAge ? childAge.split(",") : [""];
            for (const age of ages) {
              const ageItem = CHILD_AGE_RANGES.find((c) => c.value === age);
              const defaultChildMod = ((ageItem as { mod?: number })?.mod || 0);
              const childMod = childCount > 0 ? getMod("CHILD", age || "0", defaultChildMod) * Math.min(childCount, 2) : 0;
              if (serviceType === "TOUR" && selectedNights.length > 0) {
                for (const nights of selectedNights) {
                  const defaultNightMod = nights > 7 ? Math.round((nights - 7) * 15) : 0;
                  const nightMod = getMod("NIGHTS", String(nights), defaultNightMod);
                  let price = basePrice + roomMod + mealMod + childMod + nightMod;
                  price += getGuestMod(adults + childCount);
                  const seasonRules = pricingRules.filter((r) => r.type === "SEASON");
                  for (const rule of seasonRules) { price = applyRule(price, rule); }
                  variants.push({
                    roomType: room, mealPlan: meal, placement,
                    childAge: age || "нет", nights,
                    adults, children: childCount,
                    price: Math.max(0, Math.round(price)),
                  });
                }
              } else {
                let price = basePrice + roomMod + mealMod + childMod;
                price += getGuestMod(adults + childCount);
                const seasonRules = pricingRules.filter((r) => r.type === "SEASON");
                for (const rule of seasonRules) { price = applyRule(price, rule); }
                variants.push({
                  roomType: room, mealPlan: meal, placement,
                  childAge: age || "нет",
                  adults, children: childCount,
                  price: Math.max(0, Math.round(price)),
                });
              }
            }
          }
        }
      }
    }
    setGenerated(variants);
    onGenerated(variants);
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
        <h3 className="font-bold text-secondary mb-1">⚙️ Генератор вариантов цен</h3>
        <p className="text-sm text-gray-500">Выберите параметры — система автоматически создаст все комбинации с расчётом цен</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Room Types */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Типы номеров</label>
          <div className="space-y-1.5">
            {ROOM_SIZES.map((room) => (
              <label key={room.value} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                <input type="checkbox" checked={selectedRooms.includes(room.value)}
                  onChange={() => toggleItem(selectedRooms, room.value, setSelectedRooms)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary" />
                <span className="flex-1">{room.label}</span>
                <span className="text-xs text-gray-400">{room.mod >= 0 ? "+" : ""}{room.mod}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Meal Plans */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Питание</label>
          <div className="space-y-1.5">
            {MEAL_PLANS.map((meal) => (
              <label key={meal.value} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                <input type="checkbox" checked={selectedMeals.includes(meal.value)}
                  onChange={() => toggleItem(selectedMeals, meal.value, setSelectedMeals)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary" />
                <span className="flex-1">{meal.label}</span>
                <span className="text-xs text-gray-400">{meal.mod > 0 ? `+${meal.mod}` : "—"}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Placements */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Размещение</label>
          <div className="space-y-1.5">
            {PLACEMENT_OPTIONS.map((p) => (
              <label key={p.value} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                <input type="checkbox" checked={selectedPlacements.includes(p.value)}
                  onChange={() => toggleItem(selectedPlacements, p.value, setSelectedPlacements)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary" />
                <span>{p.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Child Ages */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Возраст детей</label>
          <div className="space-y-1.5">
            {CHILD_AGE_RANGES.map((c) => (
              <label key={c.value} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                <input type="checkbox" checked={selectedChildAges.includes(c.value)}
                  onChange={() => toggleItem(selectedChildAges, c.value, setSelectedChildAges)}
                  className="w-4 h-4 rounded text-primary focus:ring-primary" />
                <span className="flex-1">{c.label}</span>
                {c.mod > 0 && <span className="text-xs text-gray-400">+{c.mod}</span>}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Nights (for tours only) */}
      {serviceType === "TOUR" && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Количество ночей</label>
          <div className="flex flex-wrap gap-2">
            {NIGHT_OPTIONS.map((n) => (
              <button key={n} onClick={() => toggleItem(selectedNights, n, setSelectedNights)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedNights.includes(n) ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                {n} ночей
              </button>
            ))}
          </div>
        </div>
      )}

      <button onClick={generate}
        className="w-full h-12 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold transition-all hover:shadow-lg active:scale-[0.98]">
        ⚡ Создать варианты ({selectedRooms.length} × {selectedMeals.length} × {selectedPlacements.length} × {selectedChildAges.length}
        {serviceType === "TOUR" ? ` × ${selectedNights.length || 0}` : ""} ={" "}
        {selectedRooms.length * selectedMeals.length * selectedPlacements.length * selectedChildAges.length * (serviceType === "TOUR" ? (selectedNights.length || 1) : 1)})
      </button>

      {generated.length > 0 && (
        <div className="p-4 bg-green-50 rounded-2xl border border-green-200">
          <p className="text-green-700 font-semibold">✅ Сгенерировано {generated.length} вариантов цен</p>
          <p className="text-sm text-green-600 mt-1">Цены рассчитаны на основе базовой цены {basePrice} AZN + модификаторы</p>
        </div>
      )}
    </div>
  );
}

// ==================== BULK EDITOR (SPREADSHEET) ====================
function BulkEditor({ variants, onChange }: {
  variants: GeneratedVariant[]; onChange: (v: GeneratedVariant[]) => void;
}) {
  const updatePrice = (index: number, price: number) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], price };
    onChange(updated);
  };

  if (variants.length === 0) return (
    <div className="text-center py-12 text-gray-400">
      <p className="text-4xl mb-3">📋</p>
      <p>Сначала сгенерируйте варианты</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-secondary">📋 Массовый редактор цен</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-2 font-semibold text-gray-500 text-xs uppercase">N</th>
              <th className="text-left p-2 font-semibold text-gray-500 text-xs uppercase">Номер</th>
              <th className="text-left p-2 font-semibold text-gray-500 text-xs uppercase">Питание</th>
              <th className="text-left p-2 font-semibold text-gray-500 text-xs uppercase">Размещение</th>
              <th className="text-left p-2 font-semibold text-gray-500 text-xs uppercase">Дети</th>
              <th className="text-left p-2 font-semibold text-gray-500 text-xs uppercase">Ночей</th>
              <th className="text-right p-2 font-semibold text-gray-500 text-xs uppercase">Цена AZN</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {variants.map((v, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="p-2 text-gray-400">{i + 1}</td>
                <td className="p-2 font-medium">{v.roomType}</td>
                <td className="p-2">{v.mealPlan}</td>
                <td className="p-2">{v.placement}</td>
                <td className="p-2 text-gray-500">{v.childAge}</td>
                <td className="p-2 text-gray-500">{v.nights || "—"}</td>
                <td className="p-2">
                  <input type="number" value={v.price}
                    onChange={(e) => updatePrice(i, parseFloat(e.target.value) || 0)}
                    className="w-24 text-right px-2 py-1 rounded-lg border border-gray-200 focus:border-primary focus:ring-0 text-sm font-bold text-primary" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==================== CSV IMPORTER ====================
function CsvImporter({ serviceId, onImported }: { serviceId: string; onImported: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ total: number; valid: number; errors: Array<{ row: number; field: string; message: string }> } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/services/${serviceId}/import`, {
        method: "POST", body: formData,
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setResult(data.result);
      if (data.imported) onImported();
    } catch {
      setResult({ total: 0, valid: 0, errors: [{ row: 0, field: "file", message: "Ошибка загрузки файла" }] });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = (type: string) => {
    window.open(`/api/services/template?type=${type}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
        <h3 className="font-bold text-secondary mb-1">📥 Импорт из Excel/CSV</h3>
        <p className="text-sm text-gray-500">Скачайте шаблон, заполните его и загрузите обратно</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={() => downloadTemplate("hotel")}
          className="h-10 px-5 bg-blue-100 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-200 transition-all">
          📥 Скачать шаблон: Отели
        </button>
        <button onClick={() => downloadTemplate("tour")}
          className="h-10 px-5 bg-green-100 text-green-700 rounded-xl text-sm font-medium hover:bg-green-200 transition-all">
          📥 Скачать шаблон: Туры
        </button>
      </div>

      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-primary transition-colors">
        <input ref={fileRef} type="file" accept=".csv,.tsv,.xlsx" className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <p className="text-4xl mb-3">📄</p>
        {file ? (
          <div>
            <p className="font-semibold text-secondary">{file.name}</p>
            <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
            <button onClick={handleImport} disabled={uploading}
              className="mt-4 h-11 px-8 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-all disabled:opacity-50">
              {uploading ? "⏳ Загрузка..." : "📤 Импортировать"}
            </button>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()}
            className="text-primary font-medium hover:underline">
            Нажмите чтобы выбрать файл CSV
          </button>
        )}
      </div>

      {result && (
        <div className={`p-4 rounded-2xl ${result.errors.length > 0 ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
          <p className="font-bold text-secondary">Результат импорта</p>
          <p className="text-sm">Всего строк: {result.total}, Валидных: {result.valid}</p>
          {result.errors.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-sm font-semibold text-red-600">Ошибки ({result.errors.length}):</p>
              {result.errors.slice(0, 10).map((e, i) => (
                <p key={i} className="text-xs text-red-500">Строка {e.row}: {e.field} — {e.message}</p>
              ))}
              {result.errors.length > 10 && <p className="text-xs text-gray-400">...и ещё {result.errors.length - 10} ошибок</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==================== PRICING RULES EDITOR ====================
function PricingRulesEditor({ rules, onChange }: {
  rules: Array<{ name: string; type: string; paramKey: string; paramValue: string; modifier: string; value: number }>;
  onChange: (r: Array<{ name: string; type: string; paramKey: string; paramValue: string; modifier: string; value: number }>) => void;
}) {
  const addRule = () => {
    onChange([...rules, { name: "", type: "MEAL_PLAN", paramKey: "mealPlan", paramValue: "HB", modifier: "ADD", value: 15 }]);
  };

  const updateRule = (index: number, field: string, value: string | number) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeRule = (index: number) => {
    onChange(rules.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
        <h3 className="font-bold text-secondary mb-1">🧮 Правила наследования цен</h3>
        <p className="text-sm text-gray-500">Задайте базовую цену + модификаторы. Система автоматически рассчитает цены для всех комбинаций</p>
      </div>

      <div className="space-y-3">
        {rules.map((rule, i) => (
          <div key={i} className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <select value={rule.type} onChange={(e) => updateRule(i, "type", e.target.value)}
              className="h-9 px-3 rounded-lg border border-gray-200 text-sm focus:ring-0">
              <option value="MEAL_PLAN">Питание</option>
              <option value="ROOM_TYPE">Тип номера</option>
              <option value="CHILD">Ребёнок</option>
              <option value="NIGHTS">Ночи</option>
              <option value="SEASON">Сезон</option>
              <option value="GUESTS">Количество гостей</option>
            </select>

            <input value={rule.paramValue} placeholder="Значение (HB, suite, 0-6)"
              onChange={(e) => updateRule(i, "paramValue", e.target.value)}
              className="h-9 px-3 rounded-lg border border-gray-200 text-sm w-36 focus:ring-0" />

            <select value={rule.modifier} onChange={(e) => updateRule(i, "modifier", e.target.value)}
              className="h-9 px-3 rounded-lg border border-gray-200 text-sm focus:ring-0">
              <option value="ADD">+ (сложение)</option>
              <option value="SUBTRACT">- (вычитание)</option>
              <option value="MULTIPLY">× (умножение)</option>
              <option value="FIXED">= (фикс. цена)</option>
            </select>

            <input type="number" value={rule.value} onChange={(e) => updateRule(i, "value", parseFloat(e.target.value) || 0)}
              className="h-9 w-24 px-3 rounded-lg border border-gray-200 text-sm focus:ring-0" />

            <button onClick={() => removeRule(i)} className="text-red-400 hover:text-red-600 p-1">🗑</button>
          </div>
        ))}
      </div>

      <button onClick={addRule}
        className="h-10 px-6 bg-purple-100 text-purple-700 rounded-xl text-sm font-medium hover:bg-purple-200 transition-all">
        + Добавить правило
      </button>
    </div>
  );
}

// ==================== MAIN PARTNER PAGE ====================
export default function PartnerServicesPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const router = useRouter();

  const [activeMethod, setActiveMethod] = useState<"manual" | "generator" | "csv" | "api">("manual");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [serviceType, setServiceType] = useState<"HOTEL" | "TOUR" | "SANATORIUM" | "EXCURSION">("HOTEL");
  const [tourCategory, setTourCategory] = useState<"ONE_DAY" | "MULTI_DAY">("ONE_DAY");
  const [basePrice, setBasePrice] = useState(100);

  // Multi-day tour fields
  const [hotelName, setHotelName] = useState("");
  const [hotelClass, setHotelClass] = useState(5);
  const [roomType, setRoomType] = useState("Standard");
  const [mealPlan, setMealPlan] = useState("BB");
  const [nights, setNights] = useState(7);
  const [depCity, setDepCity] = useState("");
  const [depCode, setDepCode] = useState("");
  const [depTime, setDepTime] = useState("08:00");
  const [arrCity, setArrCity] = useState("");
  const [arrCode, setArrCode] = useState("");
  const [arrTime, setArrTime] = useState("12:00");
  const [retDepTime, setRetDepTime] = useState("16:00");
  const [retArrTime, setRetArrTime] = useState("20:00");
  const [transferIncluded, setTransferIncluded] = useState(true);
  const [transferType, setTransferType] = useState("standard");

  // Manual form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [createdServiceId, setCreatedServiceId] = useState<string | null>(null);

  // Variant data
  const [generatedVariants, setGeneratedVariants] = useState<GeneratedVariant[]>([]);
  const [pricingRules, setPricingRules] = useState<Array<{ name: string; type: string; paramKey: string; paramValue: string; modifier: string; value: number }>>([]);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Create service via API
  const createService = async () => {
    if (!title || !description || !city || !country) {
      setMessage("❌ Заполните обязательные поля");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title, description, type: serviceType, price: basePrice, city, country, countryCode: "",
          tourCategory: serviceType === "TOUR" ? tourCategory : undefined,
          nights: serviceType === "TOUR" && tourCategory === "MULTI_DAY" ? nights : undefined,
          duration: serviceType === "TOUR" && tourCategory === "MULTI_DAY" ? `${nights + 1} дней / ${nights} ночей` : undefined,
          multiDay: serviceType === "TOUR" && tourCategory === "MULTI_DAY" ? {
            hotel: { hotelName, hotelClass, roomType, mealPlan },
            flight: { depCity, depCode, depTime, arrCity, arrCode, arrTime, retDepTime, retArrTime },
            transfer: { included: transferIncluded, type: transferType },
          } : undefined,
        }),
      });
      if (!res.ok) throw new Error("Ошибка создания");
      const data = await res.json();
      setCreatedServiceId(data.service.id);
      setMessage("✅ Услуга создана! Теперь добавьте варианты цен.");
    } catch {
      setMessage("❌ Ошибка создания услуги");
    } finally {
      setSaving(false);
    }
  };

  // Save variants
  const saveVariants = async () => {
    if (!createdServiceId || generatedVariants.length === 0) {
      setMessage("❌ Сначала создайте услугу и сгенерируйте варианты");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const today = new Date();
      const monthLater = new Date(today);
      monthLater.setMonth(monthLater.getMonth() + 3);

      const variants = generatedVariants.map((v) => ({
        dateFrom: today.toISOString(),
        dateTo: monthLater.toISOString(),
        roomType: v.roomType,
        mealPlan: v.mealPlan,
        guestsAdults: v.adults,
        guestsChildren: v.children,
        childAgeFrom: v.childAge !== "нет" ? parseInt(v.childAge.split("-")[0]) : null,
        childAgeTo: v.childAge !== "нет" ? parseInt(v.childAge.split("-")[1] || v.childAge.split("-")[0]) : null,
        nights: v.nights || null,
        pricePerPerson: v.price,
        availableSlots: 10,
      }));

      const res = await fetch(`/api/services/${createdServiceId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ variants }),
      });
      if (!res.ok) throw new Error("Ошибка сохранения");
      const data = await res.json();
      setMessage(`✅ Сохранено ${data.count} вариантов цен!`);
    } catch {
      setMessage("❌ Ошибка сохранения вариантов");
    } finally {
      setSaving(false);
    }
  };

  // Sidebar
  const sidebarItems = [
    { icon: "📊", label: "Панель управления", id: "dashboard" },
    { icon: "📦", label: "Мои услуги", id: "services" },
    { icon: "➕", label: "Добавить услугу", id: "add-service" },
    { icon: "🛒", label: "Заказы", id: "orders", badge: 12 },
    { icon: "💰", label: "Финансы", id: "finance" },
  ];

  const methods = [
    { id: "manual" as const, icon: "✏️", label: "Ручное создание", desc: "Для небольших партнёров — гиды, фотографы, малые гостиницы", color: "bg-blue-50 border-blue-200 text-blue-700" },
    { id: "generator" as const, icon: "⚡", label: "Генератор вариантов", desc: "Автоматическое создание комбинаций — отели, туры", color: "bg-purple-50 border-purple-200 text-purple-700" },
    { id: "csv" as const, icon: "📥", label: "Импорт Excel", desc: "Скачайте шаблон, заполните, загрузите", color: "bg-green-50 border-green-200 text-green-700" },
    { id: "api" as const, icon: "🔌", label: "API", desc: "Для крупных партнёров — Hilton, Hyatt, Marriott", color: "bg-amber-50 border-amber-200 text-amber-700" },
  ];

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl">🤝</div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-secondary">Кабинет партнёра</h1>
              <p className="text-gray-500">Управление услугами и ценами</p>
            </div>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-2xl text-sm font-medium ${message.startsWith("✅") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sticky top-24">
              <nav className="space-y-1">
                {sidebarItems.map((item) => (
                  <button key={item.id} onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === item.id ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-50"}`}>
                    <span className="text-lg">{item.icon}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className="w-5 h-5 bg-danger text-white text-[10px] rounded-full flex items-center justify-center font-bold">{item.badge}</span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Dashboard Tab */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[{ icon: "📦", label: "Услуг", value: "12" }, { icon: "💰", label: "Доход", value: "45K AZN" }, { icon: "⭐", label: "Рейтинг", value: "4.8" }].map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100">
                      <span className="text-lg">{s.icon}</span>
                      <div className="text-2xl font-bold text-secondary mt-2">{s.value}</div>
                      <div className="text-xs text-gray-500">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Service Tab */}
            {activeTab === "add-service" && (
              <div className="space-y-8">
                {/* Step 1: Choose method */}
                <div>
                  <h2 className="text-xl font-bold text-secondary mb-4">Выберите способ добавления</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {methods.map((m) => (
                      <button key={m.id} onClick={() => setActiveMethod(m.id)}
                        className={`p-5 rounded-2xl border-2 text-left transition-all ${activeMethod === m.id ? `${m.color} border-current shadow-md` : "bg-white border-gray-100 hover:border-gray-300"}`}>
                        <span className="text-2xl">{m.icon}</span>
                        <h3 className="font-bold mt-2">{m.label}</h3>
                        <p className="text-sm opacity-70 mt-1">{m.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2: Service type & basic info */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                  <h3 className="font-bold text-secondary">📝 Основная информация</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Тип услуги</label>
                      <select value={serviceType} onChange={(e) => setServiceType(e.target.value as typeof serviceType)}
                        className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-0 text-sm">
                        <option value="HOTEL">🏨 Отель</option>
                        <option value="TOUR">🏖 Тур</option>
                        <option value="SANATORIUM">🏥 Санаторий</option>
                        <option value="EXCURSION">🏛 Экскурсия</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Базовая цена (AZN)</label>
                      <input type="number" value={basePrice} onChange={(e) => setBasePrice(parseInt(e.target.value) || 0)}
                        className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-0 text-sm" />
                    </div>
                  </div>

                  {/* Tour category selector — only for TOUR type */}
                  {serviceType === "TOUR" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Категория тура</label>
                        <div className="flex gap-3">
                          <button type="button" onClick={() => setTourCategory("ONE_DAY")}
                            className={`flex-1 h-11 rounded-xl border-2 text-sm font-medium transition-all ${tourCategory === "ONE_DAY" ? "border-primary bg-primary/10 text-primary" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                            ☀️ Однодневный
                          </button>
                          <button type="button" onClick={() => setTourCategory("MULTI_DAY")}
                            className={`flex-1 h-11 rounded-xl border-2 text-sm font-medium transition-all ${tourCategory === "MULTI_DAY" ? "border-primary bg-primary/10 text-primary" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                            🗓 Многодневный
                          </button>
                        </div>
                      </div>
                      {tourCategory === "MULTI_DAY" && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Количество ночей</label>
                          <select value={nights} onChange={(e) => setNights(parseInt(e.target.value))}
                            className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-0 text-sm">
                            {[3,5,7,10,14,21].map(n => <option key={n} value={n}>{n} ночей ({n+1} дней)</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название услуги"
                    className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-0 text-sm" />
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание" rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-0 text-sm resize-none" />
                  <div className="grid grid-cols-2 gap-4">
                    <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Город"
                      className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-0 text-sm" />
                    <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Страна"
                      className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-0 text-sm" />
                  </div>
                  {/* Multi-day tour: hotel + flight + transfer fields */}
                  {serviceType === "TOUR" && tourCategory === "MULTI_DAY" && (
                    <div className="space-y-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <h4 className="font-bold text-secondary">🏨 Информация об отеле</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <input value={hotelName} onChange={(e) => setHotelName(e.target.value)} placeholder="Название отеля"
                          className="h-10 px-3 rounded-xl border-2 border-gray-200 text-sm focus:border-primary focus:ring-0" />
                        <select value={hotelClass} onChange={(e) => setHotelClass(parseInt(e.target.value))}
                          className="h-10 px-3 rounded-xl border-2 border-gray-200 text-sm focus:border-primary focus:ring-0">
                          <option value={3}>3★</option><option value={4}>4★</option><option value={5}>5★</option>
                        </select>
                        <select value={roomType} onChange={(e) => setRoomType(e.target.value)}
                          className="h-10 px-3 rounded-xl border-2 border-gray-200 text-sm focus:border-primary focus:ring-0">
                          <option>Standard</option><option>Superior</option><option>Deluxe</option><option>Suite</option><option>Family</option>
                        </select>
                        <select value={mealPlan} onChange={(e) => setMealPlan(e.target.value)}
                          className="h-10 px-3 rounded-xl border-2 border-gray-200 text-sm focus:border-primary focus:ring-0">
                          {MEAL_PLANS.map(m => <option key={m.value} value={m.value}>{m.value}</option>)}
                        </select>
                      </div>

                      <h4 className="font-bold text-secondary mt-4">✈️ Перелёт</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <input value={depCity} onChange={(e) => setDepCity(e.target.value)} placeholder="Город вылета"
                          className="h-10 px-3 rounded-xl border-2 border-gray-200 text-sm focus:border-primary focus:ring-0" />
                        <input value={depCode} onChange={(e) => setDepCode(e.target.value)} placeholder="IATA (GYD)" maxLength={3}
                          className="h-10 px-3 rounded-xl border-2 border-gray-200 text-sm focus:border-primary focus:ring-0 uppercase" />
                        <input type="time" value={depTime} onChange={(e) => setDepTime(e.target.value)}
                          className="h-10 px-3 rounded-xl border-2 border-gray-200 text-sm focus:border-primary focus:ring-0" />
                        <input type="time" value={arrTime} onChange={(e) => setArrTime(e.target.value)}
                          className="h-10 px-3 rounded-xl border-2 border-gray-200 text-sm focus:border-primary focus:ring-0" />
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <input value={arrCity} onChange={(e) => setArrCity(e.target.value)} placeholder="Город прилёта"
                          className="h-10 px-3 rounded-xl border-2 border-gray-200 text-sm focus:border-primary focus:ring-0" />
                        <input value={arrCode} onChange={(e) => setArrCode(e.target.value)} placeholder="IATA (AYT)" maxLength={3}
                          className="h-10 px-3 rounded-xl border-2 border-gray-200 text-sm focus:border-primary focus:ring-0 uppercase" />
                        <input type="time" value={retDepTime} onChange={(e) => setRetDepTime(e.target.value)}
                          className="h-10 px-3 rounded-xl border-2 border-gray-200 text-sm focus:border-primary focus:ring-0" placeholder="Обратный вылет" />
                        <input type="time" value={retArrTime} onChange={(e) => setRetArrTime(e.target.value)}
                          className="h-10 px-3 rounded-xl border-2 border-gray-200 text-sm focus:border-primary focus:ring-0" placeholder="Обратный прилёт" />
                      </div>

                      <h4 className="font-bold text-secondary mt-4">🚐 Трансфер</h4>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={transferIncluded} onChange={(e) => setTransferIncluded(e.target.checked)}
                            className="w-4 h-4 rounded text-primary" />
                          Трансфер включён
                        </label>
                        {transferIncluded && (
                          <select value={transferType} onChange={(e) => setTransferType(e.target.value)}
                            className="h-9 px-3 rounded-lg border border-gray-200 text-sm">
                            <option value="standard">Standard</option>
                            <option value="vip">VIP</option>
                            <option value="private">Private</option>
                          </select>
                        )}
                      </div>
                    </div>
                  )}

                  {!createdServiceId && (
                    <button onClick={createService} disabled={saving}
                      className="h-12 px-8 bg-secondary text-white rounded-2xl font-bold hover:bg-secondary/90 transition-all disabled:opacity-50">
                      {saving ? "⏳ Создание..." : "📦 Создать услугу"}
                    </button>
                  )}
                  {createdServiceId && (
                    <div className="p-3 bg-green-50 rounded-xl text-green-700 text-sm font-medium">✅ Услуга создана (ID: {createdServiceId.slice(0, 12)}...)</div>
                  )}
                </div>

                {/* Method-specific content */}
                {activeMethod === "manual" && createdServiceId && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
                    <h3 className="font-bold text-secondary">✏️ Ручное добавление цен</h3>
                    <div className="text-center py-8 text-gray-400">
                      <p className="text-4xl mb-3">🔧</p>
                      <p>Интерфейс ручного добавления цен — в разработке</p>
                      <p className="text-sm mt-2">Используйте «Генератор вариантов» для быстрого создания</p>
                    </div>
                  </div>
                )}

                {activeMethod === "generator" && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
                    <PricingRulesEditor rules={pricingRules} onChange={setPricingRules} />
                    <VariantGenerator basePrice={basePrice} serviceType={serviceType}
                      pricingRules={pricingRules} onGenerated={setGeneratedVariants} />
                    <BulkEditor variants={generatedVariants} onChange={setGeneratedVariants} />
                    {generatedVariants.length > 0 && createdServiceId && (
                      <button onClick={saveVariants} disabled={saving}
                        className="w-full h-14 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold text-lg transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50">
                        {saving ? "⏳ Сохранение..." : `💾 Сохранить ${generatedVariants.length} вариантов`}
                      </button>
                    )}
                  </div>
                )}

                {activeMethod === "csv" && createdServiceId && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <CsvImporter serviceId={createdServiceId} onImported={() => setMessage("✅ Данные импортированы!")} />
                  </div>
                )}

                {activeMethod === "api" && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                    <h3 className="font-bold text-secondary">🔌 API для крупных партнёров</h3>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-600 mb-2">Доступные эндпоинты:</p>
                      <code className="text-xs bg-gray-800 text-green-400 p-3 rounded-lg block whitespace-pre">
{`POST   /api/services                  — создать услугу
POST   /api/services/{id}/variants    — добавить варианты цен (массово)
GET    /api/services/{id}/variants    — получить варианты цен
POST   /api/services/{id}/import      — импорт из CSV
GET    /api/services/{id}/export      — экспорт в CSV
POST   /api/services/{id}/pricing-rules — правила ценообразования`}
                      </code>
                    </div>
                    <p className="text-sm text-gray-500">
                      Для интеграции обратитесь к <a href="/partner" className="text-primary hover:underline">технической документации</a> или свяжитесь с нами.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
