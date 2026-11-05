import Image from "next/image";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/market/Breadcrumbs";
import { Shield } from "@/components/market/Icons";
import { Footer, Header, Reveal } from "@/components/market/Sections";
import { LinkButton } from "@/components/ui/Button";
import type { ServiceCard } from "@/lib/data";
import { STAGGER } from "@/lib/motion";
import { ConciergeForm } from "../../../concierge/ConciergeForm";

const STEPS = [
  { t: "Tell us what you need", d: "Send the request below. A Plug concierge calls you to understand your business and what it needs." },
  { t: "Agree the scope and fee", d: "We explain the steps, documents and timelines, and agree our fee with you before any work starts." },
  { t: "We handle it", d: "We prepare the paperwork, deal with the agencies and keep you updated until it's done." },
];

/** A service The Plug delivers itself (concierge categories such as New Business, issue #36): no listings, a request form instead. */
export function ConciergeServiceView({ cat, svc, siblings }: { cat: { key: string; name: string }; svc: ServiceCard; siblings: ServiceCard[] }) {
  const others = siblings.filter((s) => s.slug !== svc.slug);

  return (
    <main className="min-h-screen bg-white text-navy">
      <Header />
      <div className="mx-auto max-w-[1280px] px-5 pt-6 md:px-8">
        <Breadcrumbs items={[{ label: "Explore", href: "/explore" }, { label: cat.name, href: `/explore/${cat.key}` }, { label: svc.name }]} />

        <section className="mt-5 grid items-center gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-gold/15 px-3 py-1.5 text-[13px] font-semibold text-navy">
              <Shield className="h-4 w-4 text-gold" />
              Handled by The Plug
            </span>
            <h1 className="mt-4 font-heading text-[34px] leading-[1.08] font-extrabold tracking-[-0.03em] md:text-[48px]">{svc.name}</h1>
            {svc.description && <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-navy/65">{svc.description}</p>}
            <div className="mt-7 flex flex-wrap gap-3">
              <LinkButton href="#request" size="lg">Request this service</LinkButton>
              {others.map((o) => (
                <LinkButton key={o.slug} href={`/explore/${cat.key}/${o.slug}`} variant="secondary" size="lg">
                  {o.name}
                </LinkButton>
              ))}
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-hero bg-navy/5">
            <Image src={svc.image} alt={svc.name} fill priority sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" />
          </div>
        </section>

        <section className="pt-20">
          <h2 className="font-heading text-[24px] font-bold tracking-[-0.02em] md:text-[30px]">How it works</h2>
          <ol className="mt-7 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal key={s.t} delay={i * STAGGER}>
                <li className="h-full rounded-panel bg-cream p-7">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy font-heading text-[15px] font-bold text-white">{i + 1}</span>
                  <h3 className="mt-5 font-heading text-[18px] font-bold text-navy">{s.t}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-navy/65">{s.d}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </section>

        <section id="request" className="grid scroll-mt-24 gap-8 pt-20 lg:grid-cols-[1fr_1.2fr] lg:gap-14">
          <div>
            <h2 className="font-heading text-[24px] font-bold tracking-[-0.02em] md:text-[30px]">Request {svc.name.toLowerCase()}</h2>
            <p className="mt-3 max-w-md text-[16px] leading-relaxed text-navy/65">
              Tell us a little about your business. There&apos;s no charge for the first call; our fee is agreed with you before any work starts.
            </p>
          </div>
          <Suspense fallback={<div className="h-[560px] rounded-hero bg-cream" />}>
            <ConciergeForm service={{ category: cat.key, slug: svc.slug, name: svc.name }} />
          </Suspense>
        </section>
      </div>
      <Footer />
    </main>
  );
}
