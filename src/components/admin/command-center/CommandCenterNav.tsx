"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { ADMIN_MENU, AdminMenuSection } from "./adminMenu";

const SECTION_ICONS: Record<string, string> = {
  home: "🏠",
  analytics: "📈",
  sales: "💰",
  bookings: "📑",
  orders: "📦",
  catalog: "🧳",
  content: "📝",
  users: "👥",
  finance: "💳",
  marketing: "📢",
  loyalty: "⭐",
  support: "🎧",
  reports: "📊",
  calendar: "📅",
  documents: "📁",
  integrations: "🔌",
  system: "🖥",
  ai: "🤖",
  settings: "⚙",
  logout: "🚪",
};

// Static Tailwind grid classes for the mega-dropdown columns
const GRID_COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

// Estimated width of the "..." overflow button (reserved during measurement)
const MORE_RESERVE = 44;

interface CommandCenterNavProps {
  onLogout: () => void;
}

export default function CommandCenterNav({ onLogout }: CommandCenterNavProps) {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [moreExpanded, setMoreExpanded] = useState<string | null>(null);
  // null = not measured yet → show everything on first paint
  const [visibleCount, setVisibleCount] = useState<number | null>(null);
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const logoutRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const widthsRef = useRef<number[]>([]);

  const sections = ADMIN_MENU.filter((s) => s.id !== "logout");
  const hasOverflow = visibleCount !== null && visibleCount < sections.length;
  const overflowSections = hasOverflow ? sections.slice(visibleCount) : [];

  // Measure how many menu items fit without scrolling; the rest go into "⋯"
  useLayoutEffect(() => {
    const measure = () => {
      const row = rowRef.current;
      if (!row) return;
      const containerW = row.clientWidth;
      if (containerW === 0) return;
      const logoutW = logoutRef.current?.offsetWidth ?? 0;

      // Cache item widths once (all items are visible during first measure)
      if (widthsRef.current.length !== sections.length) {
        widthsRef.current = sections.map((_, i) => itemRefs.current[i]?.offsetWidth ?? 100);
      }
      const widths = widthsRef.current;
      const reserved = MORE_RESERVE + logoutW + 16;
      let used = 0;
      let count = 0;
      for (let i = 0; i < widths.length; i++) {
        const w = widths[i];
        const gap = count > 0 ? 2 : 0;
        if (used + w + gap + reserved > containerW) break;
        used += w + gap;
        count++;
      }
      setVisibleCount((prev) => (prev === count ? prev : count));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (rowRef.current) ro.observe(rowRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenSection(null);
        setMobileOpen(false);
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const openWithDelay = (id: string | null) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (id === null) {
      closeTimer.current = setTimeout(() => setOpenSection(null), 120);
    } else {
      setOpenSection(id);
    }
  };

  const isActiveSection = (s: AdminMenuSection) => {
    if (s.id === "home") return pathname === "/admin";
    if (s.href) return pathname.startsWith(s.href);
    return false;
  };

  const active = ADMIN_MENU.find((s) => s.id === openSection);
  // Columns for the mega-dropdown
  const columnCount = active?.items
    ? active.items.length > 16 ? 4 : active.items.length > 10 ? 3 : active.items.length > 6 ? 2 : 1
    : 1;
  const gridClass = GRID_COLS[columnCount] || "grid-cols-1";

  return (
    <div ref={navRef} className="relative z-30 bg-white/90 backdrop-blur-xl border-b border-gray-200/70 shadow-sm">
      <div className="flex items-center h-12 max-w-[1400px] mx-auto px-2 lg:px-4">
        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600 shrink-0"
          aria-label="Разделы"
        >
          <span className="text-lg">{mobileOpen ? "✕" : "☰"}</span>
        </button>

        {/* Desktop menu — no scrolling; overflow goes into "⋯" */}
        <div
          ref={rowRef}
          className="hidden lg:flex flex-1 items-center gap-0.5 h-12 overflow-hidden min-w-0"
        >
          {sections.map((section, i) => {
            const isActive = isActiveSection(section);
            const isOpen = openSection === section.id;
            const hidden = visibleCount !== null && i >= visibleCount;
            return (
              <a
                key={section.id}
                ref={(el) => { itemRefs.current[i] = el; }}
                href={section.href || "#"}
                onMouseEnter={() => { openWithDelay(section.id); setMoreOpen(false); }}
                onMouseLeave={() => openWithDelay(null)}
                onClick={(e) => {
                  if (!section.href && section.items) {
                    e.preventDefault();
                    setOpenSection(isOpen ? null : section.id);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 h-10 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                  isActive || isOpen
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                } ${hidden ? "hidden" : ""}`}
              >
                <span className="text-base">{SECTION_ICONS[section.id]}</span>
                <span>{section.label}</span>
                {section.items && <span className={`text-[9px] text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>}
              </a>
            );
          })}

          {/* "⋯" overflow button */}
          {hasOverflow && (
            <button
              onClick={() => { setMoreOpen(!moreOpen); setOpenSection(null); }}
              onMouseEnter={() => { setMoreOpen(true); setOpenSection(null); }}
              onMouseLeave={() => { closeTimer.current = setTimeout(() => setMoreOpen(false), 150); }}
              className={`flex items-center justify-center w-10 h-10 rounded-xl text-lg font-bold transition-all whitespace-nowrap shrink-0 ${
                moreOpen ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
              }`}
              aria-label="Ещё разделы"
              title="Ещё разделы"
            >
              ⋯
            </button>
          )}

          {/* Logout — always visible */}
          <button
            ref={logoutRef}
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 h-10 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all whitespace-nowrap ml-auto shrink-0"
          >
            <span className="text-base">{SECTION_ICONS.logout}</span>
            <span>{ADMIN_MENU[ADMIN_MENU.length - 1].label}</span>
          </button>
        </div>
      </div>

      {/* Desktop mega-dropdown — rendered OUTSIDE the overflow container so it is not clipped */}
      {active?.items && (
        <div
          className="hidden lg:block absolute left-0 right-0 top-full z-50 px-4"
          onMouseEnter={() => openWithDelay(active.id)}
          onMouseLeave={() => openWithDelay(null)}
        >
          <div className="max-w-[1400px] mx-auto">
            <div
              className="bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-gray-200/60 p-3 animate-slide-in-left"
              style={{ width: columnCount > 1 ? `${columnCount * 210}px` : undefined }}
            >
              <div className="flex items-center gap-2 px-3 py-2 mb-1 border-b border-gray-50">
                <span className="text-base">{SECTION_ICONS[active.id]}</span>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{active.label}</span>
              </div>
              <div className={`grid gap-0.5 ${gridClass}`}>
                {active.items.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] text-gray-600 hover:bg-blue-50/60 hover:text-blue-700 transition-colors whitespace-nowrap"
                  >
                    <span className="w-1 h-1 rounded-full bg-blue-300 shrink-0" />
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* "⋯" overflow panel — the rest of the menu */}
      {moreOpen && overflowSections.length > 0 && (
        <div
          className="hidden lg:block absolute right-0 top-full z-50 px-4 w-80"
          onMouseEnter={() => { if (closeTimer.current) clearTimeout(closeTimer.current); setMoreOpen(true); }}
          onMouseLeave={() => setMoreOpen(false)}
        >
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-gray-200/60 p-2 animate-slide-in-left max-h-[70vh] overflow-y-auto">
            <div className="flex items-center gap-2 px-3 py-2 mb-1 border-b border-gray-50">
              <span className="text-base">⋯</span>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Все разделы</span>
            </div>
            {overflowSections.map((section) => {
              if (section.href) {
                return (
                  <a
                    key={section.id}
                    href={section.href}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-700 hover:bg-blue-50/60 hover:text-blue-700 transition-colors"
                  >
                    <span className="text-base">{SECTION_ICONS[section.id]}</span>
                    <span className="flex-1">{section.label}</span>
                  </a>
                );
              }
              const isExpanded = moreExpanded === section.id;
              return (
                <div key={section.id} className="border-b border-gray-50 last:border-0">
                  <button
                    onClick={() => setMoreExpanded(isExpanded ? null : section.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-gray-700 hover:bg-blue-50/60 hover:text-blue-700 transition-colors"
                  >
                    <span className="text-base">{SECTION_ICONS[section.id]}</span>
                    <span className="flex-1 text-left">{section.label}</span>
                    <span className={`text-[9px] text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}>▼</span>
                  </button>
                  {isExpanded && section.items && (
                    <div className="bg-gray-50/70 rounded-xl px-3 py-1.5 mb-1.5 ml-9">
                      {section.items.map((item) => (
                        <a
                          key={item.label}
                          href={item.href}
                          className="flex items-center gap-2 py-1.5 text-[12px] text-gray-600 hover:text-blue-700 transition-colors"
                        >
                          <span className="w-1 h-1 rounded-full bg-blue-300 shrink-0" />
                          {item.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile dropdown panel */}
      {mobileOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-xl max-h-[70vh] overflow-y-auto z-40">
          {ADMIN_MENU.map((section) => {
            if (section.id === "logout") {
              return (
                <button
                  key={section.id}
                  onClick={() => { setMobileOpen(false); onLogout(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <span className="text-lg">{SECTION_ICONS[section.id]}</span>
                  {section.label}
                </button>
              );
            }
            const isExpanded = mobileExpanded === section.id;
            return (
              <div key={section.id} className="border-b border-gray-50">
                <a
                  href={section.href || "#"}
                  onClick={(e) => {
                    if (!section.href && section.items) {
                      e.preventDefault();
                      setMobileExpanded(isExpanded ? null : section.id);
                    }
                  }}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg">{SECTION_ICONS[section.id]}</span>
                  <span className="flex-1">{section.label}</span>
                  {section.items && <span className={`text-[9px] text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}>▼</span>}
                </a>
                {section.items && isExpanded && (
                  <div className="bg-gray-50/70 px-4 py-2">
                    {section.items.map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 py-2 pl-8 text-[13px] text-gray-600 hover:text-blue-700 transition-colors"
                      >
                        <span className="w-1 h-1 rounded-full bg-blue-300" />
                        {item.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
