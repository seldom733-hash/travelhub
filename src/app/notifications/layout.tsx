import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Уведомления | TravelHub",
  description: "Ваши уведомления о бронированиях и акциях на TravelHub.",
  robots: { index: false, follow: false },
};

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
