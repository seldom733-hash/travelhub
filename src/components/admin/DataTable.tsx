"use client";

import { ReactNode, useState, useMemo } from "react";
import { useI18n } from "@/lib/i18n-context";

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  searchPlaceholder?: string;
  pageSize?: number;
}

export default function DataTable<T extends Record<string, any>>({
  columns, data, loading, emptyMessage, onRowClick, searchPlaceholder, pageSize = 20
}: DataTableProps<T>) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  const filteredData = useMemo(() => {
    let result = data;
    if (search && searchPlaceholder) {
      const q = search.toLowerCase();
      result = result.filter(row => Object.values(row).some(v => String(v).toLowerCase().includes(q)));
    }
    if (sortKey) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortKey] ?? "";
        const bVal = b[sortKey] ?? "";
        const cmp = typeof aVal === "number" ? aVal - bVal : String(aVal).localeCompare(String(bVal));
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return result;
  }, [data, search, sortKey, sortDir]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const pagedData = filteredData.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="space-y-4">
      {searchPlaceholder && (
        <div className="relative">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:border-blue-400 focus:ring-0 focus:bg-white outline-none transition-all"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">{t("admin.dataTable.loading")}</p>
        </div>
      ) : pagedData.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-sm text-gray-500">{emptyMessage || t("admin.dataTable.noData")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {columns.map(col => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable && handleSort(col.key)}
                    className={`text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pb-3 px-4 ${col.sortable ? "cursor-pointer hover:text-gray-600" : ""} ${col.className || ""}`}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pagedData.map((row, i) => (
                <tr
                  key={i}
                  onClick={() => onRowClick?.(row)}
                  className={`hover:bg-gray-50/80 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
                >
                  {columns.map(col => (
                    <td key={col.key} className={`py-3 px-4 text-sm ${col.className || ""}`}>
                      {col.render ? col.render(row) : String(row[col.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {filteredData.length} {t("admin.dataTable.records")} • {t("admin.dataTable.page")} {page + 1} {t("admin.dataTable.of")} {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-all"
            >
              {t("admin.dataTable.back")}
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = page < 3 ? i : page - 2 + i;
              if (p >= totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 text-xs font-medium rounded-lg transition-all ${
                    p === page ? "bg-blue-500 text-white shadow-md shadow-blue-500/25" : "hover:bg-gray-50 text-gray-600"
                  }`}
                >
                  {p + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-all"
            >
              {t("admin.dataTable.next")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
