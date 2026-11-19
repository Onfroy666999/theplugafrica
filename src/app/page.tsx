import type { Metadata } from "next";
import { SearchBar } from "@/components/market/SearchBar";
import {
  BusinessAndEmergency,
  CategoryExplorer,
  ConciergeBand,
  FloatingConcierge,
  Footer,
  Header,
  HowItWorks,
  PopularRail,
  TrustChips,
} from "@/components/market/Sections";
import { getPublicListings, getServicesByCategory } from "@/lib/data";
import { toCardListing } from "@/lib/listings";
import { pageMeta } from "@/lib/site";
import { emergencyTiles, heroSlides } from "@/lib/site-images";
import { getSiteImages } from "@/lib/site-images-server";
import { HeroSlides } from "./HeroSlides";

export const metadata: Metadata = pageMeta({
  title: "The Plug Africa — Verified businesses and services across Africa",
  description: "Find verified businesses, homes, schools, events and trusted help across Africa. Contact them directly, or let a Plug concierge handle it.",
  path: "/",
});

// Always read the latest published businesses (admin changes show immediately).
export const dynamic = "force-dynamic";

/**
 * Home. Rendered on the server; only the slideshow, search, category tabs, popular rail, header menu and floating
 * button run in the browser (issue #76: it used to be one big browser component).
 */
export default async function Home() {
  const [all, services, photos] = await Promise.all([getPublicListings(), getServicesByCategory(), getSiteImages()]);
  const listings = all.filter((l) => l.city === "Accra").slice(0, 8).map(toCardListing);
  return (
    <main className="min-h-screen bg-white text-navy">
      <Header />

      {/* Hero: rounded photo panel with a white search card (Thumbtack pattern) */}
      <section className="mx-auto max-w-[1280px] px-3 pt-2 md:px-8 md:pt-4">
        <div className="relative isolate overflow-hidden rounded-hero md:min-h-[600px] md:rounded-hero">
          <HeroSlides slides={heroSlides(photos)}>
            <div className="flex items-center md:min-h-[600px] md:p-12 lg:p-16">
              <div className="enter-up w-full rounded-panel bg-white px-2 pt-6 pb-2 md:max-w-[600px] md:p-9 md:shadow-float">
                <h1 className="font-heading text-[36px] leading-[1.06] font-extrabold tracking-[-0.03em] text-navy md:text-[52px]">
                  Find people you can <span className="text-gold-ink">trust</span>, anywhere in Africa.
                </h1>
                <p className="mt-4 text-[16px] leading-relaxed text-navy/65 md:text-[17px]">
                  Homes, schools, drivers, recruiters, places to eat. Every business is checked before it&apos;s listed.
                </p>
                <div className="mt-7">
                  <SearchBar />
                </div>
                <div className="mt-5">
                  <TrustChips />
                </div>
              </div>
            </div>
          </HeroSlides>
        </div>
      </section>

      <CategoryExplorer services={services} emergencyTiles={emergencyTiles(photos)} />
      {/* Hidden until there are businesses to show (the live site hides examples) */}
      {listings.length > 0 && <PopularRail listings={listings} />}
      <HowItWorks />
      <ConciergeBand img={photos["home.concierge"]} />
      <BusinessAndEmergency img={photos["home.business"]} />
      <Footer />
      <FloatingConcierge />
    </main>
  );
}
