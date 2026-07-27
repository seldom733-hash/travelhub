import type { Metadata } from "next";
import { generateServiceMetadata } from "@/lib/seo-helpers";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return generateServiceMetadata(id, "Отель", "Забронируйте отель на TravelHub");
}

export default function HotelDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
