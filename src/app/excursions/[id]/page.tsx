import ServiceDetailPage from "@/app/services/[id]/page";

export default function ExcursionDetailPage(props: { params: Promise<{ id: string }> }) {
  return <ServiceDetailPage {...props} />;
}
