"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n-context";
import { useFetch } from "@/lib/useFetch";

const searchTypeKeys = [
  { icon: "🏖", key: "tour" },
  { icon: "🏨", key: "hotel" },
  { icon: "🏛", key: "excursion" },
  { icon: "🧭", key: "guide" },
  { icon: "📷", key: "photographer" },
  { icon: "🚐", key: "transfer" },
  { icon: "✈", key: "flight" },
  { icon: "🚄", key: "train" },
];

interface Suggestion {
  id: string;
  title: string;
  type: string;
  city: string;
  country: string;
  price: number;
  rating: number;
  image: string | null;
  providerName?: string;
}

interface SearchResponse {
  suggestions: Suggestion[];
}

const typeIcons: Record<string, string> = {
  TOUR: "🏖", HOTEL: "🏨", EXCURSION: "🏛", GUIDE: "🧭",
  PHOTOGRAPHER: "📷", TRANSFER: "🚐", FLIGHT: "✈", TRAIN: "🚄", SANATORIUM: "🏥",
};

const typeToPath: Record<string, string> = {
  tour: "/tours",
  hotel: "/hotels",
  excursion: "/excursions",
  guide: "/guides",
  photographer: "/photographers",
  transfer: "/transfers",
  flight: "/flights",
  train: "/trains",
  sanatorium: "/sanatoriums",
};

export default function Search() {
  const router = useRouter();
  const { t } = useI18n();
  const [selectedType, setSelectedType] = useState("tour");
  const [destination, setDestination] = useState("");
  const [tourists, setTourists] = useState(2);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const searchUrl = destination.length >= 2
    ? `/api/search?q=${encodeURIComponent(destination)}&type=${encodeURIComponent(selectedType.toUpperCase())}`
    : null;

  const { data } = useFetch<SearchResponse>(searchUrl, {
    debounceMs: 300,
  });

  const suggestions = data?.suggestions ?? [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDestinationChange = (value: string) => {
    setDestination(value);
    if (value.length >= 2) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setDestination(`${suggestion.title}, ${suggestion.city}`);
    setShowSuggestions(false);
    const sType = suggestion.type.toLowerCase();
    const catalogPath = typeToPath[sType] || "/services";
    router.push(`${catalogPath}/${suggestion.id}`);
  };

  const touristText = tourists === 1 ? "tourist" : tourists < 5 ? "tourists" : "tourists";

  return (
    <section id="search" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-secondary mb-3">
            {t("search.title")}
          </h2>
          <p className="text-gray-500 text-lg">
            {t("search.subtitle")}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 max-w-5xl mx-auto border border-gray-100">
          {/* Type Selector */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            <span className="text-sm font-medium text-gray-500 shrink-0 mr-2">
              {t("search.whatLooking")}
            </span>
            {searchTypeKeys.map((type) => (
              <button
                key={type.key}
                onClick={() => setSelectedType(type.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  selectedType === type.key
                    ? "bg-primary text-white shadow-md shadow-primary/30"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span>{type.icon}</span>
                <span>{t(`search.types.${type.key}`)}</span>
              </button>
            ))}
          </div>

          {/* Search Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2 relative" ref={suggestionsRef}>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {t("search.destination")}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">📍</span>
                <input
                  type="text"
                  placeholder={t("search.destinationPlaceholder")}
                  value={destination}
                  onChange={(e) => handleDestinationChange(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-0 outline-none transition-colors text-sm bg-gray-50"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 max-h-80 overflow-y-auto">
                    {suggestions.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSuggestionClick(s)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <img src={s.image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100&q=80"} alt={s.title} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-secondary text-sm truncate">{s.title}</p>
                          <p className="text-xs text-gray-500">{typeIcons[s.type] || "📦"} {s.city}, {s.country}</p>
                          {s.providerName && <p className="text-xs text-gray-400">🏢 {s.providerName}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-primary">{s.price} AZN</p>
                          <p className="text-xs text-gray-400">⭐ {s.rating}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {t("search.checkIn")}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">📅</span>
                <input type="date" className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-0 outline-none transition-colors text-sm bg-gray-50" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {t("search.checkOut")}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">📅</span>
                <input type="date" className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-0 outline-none transition-colors text-sm bg-gray-50" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {t("search.tourists")}
              </label>
              <div className="flex items-center gap-3 h-12 px-4 rounded-xl border-2 border-gray-200 bg-gray-50">
                <button
                  onClick={() => setTourists(Math.max(1, tourists - 1))}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm font-bold transition-colors"
                >
                  −
                </button>
                <span className="flex-1 text-center text-sm font-semibold text-secondary">
                  {tourists} {touristText}
                </span>
                <button
                  onClick={() => setTourists(Math.min(20, tourists + 1))}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm font-bold transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {t("search.price")}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">💰</span>
                <input
                  type="text"
                  placeholder={t("search.pricePlaceholder")}
                  className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-0 outline-none transition-colors text-sm bg-gray-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {t("search.rating")}
              </label>
              <div className="flex items-center gap-2 h-12 px-4 rounded-xl border-2 border-gray-200 bg-gray-50">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} className="text-xl hover:scale-125 transition-transform">★</button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={() => {
                const catalogPath = typeToPath[selectedType] || "/services";
                const params = new URLSearchParams();
                if (destination) params.set("destination", destination);
                if (tourists > 1) params.set("tourists", String(tourists));
                router.push(`${catalogPath}?${params.toString()}`);
              }}
              className="w-full h-14 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold text-lg transition-all hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98]"
            >
              {t("search.findButton")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
