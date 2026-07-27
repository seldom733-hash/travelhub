"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n-context";
import { useCart } from "@/lib/cart-context";
import { isNaturalLanguageQuery } from "@/lib/ai-search-engine";
import Breadcrumb from "@/components/Breadcrumb";

interface ParsedQuery {
  destination: string | null;
  country: string | null;
  serviceTypes: string[];
  budget: number | null;
  duration: number | null;
  guests: number;
  preferences: string[];
}

interface SearchResult {
  id: string;
  title: string;
  type: string;
  city: string;
  country: string;
  price: number;
  discountPrice: number | null;
  rating: number;
  images: string[];
  duration: string | null;
  amenities: { name: string }[];
  provider: { firstName: string; lastName: string };
  _count: { reviews: number };
  isHot: boolean;
  hotDiscount: number | null;
}

interface AIResponse {
  parsed: ParsedQuery;
  results: Record<string, SearchResult[]>;
  total: number;
  explanation: string[];
}

const typeLabels: Record<string, { icon: string; labelKey: string }> = {
  TOUR: { icon: "🏖", labelKey: "nav.tours" },
  HOTEL: { icon: "🏨", labelKey: "nav.hotels" },
  EXCURSION: { icon: "🏛", labelKey: "nav.excursions" },
  SANATORIUM: { icon: "🏥", labelKey: "nav.sanatoriums" },
  GUIDE: { icon: "🧭", labelKey: "nav.guides" },
  PHOTOGRAPHER: { icon: "📷", labelKey: "nav.photographers" },
  TRANSFER: { icon: "🚐", labelKey: "nav.transfers" },
  FLIGHT: { icon: "✈", labelKey: "nav.flights" },
  TRAIN: { icon: "🚄", labelKey: "nav.trains" },
};

const exampleQueries = [
  "Хочу неделю у моря в Турции до 1000 AZN для двоих",
  "Ищу отель в Баку с бассейном",
  "Экскурсия по Риму на 2 дня",
  "Бюджетный отдых на море для семьи",
  "Гид в Стамбуле, русскоязычный",
  "Трансфер из аэропорта Баку",
  "Горящий тур в Египет",
  "Фотосессия в Париже",
];

export default function AISearchPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { addItem } = useCart();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AIResponse | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [showHint, setShowHint] = useState(false);
  const [addedCount, setAddedCount] = useState(0);

  // doSearch MUST be defined before useEffect that calls it
  const doSearch = useCallback(async (q: string) => {
    if (q.length < 3) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/ai-search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("aiSearch.errorSearching"));
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("aiSearch.genericError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Auto-search from URL ?q= param
  useEffect(() => {
    const urlQuery = searchParams.get("q");
    if (urlQuery && urlQuery.length >= 3) {
      setQuery(urlQuery);
      doSearch(urlQuery);
    }
    inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const detectIntent = useCallback((text: string) => {
    return isNaturalLanguageQuery(text);
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setShowHint(value.length >= 3 && detectIntent(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    setAddedCount(0);
    e.preventDefault();
    if (query.length >= 3) {
      doSearch(query);
    }
  };

  const handleExampleClick = (example: string) => {
    setAddedCount(0);
    setQuery(example);
    doSearch(example);
  };

  const handleAddAll = () => {
    if (!results) return;
    let count = 0;
    Object.values(results.results).forEach((items) => {
      items.forEach((service) => {
        addItem({
          serviceId: service.id,
          name: service.title,
          image: service.images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
          city: service.city,
          country: service.country,
          date: new Date().toISOString().split("T")[0],
          guests: results.parsed.guests || 2,
          pricePerPerson: Number(service.discountPrice || service.price),
          quantity: 1,
          type: service.type,
        });
        count++;
      });
    });
    setAddedCount(count);
    
  };

  // JSON-LD for SearchResultsPage
  const jsonLd = results ? {
    "@context": "https://schema.org",
    "@type": "SearchResultsPage",
    name: `${t("aiSearch.title")} — ${query}`,
    description: t("aiSearch.subtitle"),
    url: `${typeof window !== "undefined" ? window.location.origin : "https://travelhub.com"}/ai-search?q=${encodeURIComponent(query)}`,
    numberOfItems: results.total,
  } : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      {/* JSON-LD */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <Breadcrumb
          items={[{ label: t("aiSearch.title") }]}
        />
      </div>

      {/* Hero search section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-secondary via-slate-800 to-secondary">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-accent rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-primary text-sm font-bold uppercase tracking-wider">{t("aiSearch.badge")}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
              {t("aiSearch.title")} <span className="text-primary">{t("aiSearch.titleHighlight")}</span>
            </h1>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              {t("aiSearch.subtitle")}
            </p>
          </div>

          {/* Search input */}
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder={t("aiSearch.placeholder")}
                    className="w-full h-16 pl-6 pr-14 rounded-2xl bg-white/95 backdrop-blur-sm text-secondary text-lg font-medium placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-primary/30 shadow-2xl transition-all"
                  />
                  {showHint && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full animate-pulse">🤖 AI</span>
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading || query.length < 3}
                  className="h-16 px-8 bg-primary hover:bg-primary-dark disabled:bg-gray-300 text-white rounded-2xl font-bold text-lg transition-all hover:shadow-lg hover:shadow-primary/40 active:scale-95 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="hidden sm:inline">{t("aiSearch.searching")}</span>
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      <span className="hidden sm:inline">{t("aiSearch.find")}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Example queries */}
          <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
            {exampleQueries.map((example) => (
              <button
                key={example}
                onClick={() => handleExampleClick(example)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs rounded-full transition-all backdrop-blur-sm"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results section */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        {error && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">❌</div>
            <p className="text-secondary font-semibold mb-2">{t("common.error")}</p>
            <p className="text-gray-500 mb-6">{error}</p>
            <button
              onClick={() => doSearch(query)}
              className="h-11 px-6 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-all"
            >
              {t("common.retry")}
            </button>
          </div>
        )}

        {results && !loading && (
          <div className="space-y-8">
            {/* Parsed parameters panel */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🤖</span>
                <h2 className="text-lg font-bold text-secondary">{t("aiSearch.analyzed")}</h2>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {results.parsed.destination && (
                  <span className="px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full">📍 {results.parsed.destination}</span>
                )}
                {results.parsed.country && !results.parsed.destination && (
                  <span className="px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full">🌍 {results.parsed.country}</span>
                )}
                {results.parsed.budget && (
                  <span className="px-3 py-1.5 bg-success/10 text-success text-sm font-medium rounded-full">💰 {t("aiSearch.budget")} {results.parsed.budget} AZN</span>
                )}
                {results.parsed.duration && (
                  <span className="px-3 py-1.5 bg-accent/10 text-accent text-sm font-medium rounded-full">📅 {results.parsed.duration} {t("aiSearch.days")}</span>
                )}
                <span className="px-3 py-1.5 bg-violet-100 text-violet-600 text-sm font-medium rounded-full">👥 {results.parsed.guests} {t("aiSearch.persons")}</span>
                {results.parsed.serviceTypes.map((st) => (
                  <span key={st} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
                    {typeLabels[st]?.icon} {typeLabels[st] ? t(typeLabels[st].labelKey) : st}
                  </span>
                ))}
                {results.parsed.preferences.map((p) => (
                  <span key={p} className="px-3 py-1.5 bg-amber-50 text-amber-600 text-sm font-medium rounded-full">⭐ {p}</span>
                ))}
              </div>

              {/* AI explanations */}
              <div className="space-y-1.5">
                {results.explanation.map((exp, i) => (
                  <p key={i} className="text-sm text-gray-600">{exp}</p>
                ))}
              </div>
            </div>

            {/* No results */}
            {results.total === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-secondary mb-2">{t("aiSearch.noResults")}</h3>
                <p className="text-gray-500 mb-6">{t("aiSearch.tryDifferent")}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {exampleQueries.slice(0, 3).map((ex) => (
                    <button
                      key={ex}
                      onClick={() => handleExampleClick(ex)}
                      className="px-4 py-2 bg-gray-50 hover:bg-primary/5 text-secondary text-sm rounded-full border border-gray-200 hover:border-primary/30 transition-all"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline / Grouped results */}
            {results.total > 0 && Object.entries(results.results).map(([type, items]) => {
              const meta = typeLabels[type] || { icon: "📦", labelKey: "" };
              return (
                <div key={type}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-xl">{meta.icon}</div>
                    <div>
                      <h3 className="font-bold text-secondary text-lg">{meta.labelKey ? t(meta.labelKey) : type}</h3>
                      <p className="text-sm text-gray-400">{items.length} {t("aiSearch.variants")}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((service) => (
                      <a
                        key={service.id}
                        href={`/services/${service.id}`}
                        className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all"
                      >
                        <div className="relative h-40 overflow-hidden">
                          <img
                            src={service.images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80"}
                            alt={service.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          {service.isHot && (
                            <span className="absolute top-3 left-3 bg-danger text-white text-xs font-bold px-2 py-1 rounded-full badge-pulse">
                              🔥 -{service.hotDiscount}%
                            </span>
                          )}
                          <span className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded-full">
                            ⭐ {service.rating} ({service._count.reviews})
                          </span>
                        </div>
                        <div className="p-4">
                          <h4 className="font-semibold text-secondary mb-1 group-hover:text-primary transition-colors line-clamp-1">{service.title}</h4>
                          <p className="text-xs text-gray-500 mb-2">📍 {service.city}, {service.country}</p>
                          {service.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {service.amenities.slice(0, 3).map((a) => (
                                <span key={a.name} className="px-2 py-0.5 bg-accent/10 text-accent text-[11px] rounded-full font-medium">{a.name}</span>
                              ))}
                            </div>
                          )}
                          <div className="flex items-end justify-between pt-2 border-t border-gray-50">
                            <div>
                              {service.discountPrice && (
                                <span className="text-xs text-gray-400 line-through block">{service.price} AZN</span>
                              )}
                              <span className="text-lg font-bold text-primary">{service.discountPrice || service.price} AZN</span>
                            </div>
                            <span className="text-xs text-primary font-medium group-hover:translate-x-1 transition-transform">{t("common.moreDetails")}</span>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Sticky bottom panel */}
            {results.total > 0 && (
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 mt-8 -mx-4 md:mx-0 md:rounded-2xl md:shadow-2xl">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{t("aiSearch.found")}</p>
                    <p className="font-bold text-secondary text-lg">{results.total} {t("aiSearch.servicesCount")}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setResults(null); setQuery(""); inputRef.current?.focus(); }}
                      className="h-11 px-5 border-2 border-gray-200 text-secondary rounded-xl font-medium hover:bg-gray-50 transition-all"
                    >
                      {t("aiSearch.newSearch")}
                    </button>
                    <button
                      onClick={handleAddAll}
                      
                      className="h-11 px-6 bg-primary hover:bg-primary-dark disabled:bg-success text-white rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-primary/30"
                    >
                      {addedCount > 0 ? `✅ ${addedCount} ${t("aiSearch.addedToCart")}` : `🛒 ${t("aiSearch.addAllToCart")}`}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state - no search yet */}
        {!results && !loading && !error && (
          <div className="text-center py-16">
            <div className="text-7xl mb-6">🤖</div>
            <h2 className="text-2xl font-bold text-secondary mb-3">{t("aiSearch.emptyTitle")}</h2>
            <p className="text-gray-500 text-lg max-w-lg mx-auto mb-8">
              {t("aiSearch.emptySubtitle")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-3xl mx-auto">
              {exampleQueries.map((example) => (
                <button
                  key={example}
                  onClick={() => handleExampleClick(example)}
                  className="p-4 bg-white rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all text-left group"
                >
                  <span className="text-lg mb-1 block">💬</span>
                  <span className="text-sm text-gray-600 group-hover:text-secondary transition-colors">{example}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
