"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";

interface SearchResults {
  services: { id: string; title: string; type: string; icon: string; city: string; country: string; price: number; rating: number; image: string | null }[];
  partners: { id: string; name: string; companyName: string | null; partnerType: string | null; servicesCount: number }[];
  users: { id: string; name: string; email: string; role: string }[];
  bookings: { id: string; title: string; type: string; customer: string; totalPrice: number; status: string; createdAt: string }[];
  countries: { country: string; revenue: number; count: number }[];
}

export default function CommandCenterTopBar() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleChange = useCallback((value: string) => {
    setQuery(value);
    setOpen(value.length >= 2);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 2) { setResults(null); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(value)}`, { credentials: "include" });
        if (res.ok) { const data = await res.json(); setResults(data.results); setOpen(true); }
      } catch { /* ignore */ }
      setLoading(false);
    }, 300);
  }, []);

  const askAI = () => {
    const q = query.trim();
    if (q.length >= 2) {
      window.dispatchEvent(new CustomEvent("travelhub:ask-ai", { detail: q }));
      setOpen(false);
      setQuery("");
    }
  };

  return (
    <header className="bg-white/90 backdrop-blur-xl border-b border-gray-200/70 shadow-sm">
      <div className="flex items-center gap-3 h-16 px-4 lg:px-6 max-w-[1400px] mx-auto">
        {/* Logo */}
        <a href="/admin" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
            T
          </div>
          <div className="hidden md:block">
            <p className="text-[15px] font-extrabold text-gray-900 leading-tight tracking-tight">
              TravelHub <span className="text-blue-600">Command Center</span>
            </p>
            <p className="text-[10px] text-gray-400 font-medium">{t("commandCenter.title")}</p>
          </div>
        </a>

        {/* Global Search */}
        <div className="flex-1 max-w-2xl mx-2 relative" ref={boxRef}>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              onFocus={() => query.length >= 2 && setOpen(true)}
              onKeyDown={(e) => { if (e.key === "Enter") askAI(); }}
              placeholder={t("commandCenter.searchPlaceholder")}
              className="w-full h-11 pl-10 pr-4 rounded-2xl bg-gray-50 border border-gray-200 focus:border-blue-400 focus:ring-0 focus:bg-white outline-none text-sm transition-all"
            />
            {loading && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />}
          </div>

          {/* Search hint */}
          {query.length < 2 && open && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 text-sm text-gray-500 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Поиск по всей системе</p>
              <p>🔎 «Найди бронирование №54631»</p>
              <p>📈 «Покажи продажи Турции»</p>
              <p>🤝 «Партнер Navitravel»</p>
              <button onClick={askAI} className="w-full mt-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-violet-50 border border-blue-100 text-blue-700 text-xs font-semibold hover:from-blue-100 transition-colors">
                🤖 Спросить AI: «{query || "..."}»
              </button>
            </div>
          )}

          {/* Results dropdown */}
          {open && query.length >= 2 && results && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 max-h-[70vh] overflow-y-auto">
              {(results.services.length + results.partners.length + results.users.length + results.bookings.length + results.countries.length) === 0 ? (
                <div className="p-6 text-center text-sm text-gray-400">
                  <div className="text-2xl mb-1">🔍</div>
                  {t("commandCenter.searchEmpty")}
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {results.countries.length > 0 && (
                    <div className="p-2">
                      <p className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Страны</p>
                      {results.countries.map((c) => (
                        <a key={c.country} href="/admin_dashboard?tab=analytics" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50/60 transition-colors">
                          <span className="text-lg">🌍</span>
                          <span className="flex-1 text-sm font-medium text-gray-800">Продажи: {c.country}</span>
                          <span className="text-xs font-bold text-emerald-600">{c.revenue.toLocaleString()} $</span>
                        </a>
                      ))}
                    </div>
                  )}
                  {results.services.length > 0 && (
                    <div className="p-2">
                      <p className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Услуги</p>
                      {results.services.map((s) => (
                        <a key={s.id} href={`/services/${s.id}`} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50/60 transition-colors">
                          <span className="text-lg">{s.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{s.title}</p>
                            <p className="text-xs text-gray-400">{s.city}, {s.country}</p>
                          </div>
                          <span className="text-xs font-bold text-blue-600 shrink-0">{s.price} $</span>
                        </a>
                      ))}
                    </div>
                  )}
                  {results.partners.length > 0 && (
                    <div className="p-2">
                      <p className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Партнёры</p>
                      {results.partners.map((p) => (
                        <a key={p.id} href="/admin_dashboard?tab=partners" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50/60 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {p.name?.[0] || "P"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{p.companyName || p.name}</p>
                            <p className="text-xs text-gray-400">{p.name} • {p.servicesCount} услуг</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                  {results.users.length > 0 && (
                    <div className="p-2">
                      <p className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Пользователи</p>
                      {results.users.map((u) => (
                        <a key={u.id} href="/admin_dashboard?tab=users_mgmt" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50/60 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {u.name?.[0] || "U"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{u.role}</span>
                        </a>
                      ))}
                    </div>
                  )}
                  {results.bookings.length > 0 && (
                    <div className="p-2">
                      <p className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Бронирования</p>
                      {results.bookings.map((b) => (
                        <a key={b.id} href="/admin_dashboard?tab=orders" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50/60 transition-colors">
                          <span className="text-lg">🧾</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">№{b.id.slice(0, 10)} — {b.title}</p>
                            <p className="text-xs text-gray-400">{b.customer} • {new Date(b.createdAt).toLocaleDateString()}</p>
                          </div>
                          <span className="text-xs font-bold text-emerald-600 shrink-0">{b.totalPrice} $</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Admin profile */}
        <div className="flex items-center gap-2 pl-1.5 ml-1 border-l border-gray-200 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-blue-500/25">
            {user?.firstName?.[0] || "А"}
          </div>
          <div className="hidden lg:block">
            <p className="text-xs font-bold text-gray-800 leading-tight">{user?.firstName || "Администратор"}</p>
            <p className="text-[10px] text-gray-400">Администратор</p>
          </div>
        </div>
      </div>
    </header>
  );
}
