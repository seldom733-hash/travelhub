import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const service = await prisma.service.findUnique({
      where: { id },
      select: { title: true, description: true, images: true, city: true, country: true, price: true, currency: true },
    });
    if (!service) return { title: "Ж/Д билет не найден — TravelHub" };
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://travelhub.com";
    const firstImage = typeof service.images === "string"
      ? service.images.split(",").filter(Boolean)[0]
      : Array.isArray(service.images) ? service.images[0] : null;
    return {
      title: `${service.title} — TravelHub`,
      description: service.description?.slice(0, 160) || `${service.title} — ж/д билеты ${service.city}, ${service.country}`,
      openGraph: {
        title: `${service.title} — TravelHub`,
        description: service.description?.slice(0, 160) || `${service.title} — ж/д билеты`,
        url: `${baseUrl}/trains/${id}`,
        images: firstImage ? [{ url: firstImage, width: 1200, height: 630, alt: service.title }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: `${service.title} — TravelHub`,
        images: firstImage ? [firstImage] : undefined,
      },
    };
  } catch (error) {
    console.error("SEO metadata error:", error);
    return { title: "Ж/Д билет — TravelHub" };
  }
}

export default function TrainDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
