"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n-context";
import { isNaturalLanguageQuery } from "@/lib/ai-search-engine";

const navConfig = [
  { i18nKey: "nav.tours", href: "/tours", icon: "🏖" },
  { i18nKey: "nav.hotels", href: "/hotels", icon: "🏨" },
  { i18nKey: "nav.sanatoriums", href: "/sanatoriums", icon: "🏥" },
  { i18nKey: "nav.flights", href: "/flights", icon: "✈" },
  { i18nKey: "nav.trains", href: "/trains", icon: "🚄" },
  { i18nKey: "nav.excursions", href: "/excursions", icon: "🏛" },
  { i18nKey: "nav.guides", href: "/guides", icon: "🧭" },
  { i18nKey: "nav.photographers", href: "/photographers", icon: "📷" },
  { i18nKey: "nav.transfers", href: "/transfers", icon: "🚐" },
];

const megaMenuData: Record<string, { title: string; items: string[] }[]> = {
  "/tours": [
    { title: "По региону", items: ["Европа", "Азия", "Америка", "Африка", "Океания"] },
    { title: "По типу", items: ["Круизы", "Горящие", "VIP", "Семейные", "Детские", "Групповые"] },
  ],
  "/hotels": [
    { title: "По стране", items: ["Турция", "ОАЭ", "Италия", "Испания", "Греция"] },
    { title: "По типу", items: ["Бутик-отели", "Ризорты", "Апартаменты", "Хостелы"] },
    { title: "По рейтингу", items: ["★★★★★", "★★★★", "★★★", "Акции", "Новинки"] },
  ],
  "/sanatoriums": [
    { title: "По стране", items: ["Азербайджан", "Россия", "Грузия", "Турция"] },
    { title: "По типу лечения", items: ["Суставы", "Сердце", "Нервная система", "Косметология"] },
  ],
  "/flights": [
    { title: "По направлению", items: ["Баку → Стамбул", "Баку → Дубай", "Баку → Москва", "Баку → Париж"] },
    { title: "По классу", items: ["Эконом", "Бизнес", "Первый класс"] },
  ],
  "/excursions": [
    { title: "По городу", items: ["Рим", "Стамбул", "Париж", "Дубай", "Баку"] },
    { title: "По типу", items: ["Пешие", "Автобусные", "Водные", "Вечерние", "Гастрономические"] },
  ],
};

const langMap: Record<string, string> = { ru: "RU", en: "EN", az: "AZ" };
const reverseLangMap: Record<string, string> = { RU: "ru", EN: "en", AZ: "az" };

// ─── Header Search with AI intent detection ────────────────────────────────────

interface HeaderSearchProps {
  t: (key: string) => string;
  router: ReturnType<typeof useRouter>;
}

function HeaderSearch({ t, router }: HeaderSearchProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ id: string; title: string; type: string; city: string; country: string; price: number; rating: number; image: string | null }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAIHint, setShowAIHint] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    setShowAIHint(value.length >= 3 && isNaturalLanguageQuery(value));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length >= 2) {
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
          if (res.ok) {
            const data = await res.json();
            setSuggestions(data.suggestions || []);
            setShowSuggestions(true);
          }
        } catch { /* ignore */ }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.length >= 3) {
      setShowSuggestions(false);
      router.push(`/ai-search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="hidden md:flex flex-1 max-w-xl mx-6" ref={ref}>
      <form onSubmit={handleSubmit} className="relative w-full">
        <input
          type="text"
          placeholder={t("header.searchPlaceholder")}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          className="w-full h-10 pl-4 pr-10 rounded-full border-2 border-gray-200 focus:border-primary focus:ring-0 outline-none transition-colors bg-gray-50 text-sm"
          aria-label="Поиск"
        />
        <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors" aria-label="Найти">🔍</button>

        {/* AI hint */}
        {showAIHint && !showSuggestions && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl border border-primary/20 p-3 z-50">
            <button onClick={handleSubmit} className="w-full flex items-center gap-2 text-left hover:bg-white/50 rounded-lg p-2 transition-colors">
              <span className="text-lg">🤖</span>
              <div>
                <p className="text-sm font-semibold text-secondary">Попробовать AI-подборку</p>
                <p className="text-xs text-gray-500">Опишите путешествие — подберём лучшие варианты</p>
              </div>
              <span className="ml-auto text-primary text-xs font-bold">→</span>
            </button>
          </div>
        )}

        {/* Regular suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 max-h-80 overflow-y-auto">
            {suggestions.map((s) => (
              <a
                key={s.id}
                href={`/services/${s.id}`}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                onClick={() => setShowSuggestions(false)}
              >
                <img src={s.image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=80&q=80"} alt={s.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-secondary text-sm truncate">{s.title}</p>
                  <p className="text-xs text-gray-400">{s.city}, {s.country}</p>
                </div>
                <span className="text-sm font-bold text-primary shrink-0">{s.price} AZN</span>
              </a>
            ))}
            {/* AI search link at bottom */}
            {showAIHint && (
              <a
                href={`/ai-search?q=${encodeURIComponent(query)}`}
                className="flex items-center gap-2 p-3 bg-gradient-to-r from-primary/5 to-accent/5 border-t border-gray-100 text-primary font-medium text-sm hover:bg-primary/10 transition-colors"
              >
                🤖 Использовать AI-подбор для «{query.length > 30 ? query.slice(0, 30) + "..." : query}» →
              </a>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

export default function Header() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { locale, setLocale, t } = useI18n();
  const router = useRouter();

  const navItems = navConfig.map((item) => ({ ...item, label: t(item.i18nKey) }));
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { totalItems } = useCart();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    router.push("/");
  };

  return (
    <>
      {/* Top Bar */}
      <div className="bg-secondary text-white text-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-9">
          <div className="flex items-center gap-4">
            <span className="text-gray-400">📞 +994 12 345 67 89</span>
            <span className="text-gray-400 hidden sm:inline">📧 info@travelhub.az</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {["RU", "AZ", "EN"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLocale(reverseLangMap[lang] as "ru" | "en" | "az")}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${langMap[locale] === lang ? "bg-primary text-white" : "text-gray-400 hover:text-white"}`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? "glass shadow-lg" : "bg-white shadow-sm"}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg">T</div>
              <span className="text-xl font-bold text-secondary hidden sm:block">Travel<span className="text-primary">Hub</span></span>
            </a>

            {/* Search Bar */}
            <HeaderSearch t={t} router={router} />

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <button className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-lg" aria-label="Избранное">❤️</button>
              <button className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-lg relative" aria-label="Уведомления">
                🔔
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger rounded-full text-white text-[10px] flex items-center justify-center font-bold">3</span>
              </button>
              <a href="/cart" className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-lg relative" aria-label="Корзина">
                🛒
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </a>

              {isLoading ? (
                <div className="hidden lg:flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
                </div>
              ) : isAuthenticated && user ? (
                <div ref={userMenuRef} className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 h-9 px-3 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors" aria-label="Профиль">
                    <span className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">{user.firstName[0]}</span>
                    <span className="text-sm font-medium text-primary hidden lg:block">{user.firstName}</span>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="font-semibold text-secondary text-sm">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                      {user.role === "ADMIN" && (
                        <a href="/admin_dashboard" className="block px-4 py-2 text-sm text-primary font-semibold hover:bg-primary/5 transition-colors">🛡 {t("header.dashboard")}</a>
                      )}

                      <a href="/favorites" className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">{t("header.favorites")}</a>
                      <a href="/settings" className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">{t("header.settings")}</a>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-red-50 transition-colors border-t border-gray-100 mt-1">{t("header.logout")}</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden lg:flex items-center gap-2">
                  <a href="/auth/login" className="h-9 px-4 rounded-full text-sm font-medium text-secondary hover:bg-gray-100 transition-colors">{t("header.loginButton")}</a>
                  <a href="/auth/register" className="h-9 px-4 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors">{t("header.registerButton")}</a>
                </div>
              )}

              <button className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? "Закрыть меню" : "Открыть меню"}>
                <span className="text-xl">{mobileMenuOpen ? "✕" : "☰"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="border-t border-gray-100 hidden lg:block">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex items-center gap-1 h-11 overflow-x-auto" aria-label="Основная навигация">
              {navItems.map((item) => (
                <div key={item.href} className="mega-menu-trigger relative" onMouseEnter={() => setActiveMegaMenu(item.href)} onMouseLeave={() => setActiveMegaMenu(null)}>
                  <a href={item.href} className="flex items-center gap-1.5 px-3 h-11 text-sm font-medium text-gray-700 hover:text-primary transition-colors whitespace-nowrap">
                    <span aria-hidden="true">{item.icon}</span>
                    <span>{item.label}</span>
                  </a>
                  {megaMenuData[item.href] && activeMegaMenu === item.href && (
                    <div className="mega-menu absolute top-full left-0 w-[600px] bg-white rounded-b-2xl shadow-2xl border border-gray-100 p-6 z-50">
                      <div className="grid grid-cols-3 gap-6">
                        {megaMenuData[item.href].map((section) => (
                          <div key={section.title}>
                            <h4 className="text-sm font-bold text-secondary mb-3 uppercase tracking-wide">{section.title}</h4>
                            <ul className="space-y-2">
                              {section.items.map((subItem) => (
                                <li key={subItem}><a href="#" className="text-sm text-gray-600 hover:text-primary transition-colors block py-1">{subItem}</a></li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <a href={item.href} className="text-sm font-medium text-primary hover:text-primary-dark transition-colors">Смотреть все {item.label.toLowerCase()} →</a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white">
            <div className="p-4">
              <div className="mb-4 md:hidden">
                <input type="text" placeholder={t("header.search")} className="w-full h-10 pl-4 pr-4 rounded-full border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50" aria-label={t("common.search")} />
              </div>
              {isLoading ? (
                <div className="mb-4 p-3 bg-gray-50 rounded-xl animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-16" />
                </div>
              ) : !isAuthenticated ? (
                <div className="flex gap-2 mb-4">
                  <a href="/auth/login" className="flex-1 h-10 rounded-full border-2 border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors text-center leading-10">{t("header.loginButton")}</a>
                  <a href="/auth/register" className="flex-1 h-10 rounded-full bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors text-center leading-10">{t("header.registerButton")}</a>
                </div>
              ) : user ? (
                <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                  <p className="font-semibold text-secondary text-sm">{user.firstName} {user.lastName}</p>
                  <button onClick={handleLogout} className="text-xs text-danger mt-1">{t("header.logout")}</button>
                </div>
              ) : null}
              {/* Mobile Language Switcher */}
              <div className="flex gap-2 mb-4 justify-center">
                {["ru", "en", "az"].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLocale(lang as "ru" | "en" | "az")}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                      locale === lang
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
              <nav className="space-y-1" aria-label="Мобильная навигация">
                {navItems.map((item) => (
                  <a key={item.href} href={item.href} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    <span className="text-lg" aria-hidden="true">{item.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                  </a>
                ))}
              </nav>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
