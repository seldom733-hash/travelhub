import ServiceDetailPage from "@/app/services/[id]/page";

export default function PhotographerDetailPage(props: { params: Promise<{ id: string }> }) {
  return <ServiceDetailPage {...props} />;
}
