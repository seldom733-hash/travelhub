"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

type Locale = "ru" | "en" | "az";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LOCALE_STORAGE_KEY = "travelhub_locale";
const DEFAULT_LOCALE: Locale = "ru";
const VALID_LOCALES: Locale[] = ["ru", "en", "az"];

import ruDict from "@/locales/ru.json";
import enDict from "@/locales/en.json";
import azDict from "@/locales/az.json";

const builtInDictionaries: Record<Locale, Record<string, unknown>> = {
  ru: ruDict as Record<string, unknown>,
  en: enDict as Record<string, unknown>,
  az: azDict as Record<string, unknown>,
};

function getDictionary(locale: Locale): Record<string, unknown> {
  return builtInDictionaries[locale] || builtInDictionaries[DEFAULT_LOCALE];
}

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === "object" && key in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[key];
    } else {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[i18n] Missing translation key: ${path}`);
      }
      return path;
    }
  }
  return typeof current === "string" ? current : path;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [dictionary, setDictionary] = useState<Record<string, unknown>>(builtInDictionaries[DEFAULT_LOCALE] as Record<string, unknown>);
  const isLoading = false;
  // Read stored locale after hydration to avoid mismatch
  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    if (stored && VALID_LOCALES.includes(stored)) {
      setLocaleState(stored);
    } else if (typeof navigator !== "undefined") {
      const browserLang = navigator.language.split("-")[0] as Locale;
      if (VALID_LOCALES.includes(browserLang)) {
        setLocaleState(browserLang);
      }
    }
  }, []);

  useEffect(() => {
    setDictionary(getDictionary(locale));
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setDictionary(getDictionary(newLocale));
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
  }, []);

  const t = useCallback(
    (key: string): string => {
      return getNestedValue(dictionary as Record<string, unknown>, key);
    },
    [dictionary]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, isLoading }}>
      <span suppressHydrationWarning>{children}</span>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
