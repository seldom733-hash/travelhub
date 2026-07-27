"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n-context";
import Breadcrumb from "@/components/Breadcrumb";

const faqCategoryIds = ["general", "booking", "payment", "cancellation", "account", "partner"] as const;
const faqCategoryIcons: Record<string, string> = { general: "❓", booking: "📦", payment: "💳", cancellation: "❌", account: "👤", partner: "🤝" };

export default function FAQPage() {
  const { t } = useI18n();
  const [activeCategory, setActiveCategory] = useState("general");
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);

  const faqCategories = faqCategoryIds.map((id) => ({
    id,
    label: t(`faq.categories.${id}`),
    icon: faqCategoryIcons[id],
  }));

  const rawFaq = t(`faq.data.${activeCategory}`);
  const faqData: { q: string; a: string }[] = Array.isArray(rawFaq) ? (rawFaq as unknown as { q: string; a: string }[]) : [];

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Breadcrumb items={[{ label: t("faq.title") }]} />

        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-secondary mb-4">{t("faq.title")}</h1>
          <p className="text-gray-500 text-lg">{t("faq.subtitle")}</p>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 justify-center">
          {faqCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setOpenQuestion(null); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                activeCategory === cat.id
                  ? "bg-primary text-white shadow-md"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <span>{cat.icon}</span> {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {faqData.map((faq, index) => (
            <div key={index} className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all hover:shadow-md">
              <button
                onClick={() => setOpenQuestion(openQuestion === index ? null : index)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-semibold text-secondary pr-4">{faq.q}</span>
                <span className={`text-xl transition-transform shrink-0 ${openQuestion === index ? "rotate-180" : ""}`}>▼</span>
              </button>
              {openQuestion === index && (
                <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-50 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-12 bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <h2 className="text-xl font-bold text-secondary mb-3">{t("faq.noAnswer")}</h2>
          <p className="text-gray-500 mb-6">{t("faq.noAnswerDesc")}</p>
          <div className="flex items-center justify-center gap-4">
            <a href="/chat" className="h-12 px-6 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold transition-all hover:shadow-lg">
              {t("faq.chatButton")}
            </a>
            <a href="mailto:support@travelhub.az" className="h-12 px-6 bg-gray-100 hover:bg-gray-200 text-secondary rounded-xl font-medium transition-all">
              {t("faq.emailButton")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
