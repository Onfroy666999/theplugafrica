import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/market/Breadcrumbs";
import { Shield } from "@/components/market/Icons";
import { FloatingConcierge, Footer, Header } from "@/components/market/Sections";
import { ServiceGrid } from "@/components/market/ServiceGrid";
import { ConciergeTrust, FaqSection, HelpBand, TrustAndTips, WhoFor } from "@/components/market/TrustSections";
import { LinkButton } from "@/components/ui/Button";
import { CATEGORY_CONTENT } from "@/lib/content";
import { getCategoryServices } from "@/lib/data";
import { getCat } from "@/lib/directory";
import { pageMeta } from "@/lib/site";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = getCat((await params).category);
  if (!cat) return {};
  const c = CATEGORY_CONTENT[cat.key];
  return pageMeta({ title: `${cat.name} in Ghana — The Plug Africa`, description: c?.welcome ?? cat.line, path: `/explore/${cat.key}`, image: c?.image ?? cat.tiles[0]?.img });
}

/** Category page: a welcome, the services inside it, what we check, and common questions (issues #26, #38). */
export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  if (category === "emergency") redirect("/emergency");
  const cat = getCat(category);
  if (!cat) notFound();
  const services = await getCategoryServices(category);
  const c = CATEGORY_CONTENT[cat.key];

  return (
    <main className="min-h-screen bg-white text-navy">
      <Header />
      <div className="mx-auto max-w-[1280px] px-5 pt-6 md:px-8">
        <Breadcrumbs items={[{ label: "Explore", href: "/explore" }, { label: cat.name }]} />

        <section className="mt-5 grid items-center gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <div>
            {cat.concierge && (
              <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-gold/15 px-3 py-1.5 text-[13px] font-semibold text-navy">
                <Shield className="h-4 w-4 text-gold" />
                Handled by The Plug
              </span>
            )}
            <h1 className="font-heading text-[34px] leading-[1.06] font-extrabold tracking-[-0.03em] md:text-[50px]">{cat.name}</h1>
            <p className="mt-3 max-w-xl font-heading text-[19px] leading-snug font-semibold text-navy/80 md:text-[22px]">{c?.welcome ?? cat.line}</p>
            {c?.intro.map((p) => (
              <p key={p} className="mt-4 max-w-xl text-[16px] leading-relaxed text-navy/65">{p}</p>
            ))}
            <div className="mt-7 flex flex-wrap gap-3">
              <LinkButton href="#services" size="lg">{cat.concierge ? "See the services" : "Choose a service"}</LinkButton>
              {cat.concierge ? (
                <LinkButton href="/concierge" variant="secondary" size="lg">Talk to a concierge</LinkButton>
              ) : (
                <LinkButton href={`/explore?cat=${cat.key}`} variant="secondary" size="lg">See all businesses</LinkButton>
              )}
            </div>
          </div>
          {c && (
            <div className="relative aspect-[4/3] overflow-hidden rounded-hero bg-navy/5">
              <Image src={c.image} alt={c.imageAlt} fill priority sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" />
            </div>
          )}
        </section>

        <section id="services" className="scroll-mt-24 pt-20">
          <h2 className="font-heading text-[26px] font-bold tracking-[-0.02em] md:text-[32px]">{cat.concierge ? "What we can do for you" : "Choose a service"}</h2>
          <p className="mt-2 mb-7 max-w-2xl text-[15.5px] text-navy/60">
            {cat.concierge ? "Pick a service to see what's included, what you'll need and how to start." : "Pick a service to see the verified businesses that offer it."}
          </p>
          {services.length ? (
            <ServiceGrid category={cat.key} services={services} concierge={cat.concierge} />
          ) : (
            <div className="rounded-panel bg-cream p-10 text-center">
              <p className="font-heading text-[20px] font-bold text-navy">Services are being added</p>
              <p className="mx-auto mt-2 max-w-md text-[15px] text-navy/60">A Plug concierge can find what you need in the meantime.</p>
              <LinkButton href="/concierge" className="mt-6">Ask a concierge</LinkButton>
            </div>
          )}
        </section>

        {c && (cat.concierge ? <><WhoFor list={c.checks} /><ConciergeTrust /></> : <TrustAndTips checks={c.checks} tips={c.tips} />)}
        {c && <FaqSection items={c.faqs} />}
        {cat.concierge ? (
          <HelpBand title="Ready to get started?" body="Tell us about your business and a Plug concierge will call you to talk it through. The first call is free, and nothing is charged until you agree the fee." />
        ) : (
          <HelpBand />
        )}
      </div>
      <Footer />
      <FloatingConcierge />
    </main>
  );
}
