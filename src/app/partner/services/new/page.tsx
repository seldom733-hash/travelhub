"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useRouter } from "next/navigation";

interface FormData {
  // Step 1: Basic info
  title: string;
  description: string;
  type: string;
  city: string;
  country: string;
  countryCode: string;
  price: number;
  currency: string;
  duration: string;
  maxGuests: number;
  languages: string[];
  // Step 2: Tour-specific
  tourCategory: string;
  // Step 3: Amenities
  amenities: string[];
  // Step 4: Pricing variants
  // Step 5: Images
  images: string[];
}

const SERVICE_TYPES = [
  { value: "TOUR", label: "🏖 Туры", icon: "🏖" },
  { value: "HOTEL", label: "🏨 Отели", icon: "🏨" },
  { value: "SANATORIUM", label: "🏥 Санатории", icon: "🏥" },
  { value: "EXCURSION", label: "🏛 Экскурсии", icon: "🏛" },
  { value: "GUIDE", label: "🧭 Гиды", icon: "🧭" },
  { value: "PHOTOGRAPHER", label: "📷 Фотографы", icon: "📷" },
  { value: "TRANSFER", label: "🚐 Трансферы", icon: "🚐" },
];

const AMENITY_SUGGESTIONS = [
  "Бассейн", "Спа", "Wi-Fi", "Парковка", "Завтрак", "Ресторан",
  "Бар", "Фитнес", "Кондиционер", "Детская площадка", "Аквапарк",
  "Мини-бар", "Сейф", "Телевизор", "Халаты", "Тапочки",
];

const LANGUAGES = ["Русский", "Английский", "Азербайджанский", "Турецкий", "Арабский", "Немецкий", "Французский"];

const STEPS = [
  { id: 1, label: "Основная информация", icon: "📝" },
  { id: 2, label: "Детали", icon: "⚙️" },
  { id: 3, label: "Удобства", icon: "✅" },
  { id: 4, label: "Фотографии", icon: "📷" },
  { id: 5, label: "Обзор", icon: "👁" },
];

export default function PartnerServiceNewPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState<FormData>({
    title: "",
    description: "",
    type: "TOUR",
    city: "",
    country: "",
    countryCode: "",
    price: 0,
    currency: "AZN",
    duration: "",
    maxGuests: 10,
    languages: [],
    tourCategory: "ONE_DAY",
    amenities: [],
    images: [],
  });

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key: "amenities" | "languages", item: string) => {
    setForm((prev) => {
      const arr = prev[key] as string[];
      return {
        ...prev,
        [key]: arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item],
      };
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          type: form.type,
          price: form.price,
          city: form.city,
          country: form.country,
          countryCode: form.countryCode,
          images: form.images.join(","),
          amenities: form.amenities,
          languages: form.languages.join(","),
          duration: form.duration || undefined,
          maxGuests: form.maxGuests || undefined,
          tourCategory: form.type === "TOUR" ? form.tourCategory : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка создания услуги");

      setSuccess(true);
      setTimeout(() => {
        router.push("/partner");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка создания услуги");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 text-center">
        <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">✅</div>
        <h3 className="text-xl font-bold text-secondary mb-2">Услуга успешно создана!</h3>
        <p className="text-gray-500">Ваша услуга отправлена на модерацию</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-secondary">Новая услуга</h1>
            <p className="text-gray-500 text-sm mt-1">Заполните информацию о вашей услуге</p>
          </div>
          <button onClick={() => router.push("/partner")} className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
            ✕
          </button>
        </div>

        {/* Step Progress */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => s.id < step && setStep(s.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  step === s.id
                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                    : step > s.id
                      ? "bg-success/10 text-success"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                <span>{step > s.id ? "✓" : s.icon}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && <div className={`w-6 h-0.5 ${step > s.id ? "bg-success" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger">❌ {error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
                <h2 className="text-lg font-bold text-secondary">📝 Основная информация</h2>

                {/* Service Type */}
                <div>
                  <label className="block text-sm font-semibold text-secondary mb-3">Тип услуги *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {SERVICE_TYPES.map((st) => (
                      <button
                        key={st.value}
                        onClick={() => updateField("type", st.value)}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          form.type === st.value
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <span className="text-2xl block mb-1">{st.icon}</span>
                        <span className="text-xs font-medium text-secondary">{st.label.split(" ")[1]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">Название услуги *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50"
                    placeholder="Например: Отдых в Анталье All Inclusive"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">Описание *</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50 resize-none"
                    placeholder="Подробное описание услуги..."
                  />
                </div>

                {/* Location */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-2">Страна *</label>
                    <input
                      type="text"
                      value={form.country}
                      onChange={(e) => updateField("country", e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50"
                      placeholder="Турция"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-2">Город *</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50"
                      placeholder="Анталья"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-2">Код страны</label>
                    <input
                      type="text"
                      value={form.countryCode}
                      onChange={(e) => updateField("countryCode", e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50"
                      placeholder="TR"
                    />
                  </div>
                </div>

                {/* Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-2">Цена (AZN) *</label>
                    <input
                      type="number"
                      value={form.price || ""}
                      onChange={(e) => updateField("price", Number(e.target.value))}
                      className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50"
                      placeholder="1300"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-2">Длительность</label>
                    <input
                      type="text"
                      value={form.duration}
                      onChange={(e) => updateField("duration", e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50"
                      placeholder="7 ночей / 3 часа"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!form.title || !form.description || !form.city || !form.country || form.price <= 0}
                  className="w-full h-12 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all hover:shadow-lg disabled:opacity-50"
                >
                  Далее →
                </button>
              </div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
                <h2 className="text-lg font-bold text-secondary">⚙️ Детали</h2>

                {/* Tour Category */}
                {form.type === "TOUR" && (
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-3">Категория тура</label>
                    <div className="flex gap-3">
                      {[
                        { value: "ONE_DAY", label: "☀️ Однодневный", desc: "Экскурсии, прогулки, активный отдых" },
                        { value: "MULTI_DAY", label: "🗓 Многодневный", desc: "С проживанием, перелётом, трансфером" },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => updateField("tourCategory", opt.value)}
                          className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
                            form.tourCategory === opt.value ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <p className="font-semibold text-secondary">{opt.label}</p>
                          <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Max Guests */}
                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">Макс. количество гостей</label>
                  <input
                    type="number"
                    value={form.maxGuests}
                    onChange={(e) => updateField("maxGuests", Number(e.target.value))}
                    className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50"
                    min={1}
                    max={100}
                  />
                </div>

                {/* Languages */}
                <div>
                  <label className="block text-sm font-semibold text-secondary mb-3">Языки</label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => toggleArrayItem("languages", lang)}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                          form.languages.includes(lang)
                            ? "bg-primary text-white border-primary"
                            : "bg-white text-gray-600 border-gray-200 hover:border-primary"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 h-12 border-2 border-gray-200 text-secondary rounded-xl font-semibold hover:bg-gray-50 transition-all">
                    ← Назад
                  </button>
                  <button onClick={() => setStep(3)} className="flex-1 h-12 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all hover:shadow-lg">
                    Далее →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Amenities */}
            {step === 3 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
                <h2 className="text-lg font-bold text-secondary">✅ Удобства и amenities</h2>

                <div>
                  <label className="block text-sm font-semibold text-secondary mb-3">Выберите удобства</label>
                  <div className="flex flex-wrap gap-2">
                    {AMENITY_SUGGESTIONS.map((amenity) => (
                      <button
                        key={amenity}
                        onClick={() => toggleArrayItem("amenities", amenity)}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                          form.amenities.includes(amenity)
                            ? "bg-accent text-white border-accent"
                            : "bg-white text-gray-600 border-gray-200 hover:border-accent"
                        }`}
                      >
                        {form.amenities.includes(amenity) ? "✓ " : ""}{amenity}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom amenity */}
                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">Добавить своё удобство</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="customAmenity"
                      className="flex-1 h-10 px-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50"
                      placeholder="Введите название"
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById("customAmenity") as HTMLInputElement;
                        if (input?.value.trim()) {
                          toggleArrayItem("amenities", input.value.trim());
                          input.value = "";
                        }
                      }}
                      className="h-10 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors"
                    >
                      + Добавить
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="flex-1 h-12 border-2 border-gray-200 text-secondary rounded-xl font-semibold hover:bg-gray-50 transition-all">
                    ← Назад
                  </button>
                  <button onClick={() => setStep(4)} className="flex-1 h-12 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all hover:shadow-lg">
                    Далее →
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Images */}
            {step === 4 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
                <h2 className="text-lg font-bold text-secondary">📷 Фотографии</h2>

                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">URL изображений</label>
                  <p className="text-xs text-gray-500 mb-3">Вставьте ссылки на фотографии (через запятую или по одной)</p>
                  <textarea
                    value={form.images.join("\n")}
                    onChange={(e) => updateField("images", e.target.value.split("\n").filter(Boolean))}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50 resize-none"
                    placeholder={"https://example.com/photo1.jpg\nhttps://example.com/photo2.jpg"}
                  />
                  {form.images.length > 0 && (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {form.images.map((img, i) => (
                        <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                          <img src={img} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100&q=60"; }} />
                          <button
                            onClick={() => updateField("images", form.images.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 w-5 h-5 bg-danger text-white rounded-full text-xs flex items-center justify-center"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(3)} className="flex-1 h-12 border-2 border-gray-200 text-secondary rounded-xl font-semibold hover:bg-gray-50 transition-all">
                    ← Назад
                  </button>
                  <button onClick={() => setStep(5)} className="flex-1 h-12 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all hover:shadow-lg">
                    Обзор →
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {step === 5 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
                <h2 className="text-lg font-bold text-secondary">👁 Обзор услуги</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-gray-500 mb-1">Тип</p>
                    <p className="font-semibold text-secondary">{SERVICE_TYPES.find((s) => s.value === form.type)?.label}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-gray-500 mb-1">Цена</p>
                    <p className="font-semibold text-primary text-lg">{form.price} AZN</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-gray-500 mb-1">Локация</p>
                    <p className="font-semibold text-secondary">{form.city}, {form.country}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-gray-500 mb-1">Длительность</p>
                    <p className="font-semibold text-secondary">{form.duration || "—"}</p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-gray-500 mb-1">Название</p>
                  <p className="font-semibold text-secondary">{form.title}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-gray-500 mb-1">Описание</p>
                  <p className="text-secondary text-sm">{form.description}</p>
                </div>

                {form.amenities.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-gray-500 mb-2">Удобства</p>
                    <div className="flex flex-wrap gap-1">
                      {form.amenities.map((a) => (
                        <span key={a} className="px-3 py-1 bg-accent/10 text-accent text-xs rounded-full">{a}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setStep(4)} className="flex-1 h-12 border-2 border-gray-200 text-secondary rounded-xl font-semibold hover:bg-gray-50 transition-all">
                    ← Назад
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 h-12 bg-success hover:bg-success/90 text-white rounded-xl font-bold transition-all hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Создание...
                      </>
                    ) : (
                      "✓ Создать услугу"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Preview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
              <h3 className="font-bold text-secondary text-sm mb-4">Предварительный просмотр</h3>
              <div className="rounded-xl overflow-hidden border border-gray-100">
                <div className="h-32 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-4xl">
                  {SERVICE_TYPES.find((s) => s.value === form.type)?.icon || "📦"}
                </div>
                <div className="p-3">
                  <p className="font-semibold text-secondary text-sm truncate">{form.title || "Название услуги"}</p>
                  <p className="text-xs text-gray-500 mt-1">📍 {form.city || "Город"}, {form.country || "Страна"}</p>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                    <span className="font-bold text-primary">{form.price > 0 ? `${form.price} AZN` : "Цена"}</span>
                    <span className="text-xs text-primary font-medium">Подробнее →</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
