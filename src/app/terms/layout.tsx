import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Условия использования | TravelHub",
  description: "Правила и условия использования платформы TravelHub для бронирования туров и услуг.",
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
