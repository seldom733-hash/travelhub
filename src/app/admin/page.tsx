"use client";

import { useState, useEffect } from "react";

interface AdminStats {
  totalUsers: number;
  totalServices: number;
  pendingBookings: number;
  totalRevenue: number;
}

import { useI18n } from "@/lib/i18n-context";

export default function AdminPage() {
  const { t } = useI18n();
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    fetch("/api/admin", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setStats(d.stats))
      .catch(() => {});
  }, []);

  const menuItems = [
    { icon: "📊", labelKey: "admin.sidebar.overview", desc: "Полная аналитика платформы — просмотры, доход, пользователи", href: "/admin_dashboard", color: "from-blue-500 to-indigo-600" },
    { icon: "🛡", labelKey: "admin.moderation.title", desc: "Проверка новых услуг и отзывов", href: "/admin_dashboard?tab=moderation", color: "from-amber-500 to-orange-600" },
    { icon: "🤝", labelKey: "admin.sidebar.partners", desc: "Управление партнёрами и их услугами", href: "/admin_dashboard?tab=partners", color: "from-green-500 to-emerald-600" },
    { icon: "👥", labelKey: "admin.sidebar.users", desc: "Управление пользователями: поиск, бан, смена роли", href: "/admin_dashboard?tab=users_mgmt", color: "from-purple-500 to-violet-600" },
    { icon: "💰", labelKey: "admin.sidebar.finance", desc: "Доходы, комиссии, отчёты", href: "/admin_dashboard?tab=finance", color: "from-red-500 to-rose-600" },
    { icon: "⚙️", labelKey: "admin.sidebar.settings", desc: "Настройки профиля и конфигурация", href: "/settings", color: "from-gray-500 to-gray-700" },
  ];

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-secondary to-gray-800 rounded-3xl shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center text-3xl">🛡</div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{t("admin.title")}</h1>
              <p className="text-white/70">{t("admin.subtitle")}</p>
            </div>
          </div>
          {stats && (
            <div className="flex gap-6 mt-6 pt-4 border-t border-white/10">
              <div className="text-center">
                <div className="text-xl font-bold">{stats.totalUsers}</div>
                <div className="text-xs text-white/60">{t("admin.stats.users")}</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{stats.totalServices}</div>
                <div className="text-xs text-white/60">{t("admin.stats.services")}</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{stats.pendingBookings}</div>
                <div className="text-xs text-white/60">{t("admin.stats.pendingOrders")}</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold">{stats?.totalRevenue?.toLocaleString() || "0"} AZN</div>
                <div className="text-xs text-white/60">{t("admin.stats.platformRevenue")}</div>
              </div>
            </div>
          )}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item) => (
            <a
              key={item.labelKey}
              href={item.href}
              className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                {item.icon}
              </div>
              <h3 className="text-lg font-bold text-secondary mb-1">{t(item.labelKey)}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
