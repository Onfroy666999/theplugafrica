import type { Metadata } from "next";
import { Suspense } from "react";
import { FloatingConcierge, Footer, Header } from "@/components/market/Sections";
import { ExploreClient } from "./ExploreClient";

export const metadata: Metadata = {
  title: "Explore verified businesses — The Plug Africa",
  description: "Search verified rentals, schools, recruiters, drivers, restaurants and more across Ghana.",
};

export default function ExplorePage() {
  return (
    <main className="min-h-screen bg-white text-navy">
      <Header />
      <Suspense fallback={<div className="mx-auto h-[60vh] max-w-[1280px]" />}>
        <ExploreClient />
      </Suspense>
      <Footer />
      <FloatingConcierge />
    </main>
  );
}
