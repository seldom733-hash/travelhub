import ServiceDetailPage from "@/app/services/[id]/page";

export default function TransferDetailPage(props: { params: Promise<{ id: string }> }) {
  return <ServiceDetailPage {...props} />;
}
