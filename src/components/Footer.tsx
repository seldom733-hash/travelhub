"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n-context";

interface Stats {
  services: { tours: number; hotels: number; sanatoriums: number; excursions: number; flights: number; trains: number; guides: number; photographers: number; transfers: number };
  users: number;
  partners: number;
}

export default function Footer() {
  const { t } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {});
  }, []);

  const totalServices = stats
    ? stats.services.tours + stats.services.hotels + stats.services.sanatoriums + stats.services.excursions + stats.services.flights + stats.services.trains + stats.services.guides + stats.services.photographers + stats.services.transfers
    : 0;

  const companyLinks = [
    { labelKey: "footer.about", href: "/about" },
    { labelKey: "footer.blog", href: "/blog" },
    { labelKey: "footer.contacts", href: "/contacts" },
  ];

  const categoryLinks = [
    { labelKey: "footer.tours", href: "/tours", count: stats?.services.tours },
    { labelKey: "footer.hotels", href: "/hotels", count: stats?.services.hotels },
    { labelKey: "footer.sanatoriums", href: "/sanatoriums", count: stats?.services.sanatoriums },
    { labelKey: "footer.excursions", href: "/excursions", count: stats?.services.excursions },
  ];

  const partnerLinks = [
    { labelKey: "footer.commissions", href: "/partners/commissions" },
    { labelKey: "footer.api", href: "/partners/api" },
    { labelKey: "footer.docs", href: "/partners/docs" },
  ];

  const supportLinks = [
    { labelKey: "footer.faq", href: "/faq" },
    { labelKey: "footer.returns", href: "/returns" },
    { labelKey: "footer.policy", href: "/policy" },
  ];

  const allSections = [
    { titleKey: "footer.company", links: companyLinks },
    { titleKey: "footer.categories", links: categoryLinks },
    { titleKey: "footer.partners", links: partnerLinks },
    { titleKey: "footer.support", links: supportLinks },
  ];

  return (
    <footer className="bg-secondary text-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-12 pb-12 border-b border-white/10">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-primary mb-1">{totalServices.toLocaleString()}+</div>
              <div className="text-sm text-gray-400">{t("footer.services")}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-primary mb-1">{stats.users.toLocaleString()}+</div>
              <div className="text-sm text-gray-400">{t("footer.users")}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-primary mb-1">{stats.partners.toLocaleString()}+</div>
              <div className="text-sm text-gray-400">{t("footer.partnersCount")}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-primary mb-1">{stats.services.excursions.toLocaleString()}+</div>
              <div className="text-sm text-gray-400">{t("footer.excursions")}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-3 lg:col-span-1 mb-4 lg:mb-0">
            <a href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg">T</div>
              <span className="text-xl font-bold">Travel<span className="text-primary">Hub</span></span>
            </a>
            <p className="text-gray-400 text-sm mb-6 max-w-xs">{t("footer.brand")}</p>
            <div className="flex gap-3">
              {["facebook", "instagram", "twitter", "youtube"].map((social) => (
                <a key={social} href={`https://${social}.com/travelhub`} className="w-10 h-10 bg-white/10 hover:bg-primary rounded-xl flex items-center justify-center transition-colors" target="_blank" rel="noopener noreferrer">
                  <span className="text-sm">{social === "facebook" ? "f" : social === "instagram" ? "📷" : social === "twitter" ? "𝕏" : "▶"}</span>
                </a>
              ))}
            </div>
          </div>
          {allSections.map((section) => (
            <div key={section.titleKey}>
              <h4 className="font-semibold text-white mb-4">{t(section.titleKey)}</h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.labelKey}>
                    <a href={link.href} className="text-sm text-gray-400 hover:text-primary transition-colors">
                      {t(link.labelKey)}
                      {"count" in link && link.count != null && (
                        <span className="ml-1.5 text-[10px] text-gray-500">({link.count.toLocaleString()})</span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">{t("footer.copyright")}</p>
          <div className="flex items-center gap-6">
            <a href="/terms" className="text-sm text-gray-500 hover:text-white transition-colors">{t("footer.terms")}</a>
            <a href="/privacy" className="text-sm text-gray-500 hover:text-white transition-colors">{t("footer.privacy")}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
