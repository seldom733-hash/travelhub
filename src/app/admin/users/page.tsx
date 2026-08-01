import UsersCRM from "@/components/admin/operations/UsersCRM";

export const metadata = {
  title: "Пользователи | TravelHub Command Center",
  robots: { index: false, follow: false },
};

export default function AdminUsersPage() {
  return <UsersCRM />;
}
