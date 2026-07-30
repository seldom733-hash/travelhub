"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n-context";
import { useRouter } from "next/navigation";

function CheckoutContent() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, subtotal, serviceFee, total, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  // Check for Stripe success/cancel
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const status = searchParams.get("status");
    if (status === "success" || sessionId) {
      setStep(3);
      clearCart();
    } else if (status === "cancelled") {
      setError("Оплата была отменена");
    }
  }, [searchParams, clearCart]);

  // Pre-fill from user data
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        firstName: prev.firstName || user.firstName || "",
        lastName: prev.lastName || user.lastName || "",
        email: prev.email || user.email || "",
      }));
    }
  }, [user]);

  const handlePayment = async () => {
    setProcessing(true);
    setError("");

    try {
      const res = await fetch("/api/payments/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          items: items.map((item) => ({
            serviceId: item.serviceId,
            name: item.name,
            price: item.pricePerPerson,
            quantity: item.quantity || 1,
            guests: item.guests,
            date: item.date,
            image: item.image,
          })),
          guestInfo: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Ошибка оплаты");

      // If Stripe returned a URL, redirect to it
      if (data.url) {
        window.location.href = data.url;
        return;
      }

      // Demo mode - show success
      setStep(3);
      clearCart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка оплаты");
    } finally {
      setProcessing(false);
    }
  };

  // Success screen
  if (step === 3) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 animate-fadeInUp">
            ✅
          </div>
          <h1 className="text-3xl font-bold text-secondary mb-4">{t("checkout.orderComplete")}</h1>
          <p className="text-gray-500 mb-2">
            {t("checkout.orderNumber")}{" "}
            <span className="font-semibold text-secondary">#TH-{Math.floor(100000 + Math.random() * 900000)}</span>
          </p>
          <p className="text-gray-500 mb-8">
            {t("checkout.confirmationSent")} {formData.email || t("checkout.yourEmail")}
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="/dashboard"
              className="h-12 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all hover:shadow-lg"
            >
              {t("checkout.myBookings")}
            </a>
            <a
              href="/"
              className="h-12 bg-gray-100 hover:bg-gray-200 text-secondary rounded-xl font-medium transition-all"
            >
              {t("checkout.homeButton")}
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart
  if (items.length === 0 && step === 1) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-2xl font-bold text-secondary mb-2">Корзина пуста</h1>
          <a
            href="/"
            className="mt-4 inline-block h-12 px-8 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
          >
            {t("checkout.homeButton")}
          </a>
        </div>
      </div>
    );
  }

  const paymentMethodIcons: Record<string, string> = { card: "💳", apple: "🍎", google: "🔵" };

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-secondary mb-8">{t("checkout.title")}</h1>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger">
            ❌ {error}
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[
            { num: 1, label: t("checkout.step1") },
            { num: 2, label: t("checkout.step2") },
            { num: 3, label: t("checkout.step3") },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step >= s.num ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {step > s.num ? "✓" : s.num}
              </div>
              <span className={`text-sm ${step >= s.num ? "text-secondary font-medium" : "text-gray-400"}`}>
                {s.label}
              </span>
              {i < 2 && <div className={`w-12 h-1 rounded ${step > s.num ? "bg-primary" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-secondary mb-6">{t("checkout.travelerData")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-2">{t("checkout.firstName")}</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50"
                      placeholder={t("checkout.firstNamePlaceholder")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-2">{t("checkout.lastName")}</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50"
                      placeholder={t("checkout.lastNamePlaceholder")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-2">{t("checkout.email")}</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50"
                      placeholder={t("checkout.emailPlaceholder")}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-2">{t("checkout.phone")}</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50"
                      placeholder={t("checkout.phonePlaceholder")}
                    />
                  </div>
                </div>
                <button
                  onClick={() => setStep(2)}
                  className="w-full h-12 mt-6 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all hover:shadow-lg"
                >
                  {t("checkout.next")}
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-secondary mb-6">{t("checkout.paymentMethod")}</h2>
                <div className="flex gap-3 mb-6">
                  {(["card", "apple", "google"] as const).map((id) => (
                    <button
                      key={id}
                      onClick={() => setPaymentMethod(id)}
                      className={`flex-1 h-14 flex items-center justify-center gap-2 rounded-xl border-2 font-medium text-sm transition-all ${
                        paymentMethod === id
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-lg">{paymentMethodIcons[id]}</span>
                      {t(`checkout.paymentMethods.${id}`)}
                    </button>
                  ))}
                </div>

                {paymentMethod === "card" && (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 mb-6">
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="text-2xl">🔒</span>
                      <div>
                        <p className="font-medium text-secondary">Безопасная оплата через Stripe</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Данные карты обрабатываются на защищённых серверах Stripe. Мы не храним номера карт.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 h-12 border-2 border-gray-200 text-secondary rounded-xl font-semibold hover:bg-gray-50 transition-all"
                  >
                    {t("checkout.back")}
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={processing}
                    className="flex-1 h-12 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Обработка...
                      </>
                    ) : (
                      <>💳 Оплатить {total} AZN</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-secondary mb-4">{t("checkout.yourOrder")}</h2>
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-500 truncate flex-1 mr-2">{item.name}</span>
                    <span className="font-medium text-secondary shrink-0">
                      {item.pricePerPerson * item.guests * (item.quantity || 1)} AZN
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t("checkout.serviceFee")}</span>
                  <span className="font-medium text-secondary">{serviceFee} AZN</span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between">
                  <span className="font-bold text-secondary">{t("checkout.total")}</span>
                  <span className="font-bold text-primary text-xl">{total} AZN</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-success/5 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-success font-medium">
                  <span>🔒</span> {t("checkout.securePayment")}
                </div>
                <p className="text-xs text-gray-500 mt-1">{t("checkout.securePaymentDesc")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
