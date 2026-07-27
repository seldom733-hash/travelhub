"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import Breadcrumb from "@/components/Breadcrumb";

export default function ReturnsPage() {
  const { t } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ orderId: "", reason: "", description: "", email: "" });

  const rawPolicies = t("returns.policies");
  const policies: { icon: string; title: string; desc: string }[] = Array.isArray(rawPolicies) ? (rawPolicies as unknown as { icon: string; title: string; desc: string }[]) : [];

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Breadcrumb items={[{ label: t("returns.title") }]} />

        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-secondary mb-4">{t("returns.title")}</h1>
          <p className="text-gray-500 text-lg">{t("returns.subtitle")}</p>
        </div>

        {/* Policies */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          {policies.map((policy) => (
            <div key={policy.title} className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="text-3xl mb-3">{policy.icon}</div>
              <h3 className="font-bold text-secondary mb-2">{policy.title}</h3>
              <p className="text-sm text-gray-500">{policy.desc}</p>
            </div>
          ))}
        </div>

        {/* Request Form */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-secondary">{t("returns.submitRequest")}</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="h-10 px-6 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold transition-all hover:shadow-lg"
            >
              {showForm ? t("returns.hide") : t("returns.newRequest")}
            </button>
          </div>

          {showForm && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">{t("returns.orderNumber")}</label>
                  <input
                    type="text"
                    value={formData.orderId}
                    onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50"
                    placeholder="ORD-XXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">{t("returns.email")}</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">{t("returns.reason")}</label>
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50"
                >
                  <option value="">{t("returns.reasonPlaceholder")}</option>
                  <option value="cancelled">{t("returns.reasons.cancelled")}</option>
                  <option value="not_matching">{t("returns.reasons.not_matching")}</option>
                  <option value="quality">{t("returns.reasons.quality")}</option>
                  <option value="other">{t("returns.reasons.other")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">{t("returns.description")}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50 resize-none"
                  placeholder={t("returns.descriptionPlaceholder")}
                />
              </div>
              <button className="w-full h-12 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all hover:shadow-lg">
                {t("returns.submitButton")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
