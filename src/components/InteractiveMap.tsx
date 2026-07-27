"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useI18n } from "@/lib/i18n-context";

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

interface InteractiveMapProps {
  locations: MapLocation[];
  activeCategories: string[];
  onMarkerClick?: (location: MapLocation) => void;
}

const categoryColors: Record<string, string> = {
  hotel: "#3b82f6",
  tour: "#ff6b35",
  excursion: "#10b981",
  guide: "#8b5cf6",
  photographer: "#ec4899",
  transfer: "#f59e0b",
};

const typeEmoji: Record<string, string> = {
  hotel: "🏨", tour: "🏖", excursion: "🏛",
  guide: "🧭", photographer: "📷", transfer: "🚐",
};

function createCustomIcon(type: string) {
  const color = categoryColors[type] || "#ff6b35";
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background:${color};width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:3px solid white;">${typeEmoji[type] || "📍"}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

export default function InteractiveMap({ locations, activeCategories, onMarkerClick }: InteractiveMapProps) {
  const { t } = useI18n();
  const filtered = locations.filter((l) => activeCategories.includes(l.type));
  const center: [number, number] = filtered.length > 0
    ? [filtered.reduce((s, l) => s + l.lat, 0) / filtered.length, filtered.reduce((s, l) => s + l.lng, 0) / filtered.length]
    : [40.4093, 49.8671];

  const iconCache = useMemo(() => {
    const cache: Record<string, L.DivIcon> = {};
    for (const type of Object.keys(categoryColors)) {
      cache[type] = createCustomIcon(type);
    }
    return cache;
  }, []);

  return (
    <MapContainer
      center={center}
      zoom={6}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {filtered.map((loc) => (
        <Marker
          key={loc.id}
          position={[loc.lat, loc.lng]}
          icon={iconCache[loc.type] || iconCache.hotel}
          eventHandlers={{
            click: () => onMarkerClick?.(loc),
          }}
        >
          <Popup>
            <div style={{ minWidth: 200 }}>
              <img src={loc.image} alt={loc.name} style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 8 }} />
              <h3 style={{ fontWeight: 600, marginTop: 8, fontSize: 14 }}>{loc.name}</h3>
              <p style={{ fontSize: 12, color: "#666", margin: "4px 0" }}>{loc.city}, {loc.country}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <span style={{ fontSize: 12 }}>⭐ {loc.rating}</span>
                <span style={{ fontWeight: 700, color: "#ff6b35" }}>{loc.price} AZN</span>
              </div>
              <a href={`/services/${loc.id}`} style={{ display: "block", textAlign: "center", background: "#ff6b35", color: "white", padding: "6px 12px", borderRadius: 8, marginTop: 8, fontSize: 12, textDecoration: "none", fontWeight: 600 }}>
                {t("map.moreDetails")}
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
