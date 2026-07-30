"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";

interface SimilarService {
  id: string;
  title: string;
  city: string;
  country: string;
  price: number;
  discountPrice: number | null;
  rating: number;
  images: string[];
  type: string;
  _count: { reviews: number };
}

interface Props {
  serviceId: string;
  serviceType: string;
  city: string;
  country: string;
}

export default function SimilarServicesInline({ serviceId, serviceType, city, country }: Props) {
  const { t } = useI18n();
  const [services, setServices] = useState<SimilarService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSimilar() {
      try {
        const params = new URLSearchParams({ type: serviceType, city, country, limit: "4", sort: "rating" });
        const res = await fetch(`/api/services?${params}`);
        if (!res.ok) return;
        const data = await res.json();
        const filtered = (data.services || []).filter((s: SimilarService) => s.id !== serviceId);
        setServices(filtered.slice(0, 4));
      } catch { /* non-critical */ } finally { setLoading(false); }
    }
    fetchSimilar();
  }, [serviceId, serviceType, city, country]);

  if (loading) return <div className="text-center py-8 text-gray-400">🔍 {t("serviceDetail.similarLoading")}</div>;
  if (services.length === 0) return <div className="text-center py-8 text-gray-400">🔍 {t("filter.noResults")}</div>;

  return (
    <div className="space-y-4">
      {services.map((s) => (
        <a key={s.id} href={`/services/${s.id}`} className="group flex gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
          <img src={s.images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&q=60"} alt={s.title} className="w-20 h-20 rounded-xl object-cover shrink-0" loading="lazy" />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-secondary text-sm truncate group-hover:text-primary transition-colors">{s.title}</h4>
            <p className="text-xs text-gray-500">📍 {s.city}</p>
            <div className="flex items-center gap-1 mt-1"><span className="text-xs text-star">⭐</span><span className="text-xs font-semibold">{s.rating.toFixed(1)}</span><span className="text-xs text-gray-400">({s._count.reviews})</span></div>
            <span className="font-bold text-primary text-sm">{s.discountPrice || s.price} AZN</span>
          </div>
        </a>
      ))}
    </div>
  );
}
