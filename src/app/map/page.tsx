"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const InteractiveMap = dynamic(() => import("@/components/InteractiveMap"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-emerald-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Загрузка карты...</p>
      </div>
    </div>
  ),
});

interface MapLocation {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  price: number;
  rating: number;
  image: string;
  city: string;
  country: string;
}

const categories = [
  { id: "hotel", label: "Отели", icon: "🏨", color: "bg-blue-500" },
  { id: "tour", label: "Туры", icon: "🏖", color: "bg-primary" },
  { id: "excursion", label: "Экскурсии", icon: "🏛", color: "bg-emerald-500" },
  { id: "guide", label: "Гиды", icon: "🧭", color: "bg-violet-500" },
  { id: "photographer", label: "Фотографы", icon: "📷", color: "bg-pink-500" },
  { id: "transfer", label: "Трансферы", icon: "🚐", color: "bg-amber-500" },
];

export default function MapPage() {
  const [activeCategories, setActiveCategories] = useState<string[]>(categories.map((c) => c.id));
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await fetch("/api/services/locations");
        if (res.ok) {
          const data = await res.json();
          setLocations(data.locations || []);
        }
      } catch {
        console.error("Failed to fetch locations");
      } finally {
        setIsLoading(false);
      }
    }
    fetchLocations();
  }, []);

  const toggleCategory = (id: string) => {
    setActiveCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const filtered = locations.filter((l) => activeCategories.includes(l.type));

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50 relative">
      {/* Category Filters */}
      <div className="absolute top-4 left-4 z-20 bg-white rounded-2xl shadow-lg border border-gray-100 p-3">
        <div className="flex flex-col gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => toggleCategory(cat.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                activeCategories.includes(cat.id)
                  ? "bg-primary/10 text-primary"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              <span className={`w-3 h-3 rounded-full ${cat.color}`} />
              <span>{cat.icon}</span>
              <span className="hidden lg:inline">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="absolute inset-0">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-emerald-50">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Загрузка объектов...</p>
            </div>
          </div>
        ) : (
          <InteractiveMap
            locations={locations}
            activeCategories={activeCategories}
            onMarkerClick={setSelectedLocation}
          />
        )}
      </div>

      {/* Mobile Toggle */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="absolute top-4 right-4 z-20 w-12 h-12 bg-white rounded-xl shadow-lg border border-gray-100 flex items-center justify-center lg:hidden"
      >
        {showSidebar ? "✕" : "☰"}
      </button>

      {/* Sidebar List */}
      <div className={`absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl z-10 overflow-y-auto transition-transform lg:translate-x-0 ${
        showSidebar ? "translate-x-0" : "translate-x-full"
      }`}>
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-secondary">Найдено: {filtered.length}</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {filtered.map((marker) => {
            const cat = categories.find((c) => c.id === marker.type);
            return (
              <button
                key={marker.id}
                onClick={() => setSelectedLocation(marker)}
                className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left ${
                  selectedLocation?.id === marker.id ? "bg-primary/5" : ""
                }`}
              >
                <img src={marker.image} alt={marker.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-secondary text-sm truncate">{marker.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${cat?.color || "bg-gray-200"} text-white`}>
                      {cat?.label}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <span className="text-amber-500 text-[10px]">★</span>
                      <span className="text-[11px] font-semibold">{marker.rating}</span>
                    </div>
                  </div>
                  <p className="text-primary font-bold text-sm mt-1">{marker.price} AZN</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
