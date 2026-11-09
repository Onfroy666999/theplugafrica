import type { Metadata } from "next";
import { pageMeta } from "@/lib/site";
import { FloatingConcierge, Footer, Header } from "@/components/market/Sections";
import { getPublicListings } from "@/lib/data";
import { toCardListing } from "@/lib/listings";
import { ExploreClient } from "./ExploreClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMeta({
  title: "Explore verified businesses — The Plug Africa",
  description: "Search verified rentals, schools, recruiters, drivers, restaurants and more across Ghana.",
  path: "/explore",
});

export default async function ExplorePage() {
  const listings = await getPublicListings();
  return (
    <main className="min-h-screen bg-white text-navy">
      <Header />
      <ExploreClient listings={listings.map(toCardListing)} />
      <Footer />
      <FloatingConcierge />
    </main>
  );
}
