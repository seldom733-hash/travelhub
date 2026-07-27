"use client";

import { useI18n } from "@/lib/i18n-context";

export default function Footer() {
  const { t } = useI18n();

  const companyLinks = [
    { labelKey: "footer.about", href: "/about" },
    { labelKey: "footer.blog", href: "/blog" },
    { labelKey: "footer.contacts", href: "/contacts" },
  ];

  const categoryLinks = [
    { labelKey: "footer.tours", href: "/tours" },
    { labelKey: "footer.hotels", href: "/hotels" },
    { labelKey: "footer.sanatoriums", href: "/sanatoriums" },
    { labelKey: "footer.excursions", href: "/excursions" },
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
                  <li key={link.labelKey}><a href={link.href} className="text-sm text-gray-400 hover:text-primary transition-colors">{t(link.labelKey)}</a></li>
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
