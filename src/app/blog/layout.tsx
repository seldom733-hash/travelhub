import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Блог — Советы и маршруты для путешествий | TravelHub",
  description: "Полезные советы, маршруты и вдохновение для ваших путешествий. Откройте для себя лучшие направления и лайфхаки.",
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
