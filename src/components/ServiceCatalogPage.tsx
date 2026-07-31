"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import FilterSidebar from "@/components/FilterSidebar";
import ServiceCard from "@/components/ServiceCard";
import type { Service } from "@/components/ServiceCard";
import { useI18n } from "@/lib/i18n-context";
import { buildFilterParams } from "@/lib/buildFilterParams";
import type { FilterState } from "@/components/FilterSidebar";
import type { ProviderInfo } from "@/lib/types";
import { getProviderName } from "@/lib/types";
import { flagMap } from "@/lib/flags";
import Pagination from "@/components/Pagination";
import Breadcrumb from "@/components/Breadcrumb";
import MobileDrawer from "@/components/MobileDrawer";
import ServiceMap from "@/components/ServiceMap";

type ViewMode = "cards" | "list" | "map";

export interface ServiceCatalogConfig {
  serviceType: string;
  filterCategory: string;
  heroGradient: string;
  heroIcon: string;
  heroTitleKey: string;
  heroSubtitleKey: string;
  emptyIcon: string;
  emptyTextKey: string;
  defaultImage: string;
  priceUnitKey: string;
  defaultFlag?: string;
  skeletonCount?: number;
}

export interface ServiceCatalogInitialData {
  items: Service[];
  totalCount: number;
  totalPages: number;
  facets?: Record<string, string[]> | null;
  rawServices?: Record<string, unknown>[];
  extra?: any;
}

export interface ServiceCatalogPageProps {
  config: ServiceCatalogConfig;
  /**
   * Custom URL params builder. If not provided, uses buildFilterParams.
   * Note: this is read via ref, so parent can define it inline without causing re-fetches.
   */
  buildParams?: (filterState: FilterState, page: number, sortBy: string) => URLSearchParams;
  /**
   * Extra params to pass to buildFilterParams (e.g. { tourCategory }).
   * Note: this is read via ref, so parent can pass new objects without causing re-fetches.
   */
  extraParams?: Record<string, string>;
  mapService?: (s: Record<string, unknown>, t: (key: string) => string) => Service;
  aboveGrid?: React.ReactNode;
  emptyContent?: React.ReactNode;
  gridClassName?: string;
  showViewToggle?: boolean;
  showCount?: boolean;
  initialFilterState?: FilterState;
  /**
   * Pre-fetched data from the server for SSR. When provided,
   * the component renders immediately without showing a loading skeleton.
   */
  initialData?: ServiceCatalogInitialData;
  /**
   * Called with the full API response after each successful fetch.
   * Useful for pages that need extra data from the response (e.g. tourCounts).
   */
  onDataLoaded?: (data: any) => void;
}

export default function ServiceCatalogPage({
  config,
  buildParams,
  extraParams,
  mapService,
  aboveGrid,
  emptyContent,
  gridClassName,
  showViewToggle = true,
  showCount = true,
  initialFilterState,
  initialData,
  onDataLoaded,
}: ServiceCatalogPageProps) {
  const { t } = useI18n();
  const [items, setItems] = useState<Service[]>(initialData?.items || []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialData?.totalPages || 1);
  const [totalCount, setTotalCount] = useState(initialData?.totalCount || 0);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [sortBy, setSortBy] = useState("popular");
  const [filterState, setFilterState] = useState<FilterState>(initialFilterState || {});
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const [facets, setFacets] = useState<Record<string, string[]> | null>(initialData?.facets || null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [rawServices, setRawServices] = useState<Record<string, unknown>[]>(initialData?.rawServices || []);
  const initialFetchDoneRef = useRef(!!initialData);



  const PAGE_LIMIT = 9;
  const skeletonCount = config.skeletonCount || PAGE_LIMIT;

  // Use refs for callbacks to avoid re-fetch on every render
  const buildParamsRef = useRef(buildParams);
  buildParamsRef.current = buildParams;
  const extraParamsRef = useRef(extraParams);
  extraParamsRef.current = extraParams;
  const mapServiceRef = useRef(mapService);
  mapServiceRef.current = mapService;
  const onDataLoadedRef = useRef(onDataLoaded);
  onDataLoadedRef.current = onDataLoaded;

  // Retry helper: bumps trigger to re-run fetch
  const retry = useCallback(() => {
    setError("");
    setFetchTrigger((n) => n + 1);
  }, []);

  useEffect(() => {
    // Skip initial fetch if SSR data was provided
    if (initialFetchDoneRef.current && fetchTrigger === 0) {
      initialFetchDoneRef.current = false;
      return;
    }

    const controller = new AbortController();

    const fetchItems = async () => {
      try {
        setLoading(true);
        const bp = buildParamsRef.current;
        const ep = extraParamsRef.current;
        const ms = mapServiceRef.current;

        const params = bp
          ? bp(filterState, page, sortBy)
          : buildFilterParams(filterState, { type: config.serviceType, page, sortBy, extra: ep });
        const res = await fetch(`/api/services?${params}`, { signal: controller.signal });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || t("catalog.loadError"));

        const mapped: Service[] = ms
          ? data.services.map((s: Record<string, unknown>) => ms(s, t))
          : data.services.map((s: Record<string, unknown>) => defaultMapService(s, config, t));

        setItems(mapped);
        setRawServices(data.services || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotalCount(data.pagination?.total || mapped.length);
        if (data.facets) setFacets(data.facets);
        onDataLoadedRef.current?.(data);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : t("catalog.loadError"));
      } finally {
        setLoading(false);
      }
    };
    fetchItems();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortBy, filterState, config.serviceType, fetchTrigger, t]);

  // JSON-LD ItemList for Google rich snippets
  const jsonLd = items.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t(config.heroTitleKey),
    numberOfItems: totalCount,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: (page - 1) * PAGE_LIMIT + index + 1,
      item: {
        "@type": "Product",
        name: item.name,
        image: item.image,
        url: `${typeof window !== "undefined" ? window.location.origin : "https://travelhub.com"}/${config.serviceType.toLowerCase()}s/${item.id}`,
        aggregateRating: item.reviews > 0 ? {
          "@type": "AggregateRating",
          ratingValue: item.rating,
          reviewCount: item.reviews,
          bestRating: 5,
          worstRating: 1,
        } : undefined,
        offers: {
          "@type": "Offer",
          price: item.price,
          priceCurrency: "AZN",
          availability: "https://schema.org/InStock",
        },
      },
    })),
  } : null;

  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50">
      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumb
          items={[{ label: t(config.heroTitleKey) }]}
        />
      </div>

      {/* Hero Banner */}
      <div className={`bg-gradient-to-r ${config.heroGradient} text-white py-12`}>
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">{config.heroIcon} {t(config.heroTitleKey)}</h1>
          <p className="text-white/80">{t(config.heroSubtitleKey)}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {aboveGrid}

        {/* Mobile filter button */}
        <div className="lg:hidden mb-4">
          <button onClick={() => setMobileFilterOpen(true)} className="flex items-center gap-2 h-11 px-5 bg-white border border-gray-200 rounded-xl font-medium text-secondary hover:border-primary hover:text-primary transition-all shadow-sm">
            <span className="text-lg">🔍</span>
            {t("filter.title")}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <FilterSidebar category={config.filterCategory as any} onFilterChange={setFilterState} onSortChange={setSortBy} availableFilters={facets ? Object.keys(facets).filter(k => (facets[k]?.length || 0) > 0) : undefined} />
          </div>

          <div className="lg:col-span-3">
            {/* Toolbar */}
            {!loading && items.length > 0 && (
              <div className="flex items-center justify-between mb-6">
                {showCount ? (
                  <p className="text-sm text-gray-500">
                    {t("filter.resultsCount")} <span className="font-semibold text-secondary">{totalCount}</span>
                  </p>
                ) : <div />}
                {showViewToggle && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setViewMode("cards")} className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${viewMode === "cards" ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-400 hover:border-primary hover:text-primary"}`}>🃏</button>
                    <button onClick={() => setViewMode("list")} className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${viewMode === "list" ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-400 hover:border-primary hover:text-primary"}`}>☰</button>
                    <button onClick={() => setViewMode("map")} className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${viewMode === "map" ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-400 hover:border-primary hover:text-primary"}`}>🗺</button>
                  </div>
                )}
              </div>
            )}

            {/* Loading */}
            {loading ? (
              <div className={gridClassName || (viewMode === "cards" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4")}>
                {[...Array(skeletonCount)].map((_, i) => (
                  <div key={i} className={`bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse ${viewMode === "list" ? "flex" : ""}`}>
                    <div className={`${viewMode === "list" ? "w-48 h-32 shrink-0" : "h-48"} bg-gray-200`} />
                    <div className="p-4 space-y-3 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <div className="text-5xl mb-4">❌</div>
                <p className="text-secondary font-semibold mb-2">{t("common.error")}</p>
                <p className="text-gray-500 mb-6">{error}</p>
                <button onClick={retry} className="h-11 px-6 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-all">
                  {t("common.retry")}
                </button>
              </div>
            ) : items.length === 0 ? (
              emptyContent || (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <div className="text-6xl mb-4">{config.emptyIcon}</div>
                  <h2 className="text-xl font-bold text-secondary mb-2">{t("filter.noResults")}</h2>
                  <p className="text-gray-500 mb-6">{t(config.emptyTextKey)}</p>
                  <div className="flex items-center justify-center gap-3">
                    <button onClick={() => { setFilterState({}); setSortBy("popular"); setPage(1); }} className="h-11 px-6 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-all">
                      {t("filter.clearFilters")}
                    </button>
                    <a href="/" className="h-11 px-6 border-2 border-gray-200 text-secondary rounded-xl font-medium hover:border-primary hover:text-primary transition-all">
                      {t("common.backArrow")}
                    </a>
                  </div>
                </div>
              )
            ) : (
              <>
                {viewMode === "map" ? (
                  <ServiceMap
                    services={rawServices.map((s) => ({
                      id: String(s.id),
                      title: String(s.title),
                      lat: (s.latitude as number) || 0,
                      lng: (s.longitude as number) || 0,
                      price: Number(s.discountPrice || s.price),
                      rating: Number(s.rating) || 0,
                      image: (s.images as string[])?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&q=60",
                      city: String(s.city || ""),
                      country: String(s.country || ""),
                      type: String(s.type || ""),
                    }))}
                    height="600px"
                  />
                ) : (
                <div className={gridClassName || (viewMode === "cards" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4")}>
                  {items.map((item) => (
                    <ServiceCard key={String(item.id)} service={item} />
                  ))}
                </div>
                )}

                <Pagination
                  page={page}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  limit={9}
                  onPageChange={setPage}
                  showCount={showCount}
                />
              </>
            )}
          </div>
        </div>
      </div>
      {/* Mobile filter drawer */}
      <MobileDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        title={t("filter.title")}
        peekHint={t('filter.swipeToOpen')}
      >
        <FilterSidebar
          category={config.filterCategory as any}
          onFilterChange={(f) => { setFilterState(f); setMobileFilterOpen(false); }}
          onSortChange={setSortBy}
          filterState={filterState}
          noSticky
          availableFilters={facets ? Object.keys(facets).filter(k => (facets[k]?.length || 0) > 0) : undefined}
        />
      </MobileDrawer>
    </div>
  );
}

/** Default service mapping used when no custom mapService is provided */
function defaultMapService(
  s: Record<string, unknown>,
  config: ServiceCatalogConfig,
  t: (key: string) => string,
): Service {
  return {
    id: s.id as string,
    name: s.title as string,
    image: (typeof s.images === "string" ? s.images.split(",").filter(Boolean) : s.images as string[])?.[0] || config.defaultImage,
    city: s.city as string,
    country: s.country as string,
    flag: flagMap[s.countryCode as string] || config.defaultFlag || "🌍",
    type: s.type as string,
    price: Number(s.discountPrice || s.price),
    priceUnit: t(config.priceUnitKey),
    rating: s.rating as number,
    reviews: (s._count as { reviews: number })?.reviews || 0,
    tags: s.isHot ? ["🔥"] : undefined,
    amenities: (s.amenities as { name: string }[])?.map((a) => a.name).slice(0, 3),
    providerName: getProviderName(s.provider as ProviderInfo),
    duration: s.duration as string | null,
  };
}
