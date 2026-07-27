import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const title = decodeURIComponent(slug).replace(/-/g, " ");
  return {
    title: `${title} | TravelHub Blog`,
    description: `Читайте статью «${title}» на TravelHub — советы и маршруты для путешествий.`,
  };
}

export default function BlogPostLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
