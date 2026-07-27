import type { Metadata } from "next";
import { generateServiceMetadata } from "@/lib/seo-helpers";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return generateServiceMetadata(id, "Трансфер", "Закажите трансфер на TravelHub");
}

export default function TransferDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
