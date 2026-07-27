import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Возврат средств | TravelHub",
  description: "Политика возврата средств и порядок подачи заявки на возврат на платформе TravelHub.",
};

export default function ReturnsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
