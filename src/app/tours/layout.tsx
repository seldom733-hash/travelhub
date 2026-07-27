import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Горящие туры и путёвки — TravelHub",
  description: "Горящие туры по лучим ценам. Однодневные и многодневные экскурсии в Турции, Египте, ОАЭ и других странах.",
  openGraph: {
    title: "Горящие туры и путёвки — TravelHub",
    description: "Горящие туры по лучим ценам.",
    type: "website",
  },
};

export default function ToursLayout({ children }: { children: React.ReactNode }) {
  return children;
}
