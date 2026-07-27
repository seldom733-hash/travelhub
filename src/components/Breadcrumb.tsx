"use client";

import { useI18n } from "@/lib/i18n-context";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  const { t } = useI18n();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://travelhub.com";

  // JSON-LD structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: t("serviceDetail.home"),
        item: baseUrl,
      },
      ...items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: item.label,
        ...(item.href ? { item: `${baseUrl}${item.href}` } : {}),
      })),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-500">
        <a href="/" className="hover:text-primary transition-colors">
          {t("serviceDetail.home")}
        </a>
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-2">
            <span>/</span>
            {item.href ? (
              <a href={item.href} className="hover:text-primary transition-colors truncate max-w-[200px]">
                {item.label}
              </a>
            ) : (
              <span className="text-secondary font-medium truncate max-w-[300px]">
                {item.label}
              </span>
            )}
          </span>
        ))}
      </nav>
    </>
  );
}
