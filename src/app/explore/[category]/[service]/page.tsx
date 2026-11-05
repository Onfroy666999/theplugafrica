import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/market/Breadcrumbs";
import { FloatingConcierge, Footer, Header } from "@/components/market/Sections";
import { LinkButton } from "@/components/ui/Button";
import { getCategoryServices, getService, getServiceListings } from "@/lib/data";
import { getCat } from "@/lib/directory";
import { ExploreClient } from "../../ExploreClient";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ category: string; service: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, service } = await params;
  const cat = getCat(category);
  const svc = cat ? await getService(category, service) : null;
  return cat && svc ? { title: `${svc.name} — ${cat.name} — The Plug Africa`, description: svc.description || cat.line } : {};
}

/** Service page: businesses offering one service inside a category (issue #26). */
export default async function ServicePage({ params }: Props) {
  const { category, service } = await params;
  const cat = getCat(category);
  if (!cat) notFound();
  const [svc, listings, siblings] = await Promise.all([getService(category, service), getServiceListings(category, service), getCategoryServices(category)]);
  if (!svc) notFound();
  const others = siblings.filter((s) => s.slug !== svc.slug);

  return (
    <main className="min-h-screen bg-white text-navy">
      <Header />
      <div className="mx-auto max-w-[1280px] px-5 pt-6 pb-10 md:px-8">
        <Breadcrumbs items={[{ label: "Explore", href: "/explore" }, { label: cat.name, href: `/explore/${cat.key}` }, { label: svc.name }]} />

        <div className="mt-4 flex items-center gap-5">
          <span className="relative hidden h-20 w-20 shrink-0 overflow-hidden rounded-card bg-navy/5 sm:block">
            <Image src={svc.image} alt="" fill sizes="80px" className="object-cover" />
          </span>
          <div>
            <h1 className="font-heading text-[30px] leading-tight font-extrabold tracking-[-0.03em] text-navy md:text-[40px]">{svc.name}</h1>
            {svc.description && <p className="mt-1 max-w-2xl text-[16px] text-navy/60">{svc.description}</p>}
          </div>
        </div>

        {/* Other services in this category, one tap away */}
        {others.length > 0 && (
          <div className="mt-6 -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0 [&::-webkit-scrollbar]:hidden">
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
              <ExploreClient listings={listings} embedded />
            </Suspense>
          ) : (
            <div className="rounded-panel bg-cream p-10 text-center">
              <p className="font-heading text-[20px] font-bold text-navy">No {svc.name.toLowerCase()} listed yet</p>
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
