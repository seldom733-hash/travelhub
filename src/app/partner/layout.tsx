import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Для партнёров | TravelHub",
  description: "Станьте партнёром TravelHub и предлагайте свои туры, отели и услуги тысячам путешественников.",
};

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
