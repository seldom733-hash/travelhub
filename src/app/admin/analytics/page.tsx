import AnalyticsCenter from "@/components/admin/operations/AnalyticsCenter";

export const metadata = {
  title: "Общая аналитика | TravelHub Command Center",
  robots: { index: false, follow: false },
};

export default function AdminAnalyticsPage() {
  return <AnalyticsCenter />;
}
