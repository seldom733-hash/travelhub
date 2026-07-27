import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Санатории — TravelHub",
  description: "Лучшие санатории для оздоровления и отдыха. Бронирование онлайн с лучшими ценами.",
  openGraph: {
    title: "Санатории — TravelHub",
    description: "Лучшие санатории для оздоровления и отдыха.",
    type: "website",
  },
};

export default function SanatoriumsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
