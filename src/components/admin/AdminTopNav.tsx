"use client";

import { useState, useEffect, ReactNode } from "react";
import { useI18n } from "@/lib/i18n-context";

interface AdminTopNavProps {
  title: string;
  subtitle?: string;
  lastUpdated?: Date | null;
  isRefreshing?: boolean;
  autoRefresh?: boolean;
  onToggleAutoRefresh?: () => void;
  onRefresh?: () => void;
  actions?: ReactNode;
}

export default function AdminTopNav({
  title, subtitle, lastUpdated, isRefreshing, autoRefresh, onToggleAutoRefresh, onRefresh, actions
}: AdminTopNavProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const { t } = useI18n();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100/80 sticky top-0 z-30">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left: Title */}
        <div>
          <h1 className="text-lg font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>

        {/* Center: Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <input
              type="text"
              placeholder={t("admin.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-blue-400 focus:ring-0 focus:bg-white outline-none transition-all"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {actions}
          
          {/* Refresh controls */}
          {lastUpdated && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className={`inline-block w-2 h-2 rounded-full ${isRefreshing ? "bg-emerald-400 animate-pulse" : "bg-emerald-400"}`} />
                {isRefreshing ? t("admin.updating") : currentTime.toLocaleTimeString("ru-RU")}
              </div>
              {onToggleAutoRefresh && (
                <button
                  onClick={onToggleAutoRefresh}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    autoRefresh ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {autoRefresh ? `⏸ ${t("admin.autoRefresh")}` : `▶ ${t("admin.autoRefresh")}`}
                </button>
              )}
              {!autoRefresh && onRefresh && (
                <button onClick={onRefresh} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-medium transition-all">
                  {t("admin.refresh")}
                </button>
              )}
            </div>
          )}

          {/* Date */}
          <div className="hidden lg:block text-xs text-gray-400 font-medium">
            {currentTime.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "short" })}
          </div>

          {/* Notifications */}
          <button className="relative w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-lg transition-colors">
            🔔
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold">3</span>
          </button>

          {/* Profile */}
          <button className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20 hover:shadow-xl hover:scale-105 transition-all">
            A
          </button>
        </div>
      </div>
    </div>
  );
}
