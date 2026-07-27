import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Избранное | TravelHub",
  description: "Ваши сохранённые туры, отели и экскурсии на платформе TravelHub.",
  robots: { index: false, follow: false },
};

export default function FavoritesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
