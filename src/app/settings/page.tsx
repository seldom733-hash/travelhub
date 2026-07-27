"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import Breadcrumb from "@/components/Breadcrumb";

export default function SettingsPage() {
  const { t } = useI18n();
  const { user, isAuthenticated, isLoading, login } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const profileFetched = useRef(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login?redirect=/settings");
    }
    if (user && !profileFetched.current) {
      profileFetched.current = true;
      fetch("/api/user", { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setFormData({
              firstName: data.user.firstName || user.firstName || "",
              lastName: data.user.lastName || user.lastName || "",
              email: data.user.email || user.email || "",
              phone: data.user.phone || "",
              bio: data.user.bio || "",
            });
          }
        })
        .catch((err) => {
          console.error("Profile fetch error:", err);
          setFormData({
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email || "",
            phone: "",
            bio: "",
          });
        });
    }
    return () => { profileFetched.current = false; };
  }, [isAuthenticated, isLoading, router]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone.trim(),
          bio: formData.bio.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("settings.saveError"));

      login(data.user);
      setSuccess(t("settings.success"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("settings.profileSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Новые пароли не совпадают");
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setError("Новый пароль должен содержать минимум 8 символов");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("settings.passwordSaveError"));

      setSuccess(t("settings.passwordSuccess"));
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("settings.passwordSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "profile", label: t("settings.profile"), icon: "👤" },
    { id: "security", label: t("settings.security"), icon: "🔒" },
    { id: "notifications", label: t("settings.notifications"), icon: "🔔" },
    { id: "language", label: t("settings.language"), icon: "🌐" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Breadcrumb items={[{ label: t("settings.title") }]} />

        <h1 className="text-2xl font-bold text-secondary mb-8">{t("settings.title")}</h1>

        {success && (
          <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-xl text-sm text-success">
            ✅ {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger">
            ❌ {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sticky top-24">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-primary/10 text-primary"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="lg:col-span-3">
            {activeTab === "profile" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-secondary mb-6">{t("settings.personalData")}</h2>
                <form onSubmit={handleProfileSubmit}>
                  <div className="space-y-4">
                    <div className="flex items-center gap-6 mb-6">
                      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-3xl font-bold text-primary">
                        {user?.firstName?.[0] || "?"}
                      </div>
                      <button type="button" className="h-10 px-4 border-2 border-gray-200 rounded-xl text-sm font-medium hover:border-primary transition-colors">
                        {t("settings.changePhoto")}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-secondary mb-2">{t("settings.firstName")}</label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-secondary mb-2">{t("settings.lastName")}</label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50"
                          required
                        />
                      </div>
                    </div>

                    <div>
                    <label className="block text-sm font-semibold text-secondary mb-2">{t("settings.email")}</label>
                    <input
                      type="email"
                      value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-secondary mb-2">{t("settings.phone")}</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+994 XX XXX XX XX"
                        className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-secondary mb-2">{t("settings.bio")}</label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder={t("settings.bioPlaceholder")}
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50 resize-none"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="h-12 px-8 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? t("settings.saving") : t("settings.saved")}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "security" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-secondary mb-6">{t("settings.changePassword")}</h2>
                <form onSubmit={handlePasswordSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-secondary mb-2">{t("settings.currentPassword")}</label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-secondary mb-2">{t("settings.newPassword")}</label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder={t("settings.newPasswordPlaceholder")}
                        className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50"
                        required
                        minLength={8}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-secondary mb-2">{t("settings.confirmNewPassword")}</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50"
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="h-12 px-8 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? t("settings.changing") : t("settings.changePasswordBtn")}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-secondary mb-6">Уведомления <span className="text-sm font-normal text-gray-400">(Скоро)</span></h2>
                <div className="space-y-4 opacity-60 pointer-events-none">
                  {[
                    { label: "Email уведомления о бронированиях", desc: "Получать письма о статусе бронирований", defaultChecked: true },
                    { label: "Push уведомления", desc: "Уведомления в браузере", defaultChecked: true },
                    { label: "SMS уведомления", desc: "Важные обновления по SMS", defaultChecked: false },
                    { label: "Рекомендации", desc: "Персональные рекомендации и акции", defaultChecked: true },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium text-secondary text-sm">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked={item.defaultChecked} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "language" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-secondary mb-6">{t("settings.languageRegion")} <span className="text-sm font-normal text-gray-400">({t("settings.comingSoon")})</span></h2>
                <div className="space-y-4 opacity-60 pointer-events-none">
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-2">{t("settings.interfaceLanguage")}</label>
                    <select className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50">
                      <option value="ru">🇷🇺 Русский</option>
                      <option value="az">🇦🇿 Азербайджанский</option>
                      <option value="en">🇬🇧 English</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-2">{t("settings.currencyLabel")}</label>
                    <select className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50">
                      <option value="AZN">🇦🇿 AZN</option>
                      <option value="USD">🇺🇸 USD</option>
                      <option value="EUR">🇪🇺 EUR</option>
                      <option value="RUB">🇷🇺 RUB</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-2">{t("settings.timezone")}</label>
                    <select className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50">
                      <option value="Asia/Baku">Asia/Baku (GMT+4)</option>
                      <option value="Europe/Moscow">Europe/Moscow (GMT+3)</option>
                      <option value="Europe/Istanbul">Europe/Istanbul (GMT+3)</option>
                    </select>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mt-4">{t("settings.languageNote")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
