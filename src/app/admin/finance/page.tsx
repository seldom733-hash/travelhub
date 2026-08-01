import FinanceCenter from "@/components/admin/operations/FinanceCenter";

export const metadata = {
  title: "Финансы | TravelHub Command Center",
  robots: { index: false, follow: false },
};

export default function AdminFinancePage() {
  return <FinanceCenter />;
}
