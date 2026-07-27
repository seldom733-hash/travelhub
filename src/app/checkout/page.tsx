"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n-context";

const orderItems = [
  { name: "Анталья All Inclusive", price: 1300 },
  { name: "Трансфер Аэропорт — Отель", price: 90 },
  { name: "Экскурсия по Памуккале", price: 110 },
];

const paymentMethodIcons: Record<string, string> = { card: "💳", apple: "🍎", google: "🔵" };

export default function CheckoutPage() {
  const { t } = useI18n();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
    cardName: "",
  });

  const subtotal = orderItems.reduce((sum, item) => sum + item.price, 0);
  const serviceFee = Math.round(subtotal * 0.05);
  const total = subtotal + serviceFee;

  if (step === 3) {
    return (
      <div className="min-h-[calc(100vh-120px)] bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 animate-fadeInUp">
            ✅
          </div>
          <h1 className="text-3xl font-bold text-secondary mb-4">{t("checkout.orderComplete")}</h1>
          <p className="text-gray-500 mb-2">{t("checkout.orderNumber")} <span className="font-semibold text-secondary">#TH-{Math.floor(100000 + Math.random() * 900000)}</span></p>
          <p className="text-gray-500 mb-8">{t("checkout.confirmationSent")} {formData.email || t("checkout.yourEmail")}</p>
          <div className="flex flex-col gap-3">
            <a href="/dashboard" className="h-12 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all hover:shadow-lg">
              {t("checkout.myBookings")}
            </a>
            <a href="/" className="h-12 bg-gray-100 hover:bg-gray-200 text-secondary rounded-xl font-medium transition-all">
              {t("checkout.homeButton")}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-secondary mb-8">{t("checkout.title")}</h1>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[
            { num: 1, label: t("checkout.step1") },
            { num: 2, label: t("checkout.step2") },
            { num: 3, label: t("checkout.step3") },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step >= s.num ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {step > s.num ? "✓" : s.num}
              </div>
              <span className={`text-sm ${step >= s.num ? "text-secondary font-medium" : "text-gray-400"}`}>{s.label}</span>
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
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-secondary mb-2">{t("checkout.cardNumber")}</label>
                      <input
                        type="text"
                        value={formData.cardNumber}
                        onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                        className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50"
                        placeholder={t("checkout.cardNumberPlaceholder")}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-secondary mb-2">{t("checkout.expiry")}</label>
                        <input
                          type="text"
                          value={formData.cardExpiry}
                          onChange={(e) => setFormData({ ...formData, cardExpiry: e.target.value })}
                          className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50"
                          placeholder={t("checkout.expiryPlaceholder")}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-secondary mb-2">{t("checkout.cvv")}</label>
                        <input
                          type="text"
                          value={formData.cardCvv}
                          onChange={(e) => setFormData({ ...formData, cardCvv: e.target.value })}
                          className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50"
                          placeholder="***"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-secondary mb-2">{t("checkout.cardName")}</label>
                      <input
                        type="text"
                        value={formData.cardName}
                        onChange={(e) => setFormData({ ...formData, cardName: e.target.value })}
                        className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50"
                        placeholder={t("checkout.cardNamePlaceholder")}
                      />
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
                    onClick={() => setStep(3)}
                    className="flex-1 h-12 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all hover:shadow-lg"
                  >
                    {t("checkout.payButton")} {total} AZN
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-secondary mb-4">{t("checkout.yourOrder")}</h2>
              <div className="space-y-3 mb-4">
                {orderItems.map((item) => (
                  <div key={item.name} className="flex justify-between text-sm">
                    <span className="text-gray-500">{item.name}</span>
                    <span className="font-medium text-secondary">{item.price} AZN</span>
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
