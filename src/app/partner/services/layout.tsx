import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Мои услуги | TravelHub Partner",
  description: "Управляйте своими услугами на платформе TravelHub.",
  robots: { index: false, follow: false },
};

export default function PartnerServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
