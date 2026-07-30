"use client";

import { useState, useEffect } from "react";
import { usePushNotifications } from "@/lib/usePushNotifications";

interface NotificationSettings {
  emailBookings: boolean;
  emailPromo: boolean;
  pushEnabled: boolean;
  smsImportant: boolean;
  recommendations: boolean;
}

const STORAGE_KEY = "travelhub_notification_settings";

export default function NotificationsTab() {
  const { supported, permission, isSubscribed, subscribe, unsubscribe } = usePushNotifications();
  const [settings, setSettings] = useState<NotificationSettings>({
    emailBookings: true,
    emailPromo: true,
    pushEnabled: false,
    smsImportant: false,
    recommendations: true,
  });
  const [pushLoading, setPushLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings((prev) => ({ ...prev, ...parsed, pushEnabled: isSubscribed }));
      }
    } catch { /* ignore */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync push state
  useEffect(() => {
    setSettings((prev) => ({ ...prev, pushEnabled: isSubscribed }));
  }, [isSubscribed]);

  const toggleSetting = (key: keyof NotificationSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handlePushToggle = async () => {
    setPushLoading(true);
    try {
      if (isSubscribed) {
        await unsubscribe();
        setSettings((prev) => ({ ...prev, pushEnabled: false }));
      } else {
        const sub = await subscribe();
        if (sub) {
          setSettings((prev) => ({ ...prev, pushEnabled: true }));
        }
      }
    } finally {
      setPushLoading(false);
    }
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleItems = [
    { key: "emailBookings" as const, label: "Email уведомления о бронированиях", desc: "Получать письма о статусе бронирований" },
    { key: "emailPromo" as const, label: "Email рассылки", desc: "Акции, скидки и персональные предложения" },
    { key: "smsImportant" as const, label: "SMS уведомления", desc: "Важные обновления по SMS" },
    { key: "recommendations" as const, label: "Рекомендации", desc: "Персональные рекомендации и акции" },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-bold text-secondary mb-6">🔔 Уведомления</h2>

      <div className="space-y-4">
        {/* Push Notifications — special section */}
        <div className={`p-4 rounded-xl border-2 transition-all ${settings.pushEnabled ? "border-success bg-success/5" : "border-gray-200 bg-gray-50"}`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-secondary text-sm">🔔 Push уведомления</p>
                {!supported && (
                  <span className="px-2 py-0.5 bg-gray-200 text-gray-500 text-[10px] rounded-full font-medium">Не поддерживается</span>
                )}
                {supported && permission === "denied" && (
                  <span className="px-2 py-0.5 bg-danger/10 text-danger text-[10px] rounded-full font-medium">Заблокированы</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Мгновенные уведомления в браузере о бронированиях, сообщениях и акциях</p>
            </div>
            <button
              onClick={handlePushToggle}
              disabled={!supported || permission === "denied" || pushLoading}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                settings.pushEnabled ? "bg-success" : "bg-gray-200"
              }`}
            >
              <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform shadow ${settings.pushEnabled ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
          {permission === "denied" && (
            <p className="text-xs text-danger mt-2">⚠️ Уведомления заблокированы. Разрешите их в настройках браузера.</p>
          )}
        </div>

        {/* Other toggles */}
        {toggleItems.map((item) => (
          <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-secondary text-sm">{item.label}</p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
            <button
              onClick={() => toggleSetting(item.key)}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                settings[item.key] ? "bg-primary" : "bg-gray-200"
              }`}
            >
              <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform shadow ${settings[item.key] ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        {saved && <span className="text-sm text-success font-medium">✅ Сохранено</span>}
        <button
          onClick={handleSave}
          className="ml-auto h-10 px-6 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-semibold transition-all hover:shadow-lg"
        >
          Сохранить
        </button>
      </div>
    </div>
  );
}
