"use client";

import { useState, useCallback, useMemo } from "react";
import { useI18n } from "@/lib/i18n-context";
import { filterConfigs, type ServiceCategory, type FilterDefinition } from "./filterConfig";
import CountryFilter from "./CountryFilter";
import CityFilter from "./CityFilter";

export interface FilterState {
  [key: string]: string[] | [number, number] | number | string;
}

interface FilterSidebarProps {
  category: ServiceCategory;
  onFilterChange?: (filters: FilterState) => void;
  onSortChange?: (sort: string) => void;
}

export default function FilterSidebar({ category, onFilterChange, onSortChange }: FilterSidebarProps) {
  const { t } = useI18n();
  const filters = useMemo(() => filterConfigs[category] || [], [category]);
  const priceFilter = useMemo(() => filters.find(f => f.type === "range"), [filters]);

  const [expandedFilters, setExpandedFilters] = useState<string[]>(filters.map(f => f.id));
  const [selectedValues, setSelectedValues] = useState<Record<string, string[]>>({});
  const [priceRange, setPriceRange] = useState<[number, number]>([priceFilter?.min || 0, priceFilter?.max || 5000]);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState("popular");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.values(selectedValues).forEach(arr => { if (arr.length > 0) count += arr.length; });
    if (selectedRating > 0) count++;
    count += selectedCountries.length;
    count += selectedCities.length;
    const priceFilter = filters.find(f => f.type === "range");
    if (priceFilter && (priceRange[0] > (priceFilter.min || 0) || priceRange[1] < (priceFilter.max || 5000))) count++;
    return count;
  }, [selectedValues, selectedRating, priceRange, selectedCountries, selectedCities, filters]);

  const sortOptions = [
    { value: "popular", label: t("filter.sortByPopular") },
    { value: "price_asc", label: t("filter.sortByPriceAsc") },
    { value: "price_desc", label: t("filter.sortByPriceDesc") },
    { value: "rating", label: t("filter.sortByRating") },
    { value: "newest", label: t("filter.sortByNewest") },
  ];

  const toggleFilter = (id: string) => {
    setExpandedFilters(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const toggleArrayItem = useCallback((filterId: string, item: string) => {
    setSelectedValues(prev => {
      const arr = prev[filterId] || [];
      return { ...prev, [filterId]: arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item] };
    });
  }, []);

  const resetAll = useCallback(() => {
    setPriceRange([priceFilter?.min || 0, priceFilter?.max || 5000]);
    setSelectedRating(0);
    setSelectedValues({});
    setSelectedCountries([]);
    setSelectedCities([]);
    onFilterChange?.({});
  }, [priceFilter, onFilterChange]);

  const resetFilter = useCallback((filterId: string) => {
    setSelectedValues(prev => {
      const next = { ...prev };
      delete next[filterId];
      return next;
    });
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setSortBy(value);
    onSortChange?.(value);
  }, [onSortChange]);

  const handleCountriesChange = useCallback((countries: string[]) => {
    setSelectedCountries(countries);
  }, []);

  const renderFilterOption = (filter: FilterDefinition, option: { label: string; value: string }) => {
    const isI18nKey = option.label.startsWith("filter.");
    const label = isI18nKey ? t(option.label) : option.label;
    const checked = (selectedValues[filter.id] || []).includes(option.value);

    if (filter.type === "checkbox") {
      return (
        <label key={option.value} className="flex items-center gap-2 cursor-pointer group">
          <input type="checkbox" checked={checked} onChange={() => toggleArrayItem(filter.id, option.value)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
          <span className="text-sm text-gray-600 group-hover:text-secondary transition-colors">{label}</span>
        </label>
      );
    }

    if (filter.type === "radio") {
      return (
        <label key={option.value} className="flex items-center gap-2 cursor-pointer group">
          <input type="radio" name={filter.id} checked={checked} onChange={() => toggleArrayItem(filter.id, option.value)} className="w-4 h-4 border-gray-300 text-primary focus:ring-primary" />
          <span className="text-sm text-gray-600 group-hover:text-secondary transition-colors">{label}</span>
        </label>
      );
    }

    return null;
  };

  const renderFilterContent = (filter: FilterDefinition) => {
    switch (filter.type) {
      case "checkbox":
      case "radio":
        return filter.options ? (
          <div className="space-y-2">
            {filter.options.map(opt => renderFilterOption(filter, opt))}
          </div>
        ) : null;

      case "country":
        return (
          <CountryFilter
            serviceType={category.toUpperCase()}
            selectedCountries={selectedCountries}
            onCountriesChange={handleCountriesChange}
          />
        );

      case "city":
        return (
          <CityFilter
            selectedCountries={selectedCountries}
            selectedCities={selectedCities}
            onCitiesChange={setSelectedCities}
          />
        );

      case "range":
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input type="number" value={priceRange[0]} onChange={e => setPriceRange([Number(e.target.value), priceRange[1]])} className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:border-primary outline-none bg-white text-gray-900 placeholder:text-gray-400" placeholder={t("filter.from")} />
              <span className="text-gray-400">—</span>
              <input type="number" value={priceRange[1]} onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])} className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm focus:border-primary outline-none bg-white text-gray-900 placeholder:text-gray-400" placeholder={t("filter.to")} />
            </div>
            <input type="range" min={filter.min || 0} max={filter.max || 5000} value={priceRange[1]} onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])} className="w-full accent-primary" />
          </div>
        );

      case "rating":
        return (
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star} onClick={() => setSelectedRating(star === selectedRating ? 0 : star)} className={`text-xl transition-all hover:scale-110 ${star <= selectedRating ? "text-star" : "text-gray-300"}`}>★</button>
            ))}
            <span className="text-sm text-gray-500 ml-2">{t("filter.andAbove")}</span>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-secondary text-lg">{t("filter.title")}</h3>
          {activeFilterCount > 0 && (
            <span className="w-6 h-6 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </div>
        <button onClick={resetAll} className="text-sm text-primary font-medium hover:text-primary-dark transition-colors">
          {t("filter.resetAll")}
        </button>
      </div>

      {/* Sort */}
      <div className="mb-6 pb-4 border-b border-gray-100">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t("filter.sortBy")}</label>
        <select value={sortBy} onChange={e => handleSortChange(e.target.value)} className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:border-primary outline-none bg-white text-gray-900 appearance-none cursor-pointer">
          {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </div>

      {/* Filters */}
      <div className="space-y-1">
        {filters.map(filter => (
          <div key={filter.id} className="border-b border-gray-50 last:border-0">
            {filter.type === "country" || filter.type === "city" ? (
              <div className="py-3">
                <p className="text-sm font-semibold text-secondary mb-2">{t(filter.i18nKey)}</p>
                {renderFilterContent(filter)}
              </div>
            ) : (
              <>
                <button onClick={() => toggleFilter(filter.id)} className="w-full flex items-center justify-between py-3 text-sm font-semibold text-secondary hover:text-primary transition-colors">
                  <span className="flex items-center gap-2">
                    {t(filter.i18nKey)}
                    {(selectedValues[filter.id]?.length || 0) > 0 && (
                      <span className="w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {selectedValues[filter.id]?.length}
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    {(selectedValues[filter.id]?.length || 0) > 0 && (
                      <span onClick={(e) => { e.stopPropagation(); const next = { ...selectedValues }; delete next[filter.id]; setSelectedValues(next); onFilterChange?.({ ...next, _price: priceRange, _rating: selectedRating, _countries: selectedCountries, _cities: selectedCities }); }} className="text-xs text-gray-400 hover:text-danger transition-colors px-1">✕</span>
                    )}
                    <span className={`transition-transform duration-200 ${expandedFilters.includes(filter.id) ? "rotate-180" : ""}`}>▼</span>
                  </span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedFilters.includes(filter.id) ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
                  <div className="pb-4">
                    {renderFilterContent(filter)}
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <button onClick={() => onFilterChange?.({ ...selectedValues, _price: priceRange, _rating: selectedRating, _countries: selectedCountries, _cities: selectedCities })} className="w-full h-12 mt-6 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-primary/30">
        {t("filter.apply")}
      </button>
    </div>
  );
}
