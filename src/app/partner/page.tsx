"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import PartnerServiceList from "@/components/PartnerServiceList";

const sidebarItems = [
  { icon: "📊", i18nKey: "partnerDashboard.sidebar.dashboard", id: "dashboard" },
  { icon: "📦", i18nKey: "partnerDashboard.sidebar.services", id: "services" },
  { icon: "🛒", i18nKey: "partnerDashboard.sidebar.orders", id: "orders", badge: 12 },
  { icon: "📅", i18nKey: "partnerDashboard.sidebar.calendar", id: "calendar" },
  { icon: "💬", i18nKey: "partnerDashboard.sidebar.messages", id: "messages", badge: 3 },
  { icon: "⭐", i18nKey: "partnerDashboard.sidebar.reviews", id: "reviews" },
  { icon: "💰", i18nKey: "partnerDashboard.sidebar.finance", id: "finance" },
  { icon: "📄", i18nKey: "partnerDashboard.sidebar.documents", id: "documents" },
  { icon: "⚙️", i18nKey: "partnerDashboard.sidebar.settings", id: "settings" },
];

const statsConfig = [
  { icon: "📦", i18nKey: "partnerDashboard.stats.orders", value: "156", change: "+12%", color: "bg-primary/10 text-primary" },
  { icon: "💰", i18nKey: "partnerDashboard.stats.income", value: "45 200 AZN", change: "+18%", color: "bg-success/10 text-success" },
  { icon: "👁", i18nKey: "partnerDashboard.stats.views", value: "12 450", change: "+25%", color: "bg-blue-100 text-blue-600" },
  { icon: "⭐", i18nKey: "partnerDashboard.stats.rating", value: "4.8", change: "+0.1", color: "bg-amber-100 text-amber-600" },
  { icon: "💬", i18nKey: "partnerDashboard.stats.reviews", value: "234", change: "+8%", color: "bg-violet-100 text-violet-600" },
  { icon: "📈", i18nKey: "partnerDashboard.stats.conversion", value: "12.5%", change: "+2.3%", color: "bg-emerald-100 text-emerald-600" },
];

const recentOrders = [
  { id: "ORD-1234", customer: "Анна К.", service: "Анталья All Inclusive", date: "22 июл", status: "confirmed", amount: 1300 },
  { id: "ORD-1233", customer: "Руслан М.", service: "Экскурсия по Памуккале", date: "21 июл", status: "pending", amount: 110 },
  { id: "ORD-1232", customer: "Сара А.", service: "Трансфер Аэропорт — Отель", date: "20 июл", status: "completed", amount: 90 },
  { id: "ORD-1231", customer: "Дмитрий В.", service: "Вечерний Стамбул", date: "19 июл", status: "confirmed", amount: 70 },
];

const statusColorMap: Record<string, string> = {
  confirmed: "bg-success/10 text-success",
  pending: "bg-amber-100 text-amber-600",
  completed: "bg-blue-100 text-blue-600",
  cancelled: "bg-danger/10 text-danger",
};

export default function PartnerDashboardPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");

  const sidebarItemsTranslated = sidebarItems.map(item => ({ ...item, label: t(item.i18nKey) }));
  const stats = statsConfig.map(stat => ({ ...stat, label: t(stat.i18nKey) }));

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: t("nav.partner") }]} />

        {/* Header */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl">🤝</div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-secondary">{t("partnerDashboard.title")}</h1>
              <p className="text-gray-500">TravelPro Azerbaijan</p>
            </div>
            <button
              onClick={() => router.push("/partner/services/new")}
              className="h-10 px-6 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold transition-all hover:shadow-lg"
            >
              {t("partnerDashboard.addService")}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sticky top-24">
              <nav className="space-y-1">
                {sidebarItemsTranslated.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      activeTab === item.id
                        ? "bg-primary/10 text-primary"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className="w-5 h-5 bg-danger text-white text-[10px] rounded-full flex items-center justify-center font-bold">
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
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center text-lg`}>
                      {stat.icon}
                    </div>
                    <span className="text-xs text-gray-500">{stat.label}</span>
                  </div>
                  <div className="text-2xl font-bold text-secondary mb-1">{stat.value}</div>
                  <div className="text-xs text-success font-medium">{stat.change} за месяц</div>
                </div>
              ))}
            </div>

            {/* Chart Placeholder (only on dashboard) */}
            {activeTab === "dashboard" && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-secondary">{t("partnerDashboard.analytics.title")}</h2>
                  <select className="text-sm font-medium text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none">
                    <option>{t("partnerDashboard.analytics.last30days")}</option>
                    <option>{t("partnerDashboard.analytics.last3months")}</option>
                    <option>{t("partnerDashboard.analytics.lastYear")}</option>
                  </select>
                </div>
                <div className="h-48 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl flex items-center justify-center text-gray-400">
                  {t("partnerDashboard.analytics.chartPlaceholder")}
                </div>
              </div>
            )}

            {/* Services Tab */}
            {activeTab === "services" && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-secondary">{t("partnerDashboard.servicesTab.title")}</h2>
                  <button
                    onClick={() => router.push("/partner/services/new")}
                    className="h-9 px-4 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium transition-all"
                  >
                    {t("partnerDashboard.servicesTab.add")}
                  </button>
                </div>
                <PartnerServiceList />
              </div>
            )}

            {/* Recent Orders (only on dashboard) */}
            {activeTab === "dashboard" && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-secondary">{t("partnerDashboard.ordersTab.title")}</h2>
                  <a href="/partner/orders" className="text-sm text-primary font-medium hover:text-primary-dark">
                    {t("partnerDashboard.ordersTab.allOrders")}
                  </a>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">{t("partnerDashboard.ordersTab.id")}</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">{t("partnerDashboard.ordersTab.client")}</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">{t("partnerDashboard.ordersTab.service")}</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">{t("partnerDashboard.ordersTab.date")}</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">{t("partnerDashboard.ordersTab.status")}</th>
                        <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">{t("partnerDashboard.ordersTab.amount")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 text-sm font-medium text-secondary">{order.id}</td>
                          <td className="py-3 text-sm text-gray-600">{order.customer}</td>
                          <td className="py-3 text-sm text-gray-600">{order.service}</td>
                          <td className="py-3 text-sm text-gray-500">{order.date}</td>
                          <td className="py-3">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusColorMap[order.status] || "bg-gray-100 text-gray-600"}`}>
                              {t(`status.${order.status}`)}
                            </span>
                          </td>
                          <td className="py-3 text-sm font-semibold text-secondary text-right">{order.amount} AZN</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
