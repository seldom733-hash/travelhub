import { Suspense } from "react";
import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import Search from "@/components/Search";
import PopularDestinations from "@/components/PopularDestinations";
import Tours from "@/components/Tours";
import HotTours from "@/components/HotTours";
import Excursions from "@/components/Excursions";
import Hotels from "@/components/Hotels";
import Flights from "@/components/Flights";
import Guides from "@/components/Guides";
import Photographers from "@/components/Photographers";
import Transfers from "@/components/Transfers";
import WhyTravelHub from "@/components/WhyTravelHub";
import ForPartners from "@/components/ForPartners";
import StructuredData from "@/components/StructuredData";

function SectionSkeleton({ className = "" }: { className?: string }) {
  return (
    <section className={`py-16 ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-8 bg-gray-200 rounded w-64 mb-3 animate-pulse" />
        <div className="h-5 bg-gray-200 rounded w-96 mb-10 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200" />
              <div className="p-5 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-5 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <StructuredData />
      <Hero />
      <Search />
      <Categories />
      <PopularDestinations />

      <Tours />

      {/* These 7 sections each fetch data independently.
          Wrapping each in Suspense allows them to load in parallel
          instead of blocking one another. */}
      <Suspense fallback={<SectionSkeleton className="bg-gradient-to-br from-secondary via-gray-900 to-secondary" />}>
        <HotTours />
      </Suspense>
      <Suspense fallback={<SectionSkeleton className="bg-gray-50" />}>
        <Excursions />
      </Suspense>
      <Suspense fallback={<SectionSkeleton className="bg-gray-50" />}>
        <Hotels />
      </Suspense>
      <Suspense fallback={<SectionSkeleton className="bg-gray-50" />}>
        <Flights />
      </Suspense>
      <Suspense fallback={<SectionSkeleton className="bg-gray-50" />}>
        <Guides />
      </Suspense>
      <Suspense fallback={<SectionSkeleton className="bg-gray-50" />}>
        <Photographers />
      </Suspense>
      <Suspense fallback={<SectionSkeleton className="bg-gray-50" />}>
        <Transfers />
      </Suspense>

      <WhyTravelHub />
      <ForPartners />
    </>
  );
}
