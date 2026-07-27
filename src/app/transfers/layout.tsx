import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Трансферы — TravelHub",
  description: "Трансферы из аэропортов и между городами. Комфортные перевозки по доступным ценам на TravelHub.",
  openGraph: {
    title: "Трансферы — TravelHub",
    description: "Трансферы из аэропортов и между городами.",
    type: "website",
  },
};

export default function TransfersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
