"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import Breadcrumb from "@/components/Breadcrumb";

interface Booking {
  id: string;
  status: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  serviceFee: number;
  currency: string;
  createdAt: string;
  service: {
    id: string;
    title: string;
    city: string;
    country: string;
    images: string[];
    type: string;
  };
  payment: {
    status: string;
    method: string;
  } | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  PENDING: { label: "Ожидание", color: "bg-amber-100 text-amber-600", icon: "⏳" },
  CONFIRMED: { label: "Подтверждено", color: "bg-green-50 text-green-600", icon: "✅" },
  COMPLETED: { label: "Завершено", color: "bg-blue-50 text-blue-600", icon: "🏁" },
  CANCELLED: { label: "Отменено", color: "bg-red-50 text-red-600", icon: "❌" },
  REFUNDED: { label: "Возврат", color: "bg-gray-100 text-gray-600", icon: "💰" },
};

const typeIcons: Record<string, string> = {
  TOUR: "🏖", HOTEL: "🏨", SANATORIUM: "🏥", EXCURSION: "🏛",
  GUIDE: "🧭", PHOTOGRAPHER: "📷", TRANSFER: "🚐", FLIGHT: "✈", TRAIN: "🚄",
};

export default function BookingsPage() {
  const { t } = useI18n();
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login?redirect=/bookings");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function fetchBookings() {
      try {
        const res = await fetch("/api/bookings", { credentials: "include" });
        const data = await res.json();
        if (res.ok) setBookings(data.bookings || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchBookings();
  }, [isAuthenticated]);

  const filtered = activeTab === "all" ? bookings : bookings.filter((b) => b.status === activeTab);
  const tabs = [
    { id: "all", label: "Все", count: bookings.length },
    { id: "PENDING", label: "Ожидание", count: bookings.filter((b) => b.status === "PENDING").length },
    { id: "CONFIRMED", label: "Подтверждено", count: bookings.filter((b) => b.status === "CONFIRMED").length },
    { id: "COMPLETED", label: "Завершено", count: bookings.filter((b) => b.status === "COMPLETED").length },
  ];

  if (isLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Breadcrumb items={[{ label: t("bookings.title") }]} />

          <h1 className="text-3xl font-bold text-secondary mb-2">{t("bookings.title")}</h1>
          <p className="text-gray-500">{t("bookings.subtitle")}</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow-md shadow-primary/30"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-xl font-bold text-secondary mb-2">{t("bookings.empty")}</h2>
            <p className="text-gray-500 mb-6">{t("bookings.emptyDesc")}</p>
            <a href="/tours" className="inline-flex h-12 px-8 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all hover:shadow-lg">
              {t("bookings.viewTours")}
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((booking) => {
              const status = statusConfig[booking.status] || statusConfig.PENDING;
              return (
                <div key={booking.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
                  <div className="flex gap-4">
                    <img
                      src={booking.service.images?.[0] || "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=200&q=80"}
                      alt={booking.service.title}
                      className="w-20 h-20 rounded-xl object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{typeIcons[booking.service.type] || "📦"}</span>
                            <h3 className="font-semibold text-secondary truncate">{booking.service.title}</h3>
                          </div>
                          <p className="text-sm text-gray-500">
                            📍 {booking.service.city}, {booking.service.country}
                          </p>
                          <p className="text-sm text-gray-500">
                            📅 {new Date(booking.checkIn).toLocaleDateString("ru-RU")} — {new Date(booking.checkOut).toLocaleDateString("ru-RU")}
                          </p>
                          <p className="text-sm text-gray-500">👥 {booking.guests} {booking.guests === 1 ? t("bookings.guest") : t("bookings.guests")}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.icon} {status.label}
                          </span>
                          <div className="text-lg font-bold text-secondary mt-2">
                            {Number(booking.totalPrice).toLocaleString()} {booking.currency}
                          </div>
                          <p className="text-xs text-gray-400">Заказ от {new Date(booking.createdAt).toLocaleDateString("ru-RU")}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50">
                        <a href={`/services/${booking.service.id}`} className="h-9 px-4 bg-gray-100 text-secondary rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors">
                          {t("bookings.viewService")}
                        </a>
                        {booking.status === "CONFIRMED" && (
                          <a href={`/chat?service=${booking.service.id}`} className="h-9 px-4 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary hover:text-white transition-all">
                            💬 Связаться
                          </a>
                        )}
                        {booking.status === "COMPLETED" && (
                          <button className="h-9 px-4 bg-amber-100 text-amber-600 rounded-lg text-xs font-medium hover:bg-amber-200 transition-colors">
                            {t("bookings.leaveReview")}
                          </button>
                        )}
                      </div>
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
