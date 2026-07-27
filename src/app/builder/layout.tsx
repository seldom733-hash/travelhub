import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Сборщик путешествий | TravelHub",
  description: "Соберите идеальное путешествие из туров, отелей, перелётов и трансферов на платформе TravelHub.",
};

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
