import { Suspense } from "react";
import { fetchServicesForSSR } from "@/lib/ssr-helpers";
import ToursClient from "@/components/ToursClient";

export const dynamic = "force-dynamic";

async function ToursData() {
  let initialData;
  try {
    initialData = await fetchServicesForSSR("TOUR", "catalog.perPerson", (key: string) => {
      // Simple translation map for server-side rendering
      const translations: Record<string, string> = {
        "catalog.perPerson": "за человека",
        "catalog.perNight": "за ночь",
      };
      return translations[key] || key;
    });
  } catch {
    // If fetch fails, render without SSR data (client will fetch)
  }
  return <ToursClient initialData={initialData} />;
}

export default function ToursPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-120px)] bg-gray-50 animate-pulse" />}>
      <ToursData />
    </Suspense>
  );
}
