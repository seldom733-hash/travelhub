import { useMemo } from "react";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  text: string;
  user: { firstName: string; lastName: string };
}

interface ServiceJsonLdProps {
  id: string;
  title: string;
  description: string;
  type: string;
  price: number;
  currency: string;
  discountPrice: number | null;
  city: string;
  country: string;
  images: string[];
  rating: number;
  reviewCount: number;
  reviews: Review[];
  provider: { firstName: string; lastName: string; companyName: string | null };
}

export default function ServiceJsonLd({
  id,
  title,
  description,
  type,
  price,
  currency,
  discountPrice,
  city,
  country,
  images,
  rating,
  reviewCount,
  reviews,
  provider,
}: ServiceJsonLdProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://travelhub.com";
  const route = type ? `${type.toLowerCase()}s` : "services";
  const url = `${baseUrl}/${route}/${id}`;
  const imageUrl = images?.[0] || "";

  const product: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    description: description?.slice(0, 5000),
    image: imageUrl,
    url,
    brand: {
      "@type": "Organization",
      name: provider.companyName || "TravelHub",
    },
    offers: {
      "@type": "Offer",
      price: discountPrice || price,
      priceCurrency: currency,
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: `${provider.firstName} ${provider.lastName}`,
      },
    },
  };

  if (reviewCount > 0) {
    product.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: rating,
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  if (reviews && reviews.length > 0) {
    product.review = reviews.slice(0, 5).map((r) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: `${r.user.firstName} ${r.user.lastName}`,
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
      name: r.title || undefined,
      reviewBody: r.text?.slice(0, 2000),
    }));
  }

  const jsonStr = useMemo(() => JSON.stringify(product), [
    id, title, description, type, price, currency, discountPrice,
    city, country, images, rating, reviewCount, reviews, provider,
  ]);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonStr }}
    />
  );
}
