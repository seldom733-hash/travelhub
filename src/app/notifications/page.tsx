"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useFetch } from "@/lib/useFetch";
import Breadcrumb from "@/components/Breadcrumb";

interface Notification {
  id: string;
  type: string;
  title: string;
  description: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

const typeConfig: Record<string, { icon: string; color: string }> = {
  BOOKING: { icon: "✅", color: "bg-green-100 text-green-600" },
  MESSAGE: { icon: "💬", color: "bg-blue-100 text-blue-600" },
  PROMO: { icon: "🏷", color: "bg-primary/10 text-primary" },
  REVIEW: { icon: "⭐", color: "bg-amber-100 text-amber-600" },
  SYSTEM: { icon: "⚙️", color: "bg-gray-100 text-gray-600" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Только что";
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  return `${days} дн назад`;
}

export default function NotificationsPage() {
  const { t } = useI18n();
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [channelSettings, setChannelSettings] = useState({
    email: true,
    push: true,
    sms: false,
    telegram: true,
    whatsapp: false,
  });

  const { data, loading, refetch } = useFetch<NotificationsResponse>(
    "/api/notifications",
    { enabled: isAuthenticated, retries: 1, retryDelay: 2000 },
  );

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const filtered = activeTab === "unread"
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      refetch();
    } catch {
      // ignore
    }
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      refetch();
    } catch {
      // ignore
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{t("notifications.loginRequired")}</p>
          <a href="/auth/login" className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-all">
            {t("notifications.loginButton")}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Breadcrumb items={[{ label: t("notifications.title") }]} />

            <h1 className="text-3xl font-bold text-secondary mb-2">{t("notifications.title")}</h1>
            <p className="text-gray-500">{unreadCount} {t("notifications.unread")}</p>
          </div>
          <button
            onClick={markAllRead}
            className="h-10 px-4 bg-white border border-gray-200 hover:border-primary hover:text-primary text-secondary rounded-xl text-sm font-medium transition-all"
          >
            Прочитать все
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Notifications List */}
          <div className="lg:col-span-2">
            <div className="flex gap-2 mb-6">
              {(["all", "unread"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                    activeTab === tab
                      ? "bg-primary text-white"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {tab === "all" ? "Все" : `Непрочитанные (${unreadCount})`}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3" />
                        <div className="h-3 bg-gray-200 rounded w-2/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <div className="text-4xl mb-4">🔔</div>
                <p className="text-gray-500">{t("notifications.empty")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((notif) => {
                  const config = typeConfig[notif.type] || typeConfig.SYSTEM;
                  return (
                    <div
                      key={notif.id}
                      onClick={() => !notif.isRead && markAsRead(notif.id)}
                      className={`bg-white rounded-2xl border p-5 cursor-pointer transition-all hover:shadow-md ${
                        notif.isRead ? "border-gray-100" : "border-primary/30 shadow-sm"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${config.color}`}>
                          {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-semibold text-sm ${notif.isRead ? "text-gray-600" : "text-secondary"}`}>
                              {notif.title}
                            </h3>
                            {!notif.isRead && <span className="w-2 h-2 bg-primary rounded-full shrink-0" />}
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-2">{notif.description}</p>
                          <p className="text-xs text-gray-400 mt-2">{timeAgo(notif.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Channel Settings */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
              <h3 className="font-bold text-secondary mb-4">{t("notifications.channels")}</h3>
              <div className="space-y-4">
                {Object.entries({
                  email: { label: "Email", icon: "📧" },
                  push: { label: "Push-уведомления", icon: "🔔" },
                  sms: { label: "SMS", icon: "📱" },
                  telegram: { label: "Telegram", icon: "💬" },
                  whatsapp: { label: "WhatsApp", icon: "🟢" },
                }).map(([key, { label, icon }]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{icon}</span>
                      <span className="text-sm font-medium text-secondary">{label}</span>
                    </div>
                    <button
                      onClick={() =>
                        setChannelSettings((prev) => ({
                          ...prev,
                          [key]: !prev[key as keyof typeof prev],
                        }))
                      }
                      className={`w-12 h-7 rounded-full transition-all relative ${
                        channelSettings[key as keyof typeof channelSettings]
                          ? "bg-primary"
                          : "bg-gray-200"
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${
                          channelSettings[key as keyof typeof channelSettings]
                            ? "left-6"
                            : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
              <button className="w-full h-10 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-semibold mt-6 transition-all">
                Сохранить
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
