import type { Metadata } from "next";
import { generateServiceMetadata } from "@/lib/seo-helpers";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return generateServiceMetadata(id, "Авиарейс", "Найдите авиабилеты на TravelHub");
}

export default function FlightDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
