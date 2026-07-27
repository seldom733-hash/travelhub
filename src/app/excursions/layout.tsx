import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Экскурсии и туры — TravelHub",
  description: "Экскурсии по всему миру. Забронируйте экскурсию онлайн на TravelHub.",
  openGraph: {
    title: "Экскурсии и туры — TravelHub",
    description: "Экскурсии по всему миру.",
    type: "website",
  },
};

export default function ExcursionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
