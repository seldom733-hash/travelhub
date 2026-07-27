import type { Metadata } from "next";

/**
 * Helper to generate metadata for service detail pages.
 * Fetches service data from the API and builds SEO tags.
 */
export async function generateServiceMetadata(
  id: string,
  fallbackTitle: string,
  fallbackDescription: string,
): Promise<Metadata> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const service = await prisma.service.findUnique({
      where: { id },
      select: {
        title: true,
        description: true,
        city: true,
        country: true,
        price: true,
        discountPrice: true,
        rating: true,
        images: true,
        type: true,
      },
    });

    if (!service) {
      return {
        title: `${fallbackTitle} — TravelHub`,
        description: fallbackDescription,
      };
    }

    const price = service.discountPrice || service.price;
    const title = `${service.title} — ${service.city}, ${service.country} | TravelHub`;
    const description = `${service.title} в ${service.city}, ${service.country}. Цена от ${price} AZN. Рейтинг: ${service.rating}. Забронируйте на TravelHub.`;
    // Images are stored as comma-separated strings in the database
    const imagesRaw = service.images;
    const imageUrl = typeof imagesRaw === "string"
      ? imagesRaw.split(",").filter(Boolean)[0] || null
      : Array.isArray(imagesRaw) ? imagesRaw[0] || null : null;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "website",
        ...(imageUrl ? { images: [{ url: imageUrl, width: 1200, height: 630, alt: service.title }] } : {}),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        ...(imageUrl ? { images: [imageUrl] } : {}),
      },
    };
  } catch (error) {
    console.error("SEO metadata error:", error);
    return {
      title: `${fallbackTitle} — TravelHub`,
      description: fallbackDescription,
    };
  }
}
