import ServiceDetailPage from "@/app/services/[id]/page";

export default function GuideDetailPage(props: { params: Promise<{ id: string }> }) {
  return <ServiceDetailPage {...props} />;
}
