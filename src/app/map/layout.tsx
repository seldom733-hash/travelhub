import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Карта | TravelHub",
  description: "Интерактивная карта с турами, отелями и экскурсиями по всему миру на TravelHub.",
};

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
