import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Личный кабинет | TravelHub",
  description: "Управляйте бронированиями, избранным и настройками аккаунта.",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
