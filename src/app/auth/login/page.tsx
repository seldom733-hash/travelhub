"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("auth.loginError"));

      login(data.user);
      const redirect = searchParams.get("redirect") || "/";
      router.push(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.genericError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white font-bold text-xl">T</div>
            <span className="text-2xl font-bold text-secondary">Travel<span className="text-primary">Hub</span></span>
          </a>
          <h1 className="text-2xl font-bold text-secondary mt-6 mb-2">{t("auth.welcomeTitle")}</h1>
          <p className="text-gray-500">{t("auth.welcomeSubtitle")}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
          {error && <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-secondary mb-2">{t("auth.emailLabel")}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-0 outline-none transition-colors text-sm bg-gray-50" required />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-secondary mb-2">{t("auth.passwordLabel")}</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("auth.passwordPlaceholder")} className="w-full h-12 px-4 pr-12 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-0 outline-none transition-colors text-sm bg-gray-50" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-secondary">{showPassword ? "👁" : "👁‍🗨"}</button>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                <span className="text-sm text-gray-600">{t("auth.rememberMe")}</span>
              </label>
              <a href="/auth/forgot" className="text-sm text-primary hover:text-primary-dark font-medium">{t("auth.forgotPassword")}</a>
            </div>

            <button type="submit" disabled={loading} className="w-full h-12 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-base transition-all hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? t("auth.loggingIn") : t("auth.loginButton")}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t("auth.noAccount")} <a href="/auth/register" className="text-primary hover:text-primary-dark font-semibold">{t("auth.registerRedirect")}</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-120px)] flex items-center justify-center bg-gray-50"><div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
