import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Мои бронирования | TravelHub",
  description: "Управляйте своими бронированиями на платформе TravelHub.",
  robots: { index: false, follow: false },
};

export default function BookingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
