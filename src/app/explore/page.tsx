import type { Metadata } from "next";
import { Suspense } from "react";
import { FloatingConcierge, Footer, Header } from "@/components/market/Sections";
import { getPublicListings } from "@/lib/data";
import { ExploreClient } from "./ExploreClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explore verified businesses — The Plug Africa",
  description: "Search verified rentals, schools, recruiters, drivers, restaurants and more across Ghana.",
};

export default async function ExplorePage() {
  const listings = await getPublicListings();
  return (
    <main className="min-h-screen bg-white text-navy">
      <Header />
      <Suspense fallback={<div className="mx-auto h-[60vh] max-w-[1280px]" />}>
        <ExploreClient listings={listings} />
      </Suspense>
      <Footer />
      <FloatingConcierge />
    </main>
  );
}
