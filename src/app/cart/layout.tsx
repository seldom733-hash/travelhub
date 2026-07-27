import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Корзина | TravelHub",
  description: "Ваша корзина с забронированными турами, отелями и экскурсиями.",
  robots: { index: false, follow: false },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
