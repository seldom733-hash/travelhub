import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Мои отзывы | TravelHub",
  description: "Отзывы, которые вы оставили после поездок на платформе TravelHub.",
  robots: { index: false, follow: false },
};

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
