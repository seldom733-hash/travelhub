"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useFetch } from "@/lib/useFetch";
import Breadcrumb from "@/components/Breadcrumb";

interface FavoriteService {
  id: string;
  serviceId: string;
  createdAt: string;
  service: {
    id: string;
    title: string;
    city: string;
    country: string;
    images: string[];
    type: string;
    price: number;
    discountPrice: number | null;
    rating: number;
    reviewCount: number;
  };
}

interface FavoritesResponse {
  favorites: FavoriteService[];
}

export default function FavoritesPage() {
  const { t } = useI18n();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login?redirect=/favorites");
    }
  }, [isAuthenticated, isLoading, router]);

  const { data, loading, refetch } = useFetch<FavoritesResponse>(
    "/api/favorites",
    { enabled: isAuthenticated, retries: 1, retryDelay: 2000 },
  );

  const favorites = data?.favorites ?? [];

  const handleRemove = async (favoriteId: string) => {
    try {
      const res = await fetch(`/api/favorites/${favoriteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        refetch();
      }
    } catch {
      setError("Не удалось удалить из избранного");
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse">
                <div className="h-40 bg-gray-200 rounded-xl mb-4" />
                <div className="h-5 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Breadcrumb items={[{ label: t("favorites.title") }]} />

        <h1 className="text-2xl font-bold text-secondary mb-2">{t("favorites.title")}</h1>
        <p className="text-gray-500 mb-6">{t("favorites.subtitle")}</p>

        {error && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger">
            ❌ {error}
          </div>
        )}

        {favorites.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
            <div className="text-6xl mb-4">❤️</div>
            <h2 className="text-xl font-bold text-secondary mb-2">{t("favorites.empty")}</h2>
            <p className="text-gray-500 mb-6">{t("favorites.emptyDesc")}</p>
            <a
              href="/tours"
              className="inline-flex h-12 px-8 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all hover:shadow-lg"
            >
              {t("favorites.findTours")}
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {favorites.map((fav) => {
              const service = fav.service;
              const imageUrl = service.images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80";
              const price = service.discountPrice || service.price;

              return (
                <div key={fav.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                  <div className="relative">
                    <img
                      src={imageUrl}
                      alt={service.title}
                      className="w-full h-48 object-cover"
                    />
                    <button
                      onClick={() => handleRemove(fav.id)}
                      className="absolute top-3 right-3 w-10 h-10 bg-white/90 hover:bg-danger hover:text-white rounded-full flex items-center justify-center text-danger transition-all shadow-sm"
                      aria-label={t("favorites.removeLabel")}
                    >
                      ❤️
                    </button>
                    {service.discountPrice && (
                      <div className="absolute top-3 left-3 px-3 py-1 bg-danger text-white text-xs font-bold rounded-full">
                        -{Math.round((1 - service.discountPrice / service.price) * 100)}%
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-secondary text-lg leading-tight">{service.title}</h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-amber-500">⭐</span>
                        <span className="text-sm font-medium text-secondary">{service.rating}</span>
                        <span className="text-xs text-gray-400">({service.reviewCount})</span>
                      </div>
                    </div>

                    <p className="text-gray-500 text-sm mb-3">
                      📍 {service.city}, {service.country}
                    </p>

                    <div className="flex items-center justify-between">
                      <div>
                        {service.discountPrice && (
                          <span className="text-sm text-gray-400 line-through mr-2">{service.price} AZN</span>
                        )}
                        <span className="text-xl font-bold text-primary">{price} AZN</span>
                        <span className="text-sm text-gray-400"> /чел</span>
                      </div>
                      <a
                        href={`/services/${service.id}`}
                        className="h-10 px-4 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium transition-all"
                      >
                        {t("favorites.moreDetails")}
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
