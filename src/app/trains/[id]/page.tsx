import ServiceDetailPage from "@/app/services/[id]/page";

export default function TrainDetailPage(props: { params: Promise<{ id: string }> }) {
  return <ServiceDetailPage {...props} />;
}
