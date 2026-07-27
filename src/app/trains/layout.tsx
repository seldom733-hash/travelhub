import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Железнодорожные билеты — TravelHub",
  description: "Билеты на поезд по популярным маршрутам. Бронируйте ж/д билеты онлайн на TravelHub.",
  openGraph: {
    title: "Железнодорожные билеты — TravelHub",
    description: "Билеты на поезд по популярным маршрутам.",
    type: "website",
  },
};

export default function TrainsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
