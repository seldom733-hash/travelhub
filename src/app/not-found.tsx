"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">🌍</div>
        <h1 className="text-6xl font-bold text-secondary mb-4">{t("notFound.title")}</h1>
        <h2 className="text-2xl font-bold text-secondary mb-2">{t("notFound.heading")}</h2>
        <p className="text-gray-500 mb-8">
          {t("notFound.message")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="h-12 px-8 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] text-center leading-12"
          >
            {t("notFound.homeButton")}
          </Link>
          <Link
            href="/tours"
            className="h-12 px-8 border-2 border-gray-200 hover:border-primary text-secondary hover:text-primary rounded-xl font-bold transition-all text-center leading-12"
          >
            {t("notFound.viewTours")}
          </Link>
        </div>
      </div>
    </div>
  );
}
