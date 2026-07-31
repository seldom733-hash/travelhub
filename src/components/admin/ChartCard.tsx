"use client";

import { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
  noPadding?: boolean;
}

export default function ChartCard({ title, subtitle, children, className = "", actions, noPadding = false }: ChartCardProps) {
  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-[20px] border border-gray-100/80 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      
      {/* Content */}
      <div className={noPadding ? "" : "px-6 pb-5"}>
        {children}
      </div>
    </div>
  );
}
