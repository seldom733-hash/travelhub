"use client";

import { ReactNode, useState } from "react";
import { useI18n } from "@/lib/i18n-context";

interface SidebarItem {
  icon: string;
  label: string;
  id: string;
  badge?: number;
  adminOnly?: boolean;
}

interface AdminSidebarProps {
  items: SidebarItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  collapsed?: boolean;
}

export default function AdminSidebar({ items, activeTab, onTabChange, collapsed = false }: AdminSidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { t } = useI18n();

  return (
    <div className={`sticky top-0 h-screen bg-white/80 backdrop-blur-xl border-r border-gray-100/80 flex flex-col transition-all duration-300 ${collapsed ? "w-[72px]" : "w-[260px]"}`}>
      {/* Logo */}
      <div className="p-5 border-b border-gray-100/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/25">
            T
          </div>
          {!collapsed && (
            <div>
              <div className="text-sm font-bold text-gray-900">TravelHub</div>
              <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{t("admin.adminPanel")}</div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          const isHovered = hoveredItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
              )}
              <span className="text-lg shrink-0">{item.icon}</span>
              {!collapsed && (
                <>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive ? "bg-white/20 text-white" : "bg-red-50 text-red-500"
                    }`}>
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100/80">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200">
          <span className="text-lg">🚪</span>
          {!collapsed && <span>{t("admin.logout")}</span>}
        </button>
      </div>
    </div>
  );
}
