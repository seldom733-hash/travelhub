"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";

interface RegionOption {
  label: string;
  value: string;
}

interface Country {
  name: string;
  count: number;
  available: boolean;
}

interface RegionCountryFilterProps {
  regions: RegionOption[];
  serviceType: string;
  selectedRegion: string;
  selectedCountry: string;
  onRegionChange: (region: string) => void;
  onCountryChange: (country: string) => void;
}

export default function RegionCountryFilter({
  regions,
  serviceType,
  selectedRegion,
  selectedCountry,
  onRegionChange,
  onCountryChange,
}: RegionCountryFilterProps) {
  const { t } = useI18n();
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch countries when region changes
  useEffect(() => {
    if (!selectedRegion) {
      setCountries([]);
      onCountryChange("");
      return;
    }

    const fetchCountries = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ type: serviceType, region: selectedRegion });
        const res = await fetch(`/api/countries?${params}`);
        const data = await res.json();
        setCountries(data.countries || []);
      } catch {
        setCountries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, [selectedRegion, serviceType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Parse region label: extract i18n key after "🌍 " prefix
  const getRegionLabel = (label: string) => {
    const parts = label.split(" ");
    const emoji = parts[0] || "🌍";
    const i18nKey = parts.slice(1).join(" ");
    return { emoji, text: i18nKey.startsWith("filter.") ? t(i18nKey) : label };
  };

  // All countries from the selected region
  const availableCountries = countries.filter(c => c.available);

  return (
    <div className="space-y-3">
      {/* Region Combobox */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🌍</span>
        <select
          value={selectedRegion}
          onChange={(e) => {
            onRegionChange(e.target.value);
            onCountryChange("");
          }}
          className="w-full h-10 pl-9 pr-8 rounded-lg border border-gray-200 text-sm focus:border-primary focus:ring-0 outline-none bg-white text-gray-900 appearance-none cursor-pointer"
        >
          <option value="">{t("common.all")}</option>
          {regions.map((region) => {
            const { emoji, text } = getRegionLabel(region.label);
            return (
              <option key={region.value} value={region.value}>
                {emoji} {text}
              </option>
            );
          })}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">▼</span>
      </div>

      {/* Country Combobox — only visible when region is selected */}
      {selectedRegion && (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🏳</span>
          {loading ? (
            <div className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-200 text-sm bg-gray-50 text-gray-400 flex items-center">
              <span className="inline-block animate-spin mr-2">⏳</span>
              {t("common.loading")}
            </div>
          ) : (
            <select
              value={selectedCountry}
              onChange={(e) => onCountryChange(e.target.value)}
              className="w-full h-10 pl-9 pr-8 rounded-lg border border-gray-200 text-sm focus:border-primary focus:ring-0 outline-none bg-white text-gray-900 appearance-none cursor-pointer"
            >
              <option value="">{t("common.all")}</option>
              {availableCountries.map((country) => (
                <option key={country.name} value={country.name}>
                  {country.name} ({country.count})
                </option>
              ))}
            </select>
          )}
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none">▼</span>
        </div>
      )}
    </div>
  );
}
