import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Туристические гиды — TravelHub",
  description: "Профессиональные гиды по всему миру. Забронируйте гида для вашей поездки на TravelHub.",
  openGraph: {
    title: "Туристические гиды — TravelHub",
    description: "Профессиональные гиды по всему миру.",
    type: "website",
  },
};

export default function GuidesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
