"use client";

import { ReactNode } from "react";

interface KpiCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  change?: number;
  changeLabel?: string;
  sub?: string;
  gradient?: string;
}

export default function KpiCard({ icon, label, value, change, changeLabel, sub, gradient = "from-blue-500 to-blue-600" }: KpiCardProps) {
  return (
    <div className="group relative bg-white/80 backdrop-blur-sm rounded-[20px] p-6 border border-gray-100/80 hover:border-blue-200/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500 ease-out overflow-hidden">
      {/* Subtle gradient accent */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-white text-xl shadow-lg shadow-blue-500/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${change >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
            <span>{change >= 0 ? "↑" : "↓"}</span>
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <div className="text-3xl font-bold text-gray-900 tracking-tight group-hover:text-blue-600 transition-colors duration-300">{value}</div>
        <div className="text-sm font-medium text-gray-500">{label}</div>
        {sub && <div className="text-xs text-gray-400">{sub}</div>}
        {changeLabel && <div className="text-xs text-gray-400 mt-1">{changeLabel}</div>}
      </div>
    </div>
  );
}
