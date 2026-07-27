import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Программа лояльности | TravelHub",
  description: "Накапливайте баллы за бронирования и получайте кэшбэк до 12% на TravelHub.",
};

export default function LoyaltyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
