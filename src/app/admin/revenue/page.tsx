import RevenueCenter from "@/components/admin/operations/RevenueCenter";

export const metadata = {
  title: "Доходы | TravelHub Command Center",
  robots: { index: false, follow: false },
};

export default function AdminRevenuePage() {
  return <RevenueCenter />;
}
