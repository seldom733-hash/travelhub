"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import Breadcrumb from "@/components/Breadcrumb";

const sidebarItems = [
  { icon: "📊", label: "Панель управления", id: "dashboard" },
  { icon: "📦", label: "Мои услуги", id: "services" },
  { icon: "🛒", label: "Заказы", id: "orders", badge: 12 },
  { icon: "📅", label: "Календарь", id: "calendar" },
  { icon: "💬", label: "Сообщения", id: "messages", badge: 3 },
  { icon: "⭐", label: "Отзывы", id: "reviews" },
  { icon: "💰", label: "Финансы", id: "finance" },
  { icon: "📄", label: "Документы", id: "documents" },
  { icon: "⚙️", label: "Настройки", id: "settings" },
];

const stats = [
  { icon: "📦", label: "Заказов", value: "156", change: "+12%", color: "bg-primary/10 text-primary" },
  { icon: "💰", label: "Доход", value: "45 200 AZN", change: "+18%", color: "bg-success/10 text-success" },
  { icon: "👁", label: "Просмотры", value: "12 450", change: "+25%", color: "bg-blue-100 text-blue-600" },
  { icon: "⭐", label: "Рейтинг", value: "4.8", change: "+0.1", color: "bg-amber-100 text-amber-600" },
  { icon: "💬", label: "Отзывы", value: "234", change: "+8%", color: "bg-violet-100 text-violet-600" },
  { icon: "📈", label: "Конверсия", value: "12.5%", change: "+2.3%", color: "bg-emerald-100 text-emerald-600" },
];

const recentOrders = [
  { id: "ORD-1234", customer: "Анна К.", service: "Анталья All Inclusive", date: "22 июл", status: "confirmed", amount: 1300 },
  { id: "ORD-1233", customer: "Руслан М.", service: "Экскурсия по Памуккале", date: "21 июл", status: "pending", amount: 110 },
  { id: "ORD-1232", customer: "Сара А.", service: "Трансфер Аэропорт — Отель", date: "20 июл", status: "completed", amount: 90 },
  { id: "ORD-1231", customer: "Дмитрий В.", service: "Вечерний Стамбул", date: "19 июл", status: "confirmed", amount: 70 },
];

const statusLabels: Record<string, { label: string; color: string }> = {
  confirmed: { label: "Подтверждено", color: "bg-success/10 text-success" },
  pending: { label: "Ожидание", color: "bg-amber-100 text-amber-600" },
  completed: { label: "Завершено", color: "bg-blue-100 text-blue-600" },
  cancelled: { label: "Отменено", color: "bg-danger/10 text-danger" },
};

export default function PartnerDashboardPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumb items={[{ label: t("nav.partner") }]} />

        {/* Header */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl">🤝</div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-secondary">Кабинет партнера</h1>
              <p className="text-gray-500">TravelPro Azerbaijan</p>
            </div>
            <button className="h-10 px-6 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold transition-all hover:shadow-lg">
              + Добавить услугу
            </button>
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

            {/* Chart Placeholder */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-secondary">Аналитика дохода</h2>
                <select className="text-sm font-medium text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none">
                  <option>Последние 30 дней</option>
                  <option>Последние 3 месяца</option>
                  <option>Последний год</option>
                </select>
              </div>
              <div className="h-48 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl flex items-center justify-center text-gray-400">
                📈 График дохода (интеграция с Chart.js)
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-secondary">Последние заказы</h2>
                <a href="/partner/orders" className="text-sm text-primary font-medium hover:text-primary-dark">
                  Все заказы →
                </a>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">ID</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Клиент</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Услуга</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Дата</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Статус</th>
                      <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Сумма</th>
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
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${statusLabels[order.status].color}`}>
                            {statusLabels[order.status].label}
                          </span>
                        </td>
                        <td className="py-3 text-sm font-semibold text-secondary text-right">{order.amount} AZN</td>
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
