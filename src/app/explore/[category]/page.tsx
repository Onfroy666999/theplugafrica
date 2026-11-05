import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/market/Breadcrumbs";
import { FloatingConcierge, Footer, Header } from "@/components/market/Sections";
import { ServiceGrid } from "@/components/market/ServiceGrid";
import { LinkButton } from "@/components/ui/Button";
import { getCategoryServices } from "@/lib/data";
import { getCat } from "@/lib/directory";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = getCat((await params).category);
  return cat ? { title: `${cat.name} in Ghana — The Plug Africa`, description: cat.line } : {};
}

/** Category page: the services inside one category (issue #26). */
export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  if (category === "emergency") redirect("/emergency");
  const cat = getCat(category);
  if (!cat) notFound();
  const services = await getCategoryServices(category);

  return (
    <main className="min-h-screen bg-white text-navy">
      <Header />
      <div className="mx-auto max-w-[1280px] px-5 pt-6 md:px-8">
        <Breadcrumbs items={[{ label: "Explore", href: "/explore" }, { label: cat.name }]} />
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-[32px] leading-tight font-extrabold tracking-[-0.03em] text-navy md:text-[44px]">{cat.name}</h1>
            <p className="mt-2 max-w-xl text-[16px] text-navy/60">{cat.line}</p>
          </div>
          <LinkButton href={`/explore?cat=${cat.key}`} variant="secondary" size="sm">
            See all {cat.name.toLowerCase()} businesses
          </LinkButton>
        </div>

        <h2 className="mt-10 mb-5 font-heading text-[20px] font-bold text-navy">Choose a service</h2>
        {services.length ? (
          <ServiceGrid category={cat.key} services={services} />
        ) : (
          <div className="rounded-panel bg-cream p-10 text-center">
            <p className="font-heading text-[20px] font-bold text-navy">Services are being added</p>
            <p className="mx-auto mt-2 max-w-md text-[15px] text-navy/60">A Plug concierge can find what you need in the meantime.</p>
            <LinkButton href="/concierge" className="mt-6">Ask a concierge</LinkButton>
          </div>
        )}
      </div>
      <Footer />
      <FloatingConcierge />
    </main>
  );
}
