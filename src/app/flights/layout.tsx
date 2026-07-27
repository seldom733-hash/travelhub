import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Авиабилеты — TravelHub",
  description: "Авиабилеты по лучим ценам. Поиск и бронирование билетов на рейсы по всему миру.",
  openGraph: {
    title: "Авиабилеты — TravelHub",
    description: "Авиабилеты по лучим ценам.",
    type: "website",
  },
};

export default function FlightsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
