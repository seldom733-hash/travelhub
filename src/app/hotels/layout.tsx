import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Отели и санатории — TravelHub",
  description: "Лучшие отели и санатории по всему миру. Бронируйте онлайн с лучшими ценами на TravelHub.",
  openGraph: {
    title: "Отели и санатории — TravelHub",
    description: "Лучшие отели и санатории по всему миру.",
    type: "website",
  },
};

export default function HotelsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
