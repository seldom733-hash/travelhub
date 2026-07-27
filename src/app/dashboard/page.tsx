"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import Breadcrumb from "@/components/Breadcrumb";

interface DashboardBooking {
  id: string;
  status: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  currency: string;
  service: {
    id: string;
    title: string;
    city: string;
    country: string;
    images: string[];
    type: string;
  };
}

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Ожидание", color: "bg-amber-100 text-amber-600" },
  CONFIRMED: { label: "Подтверждено", color: "bg-green-50 text-green-600" },
  COMPLETED: { label: "Завершено", color: "bg-blue-50 text-blue-600" },
  CANCELLED: { label: "Отменено", color: "bg-red-50 text-red-600" },
  REFUNDED: { label: "Возврат", color: "bg-gray-100 text-gray-600" },
};



export default function DashboardPage() {
  const { t } = useI18n();
  const { user, isAuthenticated, isLoading } = useAuth();

  const sidebarItems = [
    { icon: "📦", label: t("dashboard.sidebar.bookings"), id: "bookings" },
    { icon: "❤️", label: t("dashboard.sidebar.favorites"), id: "favorites", href: "/favorites" },
    { icon: "⭐", label: t("dashboard.sidebar.reviews"), id: "reviews" },
    { icon: "⚙️", label: t("dashboard.sidebar.settings"), id: "settings", href: "/settings" },
  ];
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("bookings");
  const [bookings, setBookings] = useState<DashboardBooking[]>([]);
  const [stats, setStats] = useState({ active: 0, completed: 0, totalSpent: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login?redirect=/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/bookings", { credentials: "include" });
        const data = await res.json();
        if (res.ok && data.bookings) {
          setBookings(data.bookings);
          const active = data.bookings.filter((b: DashboardBooking) => ["PENDING", "CONFIRMED"].includes(b.status)).length;
          const completed = data.bookings.filter((b: DashboardBooking) => b.status === "COMPLETED").length;
          const totalSpent = data.bookings.reduce((sum: number, b: DashboardBooking) => sum + Number(b.totalPrice), 0);
          setStats({ active, completed, totalSpent });
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [isAuthenticated]);

  if (isLoading || loading) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: t("header.dashboard") }]} />

        {/* Profile Header */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-4xl font-bold text-primary overflow-hidden">
                {user.firstName?.[0] || "?"}
              </div>
            </div>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-2xl font-bold text-secondary">{user.firstName} {user.lastName}</h1>
              <p className="text-gray-500 mb-2">{user.email}</p>
              <div className="flex items-center justify-center md:justify-start gap-3">
                <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full font-medium">{user.role || "BUYER"}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-secondary">{stats.active}</div>
                <div className="text-xs text-gray-500">{t("dashboard.active")}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary">{stats.completed}</div>
                <div className="text-xs text-gray-500">{t("dashboard.completed")}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{stats.totalSpent.toLocaleString()} AZN</div>
                <div className="text-xs text-gray-500">{t("dashboard.spent")}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sticky top-24">
              <nav className="space-y-1">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => item.href ? router.push(item.href) : setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      activeTab === item.id
                        ? "bg-primary/10 text-primary"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === "bookings" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-secondary">{t("dashboard.sidebar.bookings")}</h2>
                  <a href="/bookings" className="text-sm text-primary font-medium hover:text-primary-dark">{t("dashboard.viewAll")}</a>
                </div>
                {bookings.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="text-4xl mb-4">📦</p>
                    <p>{t("dashboard.noBookings")}</p>
                    <a href="/tours" className="mt-4 inline-block h-10 px-6 bg-primary text-white rounded-xl font-medium">
                      {t("dashboard.viewTours")}
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <img
                          src={booking.service.images?.[0] || "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=200&q=80"}
                          alt={booking.service.title}
                          className="w-16 h-16 rounded-xl object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-secondary truncate">{booking.service.title}</h3>
                          <p className="text-sm text-gray-500">
                            📍 {booking.service.city} · 📅 {new Date(booking.checkIn).toLocaleDateString("ru-RU")}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${statusLabels[booking.status]?.color || "bg-gray-100 text-gray-600"}`}>
                            {statusLabels[booking.status]?.label || booking.status}
                          </span>
                          <div className="text-lg font-bold text-secondary mt-1">{Number(booking.totalPrice).toLocaleString()} {booking.currency}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "favorites" && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-4">❤️</p>
                <a href="/favorites" className="text-primary hover:underline">{t("dashboard.goToFavorites")}</a>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center py-12 text-gray-400">
                <p className="text-4xl mb-4">⭐</p>
                <p>{t("dashboard.reviewsEmpty")}</p>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-4">⚙️</p>
                <a href="/settings" className="text-primary hover:underline">{t("dashboard.goToSettings")}</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
