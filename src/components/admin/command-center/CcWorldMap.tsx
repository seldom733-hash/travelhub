"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { moneyCompact } from "./types";

interface CountryMapPoint {
  country: string;
  revenue: number;
  growth: number;
  tourists: number;
  avgCheck: number;
  conversion: number;
  topServices: { type: string; label: string; icon: string }[];
  coords: [number, number];
}

interface CcWorldMapProps {
  countries: CountryMapPoint[];
}

export default function CcWorldMap({ countries }: CcWorldMapProps) {
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState<CountryMapPoint | null>(null);

  useEffect(() => setMounted(true), []);

  const maxRevenue = useMemo(() => Math.max(1, ...countries.map((c) => c.revenue)), [countries]);

  const center: [number, number] = useMemo(() => {
    if (countries.length === 0) return [30, 25];
    const avgLat = countries.reduce((s, c) => s + c.coords[0], 0) / countries.length;
    const avgLng = countries.reduce((s, c) => s + c.coords[1], 0) / countries.length;
    return [avgLat, avgLng] as [number, number];
  }, [countries]);

  if (!mounted || countries.length === 0) {
    return (
      <div className="h-[340px] bg-gradient-to-br from-blue-50 to-cyan-50/50 rounded-xl flex items-center justify-center">
        <span className="text-gray-400 text-sm">🗺 Нет данных для карты</span>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-100">
      <MapContainer center={center} zoom={3} style={{ width: "100%", height: 340 }} scrollWheelZoom={false} className="z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {countries.map((c) => {
          const size = 12 + Math.round((c.revenue / maxRevenue) * 26);
          return (
            <CircleMarker
              key={c.country}
              center={c.coords}
              radius={size / 2}
              pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.75, weight: 1 }}
            >
              <Tooltip direction="top" offset={[0, -size / 2]} className="cc-country-tooltip">
                <div style={{ minWidth: 210, padding: 4 }}>
                  <p style={{ fontWeight: 800, fontSize: 13, margin: "0 0 6px", color: "#0f172a" }}>
                    🌍 {c.country}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", fontSize: 11 }}>
                    <span style={{ color: "#64748b" }}>Доход</span>
                    <span style={{ fontWeight: 700, color: "#10b981", textAlign: "right" }}>{moneyCompact(c.revenue)}</span>
                    <span style={{ color: "#64748b" }}>Конверсия</span>
                    <span style={{ fontWeight: 700, textAlign: "right" }}>{c.conversion}%</span>
                    <span style={{ color: "#64748b" }}>Туристов</span>
                    <span style={{ fontWeight: 700, textAlign: "right" }}>{c.tourists.toLocaleString()}</span>
                    <span style={{ color: "#64748b" }}>Средний чек</span>
                    <span style={{ fontWeight: 700, textAlign: "right" }}>{c.avgCheck.toLocaleString()} $</span>
                    <span style={{ color: "#64748b" }}>Рост</span>
                    <span style={{ fontWeight: 700, color: c.growth >= 0 ? "#10b981" : "#ef4444", textAlign: "right" }}>
                      {c.growth >= 0 ? "↑" : "↓"} {Math.abs(c.growth)}%
                    </span>
                  </div>
                  {c.topServices.length > 0 && (
                    <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid #f1f5f9" }}>
                      <p style={{ fontSize: 10, color: "#94a3b8", margin: "0 0 4px", fontWeight: 700 }}>ТОП услуги</p>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {c.topServices.map((ts) => (
                          <span key={ts.type} style={{ fontSize: 10, fontWeight: 600, background: "#eef2ff", color: "#4f46e5", borderRadius: 999, padding: "2px 8px" }}>
                            {ts.icon} {ts.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Hover summary strip */}
      {hovered && (
        <div className="absolute left-3 bottom-3 z-[1000] bg-white/95 backdrop-blur rounded-xl shadow-lg border border-gray-100 px-4 py-3 pointer-events-none">
          <p className="text-sm font-extrabold text-gray-900">🌍 {hovered.country}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Доход <b className="text-emerald-600">{moneyCompact(hovered.revenue)}</b> • Конверсия <b>{hovered.conversion}%</b>
          </p>
        </div>
      )}

      {/* Country chips below map */}
      <div className="flex flex-wrap gap-2 p-3 bg-gray-50/70">
        {countries.slice(0, 12).map((c) => (
          <button
            key={c.country}
            onMouseEnter={() => setHovered(c)}
            onMouseLeave={() => setHovered(null)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white border border-gray-200 text-[11px] font-semibold text-gray-700 hover:border-blue-300 hover:text-blue-600 hover:shadow-sm transition-all"
          >
            <span>🌍</span>
            <span>{c.country}</span>
            <span className="text-[9px] font-bold text-emerald-600">{moneyCompact(c.revenue)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
