import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Политика конфиденциальности | TravelHub",
  description: "Политика обработки и защиты персональных данных на платформе TravelHub.",
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
