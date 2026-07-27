import ServiceDetailPage from "@/app/services/[id]/page";

export default function FlightDetailPage(props: { params: Promise<{ id: string }> }) {
  return <ServiceDetailPage {...props} />;
}
