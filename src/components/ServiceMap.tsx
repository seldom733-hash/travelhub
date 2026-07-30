"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });

import "leaflet/dist/leaflet.css";

interface MapMarker {
  id: string;
  title: string;
  lat: number;
  lng: number;
  price: number;
  rating: number;
  image: string;
  city: string;
  country: string;
  type: string;
}

interface ServiceMapProps {
  services: MapMarker[];
  height?: string;
}

// City coordinate lookup for fallback positions
const cityCoords: Record<string, [number, number]> = {
  анталья: [36.8969, 30.7133], стамбул: [41.0082, 28.9784], кемер: [36.6001, 30.5891],
  баку: [40.4093, 49.8671], дубай: [25.2048, 55.2708], рим: [41.9028, 12.4964],
  барселона: [41.3874, 2.1686], прага: [50.0755, 14.4378], хургада: [27.2579, 33.8117],
  москва: [55.7558, 37.6173], тбилиси: [41.7151, 44.8271], паттайя: [12.9236, 100.8825],
  пхукет: [7.8804, 98.3923], санторини: [36.3932, 25.4615], крит: [35.2401, 24.4691],
  луксор: [25.6872, 32.6396], каппадокия: [38.6431, 34.8293], венеция: [45.4408, 12.3155],
  милан: [45.4642, 9.1900], мадрид: [40.4168, -3.7038], париж: [48.8566, 2.3522],
  турция: [39.9334, 32.8597], оаэ: [23.4241, 53.8478], египет: [26.8206, 30.8025],
};

const markerIconCache = new Map<number, ReturnType<typeof getMarkerIconRaw>>();

function getMarkerIconRaw(price: number) {
  if (typeof window === "undefined") return undefined;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const L = require("leaflet");
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background:#ff6b35;color:white;padding:2px 6px;border-radius:8px;font-size:11px;font-weight:bold;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid white">${price} AZN</div>`,
    iconSize: [60, 24],
    iconAnchor: [30, 24],
  });
}

function getMarkerIcon(price: number) {
  if (markerIconCache.has(price)) return markerIconCache.get(price);
  const icon = getMarkerIconRaw(price);
  markerIconCache.set(price, icon);
  return icon;
}

function resolveCoords(service: MapMarker): [number, number] {
  if (service.lat && service.lng && service.lat !== 0 && service.lng !== 0) {
    return [service.lat, service.lng];
  }
  const key = service.city?.toLowerCase();
  if (key && cityCoords[key]) return cityCoords[key];
  return [40.0, 45.0];
}

export default function ServiceMap({ services, height = "500px" }: ServiceMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const validServices = useMemo(() => {
    return services.map((s) => ({ ...s, coords: resolveCoords(s) }));
  }, [services]);

  const center = useMemo(() => {
    if (validServices.length === 0) return [40.0, 45.0] as [number, number];
    const avgLat = validServices.reduce((sum, s) => sum + s.coords[0], 0) / validServices.length;
    const avgLng = validServices.reduce((sum, s) => sum + s.coords[1], 0) / validServices.length;
    return [avgLat, avgLng] as [number, number];
  }, [validServices]);

  if (!mounted) {
    return (
      <div className="bg-gray-100 rounded-2xl flex items-center justify-center" style={{ height }}>
        <span className="text-gray-400">🗺 Загрузка карты...</span>
      </div>
    );
  }

  if (validServices.length === 0) {
    return (
      <div className="bg-gray-100 rounded-2xl flex items-center justify-center" style={{ height }}>
        <span className="text-gray-400">🗺 Нет данных для отображения на карте</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200" style={{ height }}>
      <MapContainer center={center} zoom={6} style={{ width: "100%", height: "100%" }} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validServices.map((service) => (
          <Marker key={service.id} position={service.coords} icon={getMarkerIcon(service.price)}>
            <Popup>
              <div className="min-w-[200px]">
                <img src={service.image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&q=60"} alt={service.title} className="w-full h-28 object-cover rounded-lg mb-2" />
                <h3 className="font-bold text-secondary text-sm">{service.title}</h3>
                <p className="text-xs text-gray-500">📍 {service.city}, {service.country}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-primary">{service.price} AZN</span>
                  <span className="text-xs">⭐ {service.rating.toFixed(1)}</span>
                </div>
                <a href={`/services/${service.id}`} className="block mt-2 text-center text-xs bg-primary text-white rounded-lg py-1.5 hover:bg-primary-dark transition-colors">Подробнее →</a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
