"use client";

import { useI18n } from "@/lib/i18n-context";
import Breadcrumb from "@/components/Breadcrumb";

export default function PrivacyPage() {
  const { t } = useI18n();
  
  const rawSections = t("privacy.sections");
  const sections: { heading: string; text: string }[] = Array.isArray(rawSections) ? (rawSections as unknown as { heading: string; text: string }[]) : [];

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Breadcrumb items={[{ label: t("privacy.title") }]} />

        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-secondary mb-4">{t("privacy.title")}</h1>
          <p className="text-gray-500">{t("privacy.lastUpdated")}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-8">
          {sections.map((section, i) => (
            <section key={i}>
              <h2 className="text-xl font-bold text-secondary mb-3">{section.heading}</h2>
              <p className="text-gray-600 leading-relaxed">{section.text}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
