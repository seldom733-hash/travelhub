"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useFetch } from "@/lib/useFetch";
import Breadcrumb from "@/components/Breadcrumb";

interface UserReview {
  id: string;
  userId: string;
  rating: number;
  title: string | null;
  text: string;
  photos: string[];
  createdAt: string;
  service: {
    id: string;
    title: string;
    city: string;
    country: string;
    images: string[];
    type: string;
  };
  reply?: {
    text: string;
    createdAt: string;
  } | null;
}

interface ReviewsResponse {
  reviews: UserReview[];
}

export default function ReviewsPage() {
  const { t } = useI18n();
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login?redirect=/reviews");
    }
  }, [isAuthenticated, isLoading, router]);

  const { data, loading } = useFetch<ReviewsResponse>(
    "/api/reviews?limit=50",
    { enabled: isAuthenticated, retries: 1, retryDelay: 2000 },
  );

  const reviews = data?.reviews ?? [];
  const myReviews = reviews.filter((r) => user && r.userId === user.id);

  if (isLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Breadcrumb items={[{ label: t("reviews.title") }]} />

          <h1 className="text-3xl font-bold text-secondary mb-2">{t("reviews.title")}</h1>
          <p className="text-gray-500">{t("reviews.subtitle")}</p>
        </div>

        {myReviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="text-6xl mb-4">⭐</div>
            <h2 className="text-xl font-bold text-secondary mb-2">{t("reviews.empty")}</h2>
            <p className="text-gray-500 mb-6">{t("reviews.emptyDesc")}</p>
            <a href="/bookings" className="inline-flex h-12 px-8 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all hover:shadow-lg">
              {t("reviews.myBookings")}
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {myReviews.map((review) => (
              <div key={review.id} className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex gap-4">
                  <img
                    src={review.service.images?.[0] || "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=200&q=80"}
                    alt={review.service.title}
                    className="w-20 h-20 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="font-semibold text-secondary">{review.service.title}</h3>
                        <p className="text-sm text-gray-500">📍 {review.service.city}, {review.service.country}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} className={`text-sm ${s <= review.rating ? "text-star" : "text-gray-300"}`}>★</span>
                          ))}
                        </div>
                        <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString("ru-RU")}</span>
                      </div>
                    </div>

                    {review.title && <h4 className="font-medium text-secondary mb-1">{review.title}</h4>}
                    <p className="text-gray-600 text-sm leading-relaxed">{review.text}</p>

                    {review.reply && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-400 mb-1">{t("reviews.sellerReply")}</p>
                        <p className="text-sm text-gray-700">{review.reply.text}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
