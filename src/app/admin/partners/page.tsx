import PartnersCRM from "@/components/admin/operations/PartnersCRM";

export const metadata = {
  title: "Партнеры | TravelHub Command Center",
  robots: { index: false, follow: false },
};

export default function AdminPartnersPage() {
  return <PartnersCRM />;
}
