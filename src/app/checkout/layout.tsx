import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Оформление заказа | TravelHub",
  description: "Безопасная оплата забронированных туров, отелей и экскурсий.",
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
