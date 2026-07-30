"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

interface PartnerService {
  id: string;
  title: string;
  type: string;
  city: string;
  country: string;
  price: number;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isFeatured: boolean;
  isHot: boolean;
  createdAt: string;
}

export default function PartnerServiceList() {
  const { user } = useAuth();
  const [services, setServices] = useState<PartnerService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchServices() {
      try {
        const token = document.cookie.match(/token=([^;]+)/)?.[1];
        // Fetch all services then filter by current user's providerId
        const res = await fetch("/api/services?limit=200&sort=newest", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        });
        if (!res.ok) throw new Error("Ошибка загрузки");
        const data = await res.json();
        // Filter services where providerId matches current user
        const myServices = (data.services || []).filter(
          (s: Record<string, unknown>) => {
            const provider = s.provider as { id: string } | undefined;
            return provider?.id === user?.id;
          }
        );
        setServices(myServices);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка");
      } finally {
        setLoading(false);
      }
    }
    if (user) fetchServices();
  }, [user]);

  const typeIcons: Record<string, string> = {
    TOUR: "🏖", HOTEL: "🏨", SANATORIUM: "🏥", EXCURSION: "🏛",
    GUIDE: "🧭", PHOTOGRAPHER: "📷", TRANSFER: "🚐",
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">
          Повторить
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {services.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📦</p>
          <p className="font-medium text-secondary mb-1">Нет услуг</p>
          <p className="text-sm">Добавьте первую услугу, чтобы начать продажи</p>
        </div>
      ) : (
        services.map((service) => (
          <div key={service.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-xl shrink-0">
              {typeIcons[service.type] || "📦"}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-secondary text-sm truncate">{service.title}</h4>
              <p className="text-xs text-gray-500">📍 {service.city}, {service.country}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-primary text-sm">{service.price} AZN</p>
              <p className="text-xs text-gray-400">⭐ {service.rating.toFixed(1)}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {service.isHot && <span className="px-2 py-0.5 bg-danger/10 text-danger text-xs rounded-full font-medium">🔥</span>}
              {service.isFeatured && <span className="px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full font-medium">⭐</span>}
              <span className={`w-2 h-2 rounded-full ${service.isActive ? "bg-success" : "bg-gray-300"}`} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}
