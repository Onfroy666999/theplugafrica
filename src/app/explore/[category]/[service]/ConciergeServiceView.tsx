import Image from "next/image";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/market/Breadcrumbs";
import { Check, Shield } from "@/components/market/Icons";
import { Footer, Header, Reveal } from "@/components/market/Sections";
import { ServiceCardLink } from "@/components/market/ServiceGrid";
import { ChecklistCard, ConciergeTrust, FaqSection } from "@/components/market/TrustSections";
import { LinkButton } from "@/components/ui/Button";
import { CONCIERGE_SERVICE_CONTENT } from "@/lib/content";
import type { ServiceCard } from "@/lib/data";
import { STAGGER } from "@/lib/motion";
import { ConciergeForm } from "../../../concierge/ConciergeForm";

const STEPS = [
  { t: "Tell us what you need", d: "Send the short form below. A Plug concierge calls you, free of charge, to understand your business and what it needs." },
  { t: "Agree the plan and fee", d: "We explain the steps, the documents and the agencies involved, and agree our fee with you in writing before any work starts." },
  { t: "We handle it", d: "We prepare the paperwork, deal with the agencies and keep you updated at every step until it's done." },
];

/**
 * A service The Plug delivers itself (concierge categories such as New Business, issues #36 and #38):
 * what's included, what you'll need, who it's for, why trust us, questions, then the request form.
 */
export function ConciergeServiceView({ cat, svc, siblings }: { cat: { key: string; name: string }; svc: ServiceCard; siblings: ServiceCard[] }) {
  const others = siblings.filter((s) => s.slug !== svc.slug);
  const c = CONCIERGE_SERVICE_CONTENT[`${cat.key}/${svc.slug}`];

  return (
    <main className="min-h-screen bg-white text-navy">
      <Header />
      <div className="mx-auto max-w-[1280px] px-5 pt-6 md:px-8">
        <Breadcrumbs items={[{ label: "Explore", href: "/explore" }, { label: cat.name, href: `/explore/${cat.key}` }, { label: svc.name }]} />

        {/* Hero: only this service's own actions */}
        <section className="mt-5 grid items-center gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-gold/15 px-3 py-1.5 text-[13px] font-semibold text-navy">
              <Shield className="h-4 w-4 text-gold" />
              Handled by The Plug
            </span>
            <h1 className="mt-4 font-heading text-[34px] leading-[1.06] font-extrabold tracking-[-0.03em] md:text-[50px]">{svc.name}</h1>
            <p className="mt-3 max-w-xl font-heading text-[19px] leading-snug font-semibold text-navy/80 md:text-[22px]">{c?.welcome ?? svc.description}</p>
            <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-navy/65">{c?.intro ?? ""}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <LinkButton href="#request" size="lg">Request this service</LinkButton>
              {c && <LinkButton href="#included" variant="secondary" size="lg">What&apos;s included</LinkButton>}
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-hero bg-navy/5">
            <Image src={svc.image} alt={svc.name} fill priority sizes="(min-width:1024px) 45vw, 100vw" className="object-cover" />
          </div>
        </section>

        {c && (
          <>
            <section id="included" className="grid scroll-mt-24 gap-4 pt-20 md:grid-cols-[1.25fr_1fr]">
              <Reveal>
                <ChecklistCard list={{ title: "What's included", items: c.included }} />
              </Reveal>
              <div className="grid gap-4">
                <Reveal delay={STAGGER}>
                  <ChecklistCard list={{ title: "What you'll need", items: c.youNeed }} icon="chat" tone="cream" />
                </Reveal>
              </div>
            </section>

            {c.examples && (
              <section className="pt-4">
                <Reveal>
                  <ChecklistCard list={c.examples} tone="cream" />
                </Reveal>
              </section>
            )}

            <section className="pt-20">
              <h2 className="font-heading text-[26px] font-bold tracking-[-0.02em] md:text-[32px]">Who it&apos;s for</h2>
              <ul className="mt-6 flex flex-wrap gap-2.5">
                {c.whoFor.map((w) => (
                  <li key={w} className="flex items-center gap-2 rounded-full border border-navy/15 px-4 py-2.5 text-[15px] font-medium text-navy">
                    <Check className="h-4 w-4 text-gold" />
                    {w}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        <section className="pt-20">
          <h2 className="font-heading text-[26px] font-bold tracking-[-0.02em] md:text-[32px]">How it works</h2>
          <ol className="mt-7 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.t} delay={i * STAGGER} className="h-full rounded-panel bg-cream p-7">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy font-heading text-[15px] font-bold text-white">{i + 1}</span>
                  <h3 className="mt-5 font-heading text-[18px] font-bold text-navy">{s.t}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-navy/65">{s.d}</p>
              </Reveal>
            ))}
          </ol>
        </section>

        <ConciergeTrust />

        {c && <FaqSection items={c.faqs} />}

        <section id="request" className="grid scroll-mt-24 gap-8 pt-20 lg:grid-cols-[1fr_1.2fr] lg:gap-14">
          <div>
            <h2 className="font-heading text-[26px] leading-tight font-bold tracking-[-0.02em] md:text-[32px]">Let&apos;s talk about your business</h2>
            <p className="mt-3 max-w-md text-[16px] leading-relaxed text-navy/65">
              Tell us a little about what you&apos;re planning. A Plug concierge will call you to talk it through. The first call is free, and nothing is charged until you&apos;ve agreed the fee.
            </p>
          </div>
          <Suspense fallback={<div className="h-[560px] rounded-hero bg-cream" />}>
            <ConciergeForm service={{ category: cat.key, slug: svc.slug, name: svc.name }} />
          </Suspense>
        </section>

        {others.length > 0 && (
          <section className="pt-24">
            <h2 className="font-heading text-[26px] font-bold tracking-[-0.02em] md:text-[32px]">More from {cat.name}</h2>
            <div className={`mt-7 grid gap-4 md:grid-cols-2 ${others.length > 2 ? "lg:grid-cols-3" : ""}`}>
              {others.map((o, i) => (
                <Reveal key={o.slug} delay={i * STAGGER}>
                  <ServiceCardLink category={cat.key} s={o} />
                </Reveal>
              ))}
            </div>
          </section>
        )}
      </div>
      <Footer />
    </main>
  );
}
