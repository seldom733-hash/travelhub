"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useToast } from "@/components/Toast";

interface AdminStats {
  totalUsers: number;
  totalServices: number;
  pendingBookings: number;
  totalRevenue: number;
}

interface ModerationItem {
  id: string;
  type: string;
  name: string;
  partner?: string;
  user?: string;
  date: string;
  status: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  date: string;
  status: string;
}

export default function AdminDashboardPage() {
  const { t } = useI18n();
  const { toast } = useToast();

  const sidebarItems = [
    { icon: "📊", label: t("admin.sidebar.overview"), id: "overview" },
    { icon: "👥", label: t("admin.sidebar.users"), id: "users" },
    { icon: "📦", label: t("admin.sidebar.services"), id: "services", badge: 5 },
    { icon: "🛒", label: t("admin.sidebar.orders"), id: "orders" },
    { icon: "⭐", label: t("admin.sidebar.reviews"), id: "reviews", badge: 3 },
    { icon: "💰", label: t("admin.sidebar.finance"), id: "finance" },
    { icon: "🎨", label: t("admin.sidebar.banners"), id: "banners" },
    { icon: "🏷", label: t("admin.sidebar.promos"), id: "promos" },
    { icon: "⚙️", label: t("admin.sidebar.settings"), id: "settings" },
  ];
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingItems, setPendingItems] = useState<ModerationItem[]>([]);
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moderatingId, setModeratingId] = useState<string | null>(null);

  const handleModeration = async (serviceId: string, action: "approve" | "reject") => {
    setModeratingId(serviceId);
    try {
      const res = await fetch(`/api/admin/services/${serviceId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error(t("admin.moderationError"));
      setPendingItems((prev) => prev.filter((item) => item.id !== serviceId));
    } catch (err) {
      toast(err instanceof Error ? err.message : t("common.error"), "error");
    } finally {
      setModeratingId(null);
    }
  };

  useEffect(() => {
    async function fetchAdminData() {
      try {
        const res = await fetch("/api/admin", { credentials: "include" });
        if (!res.ok) throw new Error(t("admin.loadError"));
        const data = await res.json();
        setStats(data.stats);
        setPendingItems(data.pendingServices || []);
        setRecentUsers(data.recentUsers || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("common.error"));
      } finally {
        setIsLoading(false);
      }
    }
    fetchAdminData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">{t("admin.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🛡</div>
          <h2 className="text-xl font-bold text-secondary mb-2">{t("admin.accessDenied")}</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const adminStats = [
    { icon: "👥", label: t("admin.stats.users"), value: stats?.totalUsers.toLocaleString() || "0", change: t("admin.stats.usersChange"), color: "bg-blue-100 text-blue-600" },
    { icon: "📦", label: t("admin.stats.services"), value: stats?.totalServices.toLocaleString() || "0", change: t("admin.stats.servicesChange"), color: "bg-primary/10 text-primary" },
    { icon: "🛒", label: t("admin.stats.pendingOrders"), value: String(stats?.pendingBookings || 0), change: t("admin.stats.pendingOrdersChange"), color: "bg-amber-100 text-amber-600" },
    { icon: "💰", label: t("admin.stats.revenue"), value: `${stats?.totalRevenue.toLocaleString() || "0"} AZN`, change: t("admin.stats.revenueChange"), color: "bg-green-100 text-green-600" },
  ];

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center text-2xl">🛡</div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-secondary">{t("admin.title")}</h1>
              <p className="text-gray-500">{t("admin.subtitle")}</p>
            </div>
            <div className="flex gap-3">
              <button className="h-10 px-4 bg-gray-100 text-secondary rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
                {t("admin.report")}
              </button>
              <button className="h-10 px-4 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors">
                {t("admin.createPromo")}
              </button>
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
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      activeTab === item.id
                        ? "bg-secondary text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className={`w-5 h-5 text-[10px] rounded-full flex items-center justify-center font-bold ${
                        activeTab === item.id ? "bg-white/20 text-white" : "bg-red-500 text-white"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {adminStats.map((stat) => (
                <div key={stat.label} className="bg-white rounded-2xl p-5 border border-gray-100">
                  <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center text-lg mb-3`}>
                    {stat.icon}
                  </div>
                  <div className="text-xl font-bold text-secondary mb-1">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                  <div className="text-xs text-green-600 font-medium mt-1">{stat.change}</div>
                </div>
              ))}
            </div>

            {/* Pending Moderation */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-secondary">{t("admin.moderation.title")}</h2>
                  <span className="w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {pendingItems.length}
                  </span>
                </div>
                <button className="text-sm text-primary font-medium hover:text-primary-dark">{t("admin.moderation.viewAll")}</button>
              </div>

              {pendingItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t("admin.moderation.empty")}</p>
              ) : (
                <div className="space-y-3">
                  {pendingItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center text-sm font-bold shrink-0">
                        {item.type === "Service" || item.type === "Услуга" ? "📦" : item.type === "Review" || item.type === "Отзыв" ? "⭐" : item.type === "Document" || item.type === "Документ" ? "📄" : "⚠️"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-secondary text-sm truncate">{item.name}</h3>
                        <p className="text-xs text-gray-500">{item.partner || item.user} · {new Date(item.date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleModeration(item.id, "approve")}
                          disabled={moderatingId === item.id}
                          className="h-8 px-3 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                        >
                          {t("admin.moderation.approve")}
                        </button>
                        <button
                          onClick={() => handleModeration(item.id, "reject")}
                          disabled={moderatingId === item.id}
                          className="h-8 px-3 bg-gray-200 text-secondary rounded-lg text-xs font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
                        >
                          {t("admin.moderation.reject")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Users */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-secondary">{t("admin.users.title")}</h2>
                <button className="text-sm text-primary font-medium hover:text-primary-dark">{t("admin.users.viewAll")}</button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">{t("admin.users.name")}</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">{t("admin.users.email")}</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">{t("admin.users.role")}</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">{t("admin.users.date")}</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">{t("admin.users.status")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 text-sm font-medium text-secondary">{user.name}</td>
                        <td className="py-3 text-sm text-gray-500">{user.email}</td>
                        <td className="py-3 text-sm text-gray-600">{user.role}</td>
                        <td className="py-3 text-sm text-gray-500">{new Date(user.date).toLocaleDateString()}</td>
                        <td className="py-3">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.status === "active" ? "bg-green-50 text-green-600" : "bg-amber-100 text-amber-600"
                          }`}>
                            {user.status === "active" ? t("admin.users.active") : t("admin.users.inactive")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
