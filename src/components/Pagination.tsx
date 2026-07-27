"use client";

import { useI18n } from "@/lib/i18n-context";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  limit?: number;
  onPageChange: (page: number) => void;
  showCount?: boolean;
}

/**
 * Generates an array of page numbers and ellipsis markers.
 * Shows: first page, current ± 2, last page, with "..." gaps.
 */
function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [];
  const left = Math.max(2, current - 2);
  const right = Math.min(total - 1, current + 2);

  // Always show page 1
  pages.push(1);

  // Ellipsis before middle range
  if (left > 2) pages.push("...");

  // Middle range (current ± 2)
  for (let i = left; i <= right; i++) {
    pages.push(i);
  }

  // Ellipsis after middle range
  if (right < total - 1) pages.push("...");

  // Always show last page
  pages.push(total);

  return pages;
}

export default function Pagination({
  page,
  totalPages,
  totalCount,
  limit = 9,
  onPageChange,
  showCount = true,
}: PaginationProps) {
  const { t } = useI18n();

  if (totalPages <= 1 && !showCount) return null;

  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-10">
          {/* First page */}
          <button
            onClick={() => onPageChange(1)}
            disabled={page === 1}
            className="w-10 h-10 rounded-lg border border-gray-200 text-gray-400 hover:border-primary hover:text-primary transition-colors disabled:opacity-40 text-xs font-bold"
            aria-label="Первая страница"
          >
            ⟨⟨
          </button>

          {/* Previous */}
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="w-10 h-10 rounded-lg border border-gray-200 text-gray-400 hover:border-primary hover:text-primary transition-colors disabled:opacity-40"
          >
            ←
          </button>

          {/* Page numbers */}
          {pageNumbers.map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="w-10 h-10 flex items-center justify-center text-gray-400 text-sm">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${
                  page === p
                    ? "bg-primary text-white shadow-md"
                    : "border border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
                }`}
              >
                {p}
              </button>
            )
          )}

          {/* Next */}
          <button
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="w-10 h-10 rounded-lg border border-gray-200 text-gray-600 hover:border-primary hover:text-primary transition-colors disabled:opacity-40"
          >
            →
          </button>

          {/* Last page */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages}
            className="w-10 h-10 rounded-lg border border-gray-200 text-gray-400 hover:border-primary hover:text-primary transition-colors disabled:opacity-40 text-xs font-bold"
            aria-label="Последняя страница"
          >
            ⟩⟩
          </button>
        </div>
      )}

      {showCount && (
        <p className="text-center text-sm text-gray-400 mt-4">
          {totalPages > 1
            ? `Страница ${page} из ${totalPages} · ${t("filter.showingOf")
                .replace("{shown}", String(Math.min(page * limit, totalCount)))
                .replace("{total}", String(totalCount))}`
            : t("filter.showingOf")
                .replace("{shown}", String(Math.min(page * limit, totalCount)))
                .replace("{total}", String(totalCount))}
        </p>
      )}
    </>
  );
}
