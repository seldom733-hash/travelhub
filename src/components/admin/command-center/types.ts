"use client";

export interface CommandCenterData {
  generatedAt: string;
  status: {
    healthScore: number;
    level: "excellent" | "good" | "attention";
    onlineUsers: number;
    activePartners: number;
    todayBookings: number;
    todayRevenue: number;
    totalServices: number;
    apiStatus: string;
    serverLoad: number;
    dbLatency: number;
  };
  attention: { id: string; severity: "critical" | "warning" | "info"; icon: string; text: string; meta: string; link: string }[];
  revenue: {
    today: number; week: number; month: number; year: number;
    deltas: { today: number; week: number; month: number; year: number };
    byDay: { date: string; revenue: number; bookings: number }[];
  };
  byCategory: { type: string; label: string; icon: string; revenue: number; percentage: number }[];
  topServices: { id: string; title: string; type: string; typeLabel: string; icon: string; city: string; country: string; rating: number; price: number; sold: number; revenue: number; image: string | null }[];
  countries: { country: string; countryCode: string; revenue: number; growth: number; tourists: number; avgCheck: number; conversion: number; topServices: { type: string; label: string; icon: string }[]; coords: [number, number] }[];
  problems: { key: string; title: string; value: string; detail: string; severity: string; link: string }[];
  ai: { happened: string[]; changed: string[]; do: string[]; risks: string[]; probability: number; findings: { icon: string; text: string; type: string }[] };
}

/** Format a number as USD with thousands separators, e.g. 24320 -> "24 320$" */
export function money(n: number): string {
  return Math.round(n).toLocaleString("ru-RU").replace(/,/g, " ") + "$";
}

/** Compact money, e.g. 2.3M / 684K */
export function moneyCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".", ",") + " млн $";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".", ",") + " тыс. $";
  return Math.round(n) + "$";
}

export const CHART_COLORS = [
  "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ec4899",
  "#06b6d4", "#f97316", "#84cc16", "#6366f1", "#14b8a6",
];
