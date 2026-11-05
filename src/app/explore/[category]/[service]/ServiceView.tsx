import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/market/Breadcrumbs";
import { FloatingConcierge, Footer, Header } from "@/components/market/Sections";
import { LinkButton } from "@/components/ui/Button";
import type { ServiceCard } from "@/lib/data";
import type { Listing } from "@/lib/listings";
import { citySlug } from "@/lib/site";
import { ExploreClient } from "../../ExploreClient";

/** A service page, optionally narrowed to one city (issues #26 and #13). */
export function ServiceView({
  cat,
  svc,
  listings,
  siblings,
  cities,
  city,
}: {
  cat: { key: string; name: string };
  svc: ServiceCard;
  /** Businesses to show (already narrowed to `city` when given). */
  listings: Listing[];
  siblings: ServiceCard[];
  /** Cities that have at least one business offering this service. */
  cities: string[];
  city?: string;
}) {
  const base = `/explore/${cat.key}/${svc.slug}`;
  const others = siblings.filter((s) => s.slug !== svc.slug);
  const heading = city ? `${svc.name} in ${city}` : svc.name;

  return (
    <main className="min-h-screen bg-white text-navy">
      <Header />
      <div className="mx-auto max-w-[1280px] px-5 pt-6 pb-10 md:px-8">
        <Breadcrumbs
          items={[
            { label: "Explore", href: "/explore" },
            { label: cat.name, href: `/explore/${cat.key}` },
            ...(city ? [{ label: svc.name, href: base }, { label: city }] : [{ label: svc.name }]),
          ]}
        />

        <div className="mt-4 flex items-center gap-5">
          <span className="relative hidden h-20 w-20 shrink-0 overflow-hidden rounded-card bg-navy/5 sm:block">
            <Image src={svc.image} alt="" fill sizes="80px" className="object-cover" />
          </span>
          <div>
            <h1 className="font-heading text-[30px] leading-tight font-extrabold tracking-[-0.03em] text-navy md:text-[40px]">{heading}</h1>
            {svc.description && <p className="mt-1 max-w-2xl text-[16px] text-navy/60">{svc.description}</p>}
          </div>
        </div>

        {/* Cities with this service: real links, so people and search engines can reach each city page */}
        {cities.length > 0 && (
          <nav aria-label="Cities" className="mt-6 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[14px] font-semibold text-navy/55">City</span>
            <CityLink href={base} on={!city}>All cities</CityLink>
            {cities.map((c) => (
              <CityLink key={c} href={`${base}/${citySlug(c)}`} on={c === city}>
                {c}
              </CityLink>
            ))}
          </nav>
        )}

        {/* Other services in this category, one tap away */}
        {others.length > 0 && (
          <div className="mt-4 -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0 [&::-webkit-scrollbar]:hidden">
            {others.map((o) => (
              <LinkButton key={o.slug} href={`/explore/${cat.key}/${o.slug}`} variant="secondary" size="sm">
                {o.name}
              </LinkButton>
            ))}
          </div>
        )}

        <div className="mt-8">
          {listings.length ? (
            <Suspense fallback={<div className="h-[50vh]" />}>
              <ExploreClient listings={listings} embedded lockCity={cities.length > 0} />
            </Suspense>
          ) : (
            <div className="rounded-panel bg-cream p-10 text-center">
              <p className="font-heading text-[20px] font-bold text-navy">
                No {svc.name.toLowerCase()} listed{city ? ` in ${city}` : ""} yet
              </p>
              <p className="mx-auto mt-2 max-w-md text-[15px] text-navy/60">We&apos;re adding verified businesses. A Plug concierge can find someone for you meanwhile.</p>
              <LinkButton href="/concierge" className="mt-6">Ask a concierge</LinkButton>
            </div>
          )}
        </div>
      </div>
      <Footer />
      <FloatingConcierge />
    </main>
  );
}

function CityLink({ href, on, children }: { href: string; on: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={on ? "page" : undefined}
      className={`press flex h-10 items-center rounded-full px-4 text-[14px] font-semibold transition-colors duration-200 ${on ? "bg-navy text-white" : "border border-navy/15 text-navy hover:border-navy/35"}`}
    >
      {children}
    </Link>
  );
}
