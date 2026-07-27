export default function StructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://travelhub.com";

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TravelHub",
    url: baseUrl,
    description:
      "Единая платформа для путешествий. Туры, отели, авиабилеты, экскурсии, гиды и фотографы — всё в одном месте.",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+994-XX-XXX-XX-XX",
      contactType: "customer service",
      availableLanguage: ["Russian", "English", "Azerbaijani"],
    },
  };

  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: "TravelHub",
    url: baseUrl,
    description:
      "Единая платформа для бронирования путешествий. Туры, отели, авиабилеты, экскурсии, гиды, фотографы и трансферы.",
    address: {
      "@type": "PostalAddress",
      addressCountry: "AZ",
      addressLocality: "Baku",
    },
    priceRange: "$$",
    telephone: "+994-XX-XXX-XX-XX",
    email: "info@travelhub.az",
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TravelHub",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/ai-search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
    </>
  );
}
