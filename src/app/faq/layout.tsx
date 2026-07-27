import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ — Часто задаваемые вопросы | TravelHub",
  description: "Ответы на часто задаваемые вопросы о бронировании, оплате, отмене и возврате средств на платформе TravelHub.",
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
