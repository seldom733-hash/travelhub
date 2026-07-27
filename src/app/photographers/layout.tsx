import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Фотографы — TravelHub",
  description: "Профессиональные фотографы для вашей поездки. Закажите фотосессию в любой стране на TravelHub.",
  openGraph: {
    title: "Фотографы — TravelHub",
    description: "Профессиональные фотографы для вашей поездки.",
    type: "website",
  },
};

export default function PhotographersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
