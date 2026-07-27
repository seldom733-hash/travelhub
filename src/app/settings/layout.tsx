import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Настройки | TravelHub",
  description: "Настройки вашего аккаунта на платформе TravelHub.",
  robots: { index: false, follow: false },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
