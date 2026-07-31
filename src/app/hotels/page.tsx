import { Suspense } from "react";
import { fetchServicesForSSR } from "@/lib/ssr-helpers";
import HotelsClient from "@/components/HotelsClient";

export const dynamic = "force-dynamic";

async function HotelsData() {
  let initialData;
  try {
    initialData = await fetchServicesForSSR("HOTEL", "catalog.perNight", (key: string) => {
      const translations: Record<string, string> = {
        "catalog.perPerson": "за человека",
        "catalog.perNight": "за ночь",
      };
      return translations[key] || key;
    });
  } catch {
    // If fetch fails, render without SSR data (client will fetch)
  }
  return <HotelsClient initialData={initialData} />;
}

export default function HotelsPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100vh-120px)] bg-gray-50 animate-pulse" />}>
      <HotelsData />
    </Suspense>
  );
}
