import type { Metadata } from "next";
import { pageMeta } from "@/lib/site";
import { LinkButton } from "@/components/ui/Button";
import Image from "next/image";
import { Shield } from "@/components/market/Icons";
import { Footer, Header, Reveal } from "@/components/market/Sections";
import { WaitlistForm } from "./WaitlistForm";
import { getSiteImages } from "@/lib/site-images-server";

// Reads the photos chosen in Admin › Site photos (issue #112).
export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMeta({
  title: "List your business — The Plug Africa",
  description: "Get verified and found by expats, returnees, investors and locals looking for trusted businesses.",
  path: "/businesses",
});

const BENEFITS = [
  { t: "Get found by people ready to buy", d: "Expats, returnees, investors and locals searching for exactly what you offer." },
  { t: "A verified badge that means something", d: "We check your documents in person, so customers trust you before they call." },
  { t: "Know where enquiries come from", d: "Every enquiry from The Plug carries a reference code, so there's no confusion about introductions." },
];

const STEPS = [
  { t: "Apply", d: "Join the waitlist with your business details." },
  { t: "Send documents", d: "Business registration, owner ID and any licences for your trade." },
  { t: "We review", d: "Our team checks the documents and, where needed, visits your address." },
  { t: "Go live", d: "Your listing shows In review, then Verified once every check passes." },
];

export default async function BusinessesPage() {
  const img = (await getSiteImages())["page.businesses"];
  return (
    <main className="min-h-screen bg-white text-navy">
      <Header />
      <section className="mx-auto max-w-[1280px] px-3 pt-2 md:px-8 md:pt-4">
        <div className="relative isolate overflow-hidden rounded-hero md:rounded-hero">
          <Image src={img.url} alt={img.alt} fill priority sizes="100vw" className="-z-10 object-cover" style={{ objectPosition: img.position }} />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy/90 via-navy/60 to-navy/10" />
          <div className="max-w-2xl px-6 py-16 md:px-14 md:py-24">
            <p className="text-[13px] font-semibold tracking-[0.14em] text-gold-light uppercase">For businesses</p>
            <h1 className="mt-3 font-heading text-[36px] leading-[1.08] font-extrabold tracking-[-0.03em] text-white md:text-[54px]">
              Be the business people trust first.
            </h1>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-white/75">
              The Plug lists businesses we&apos;ve checked. Get verified, get found, and know which customers came from us.
            </p>
            <LinkButton href="#waitlist" variant="gold" size="lg" className="mt-8">Join the waitlist</LinkButton>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1280px] gap-4 px-5 pt-20 md:grid-cols-3 md:px-8">
        {BENEFITS.map((b, i) => (
          <Reveal key={b.t} delay={i * 0.06}>
            <div className="h-full rounded-panel bg-cream p-7">
              <span className="flex h-11 w-11 items-center justify-center rounded-card bg-white text-gold"><Shield /></span>
              <h2 className="mt-5 font-heading text-[19px] font-bold text-navy">{b.t}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-navy/65">{b.d}</p>
            </div>
          </Reveal>
        ))}
      </section>

      <section id="verification" className="mx-auto max-w-[1280px] scroll-mt-24 px-5 pt-24 md:px-8">
        <Reveal>
          <h2 className="font-heading text-[28px] font-bold tracking-[-0.02em] text-navy md:text-[34px]">How verification works</h2>
        </Reveal>
        <ol className="mt-10 grid gap-6 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.t} delay={i * 0.06} className="relative">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy font-heading text-[15px] font-bold text-white">{i + 1}</span>
                {i < STEPS.length - 1 && <span className="absolute top-5 left-14 hidden h-px w-[calc(100%-56px)] bg-navy/15 md:block" />}
                <h3 className="mt-5 font-heading text-[18px] font-bold text-navy">{s.t}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-navy/60">{s.d}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section id="waitlist" className="mx-auto grid max-w-[1280px] scroll-mt-24 gap-10 px-5 pt-24 md:px-8 lg:grid-cols-[1fr_520px]">
        <Reveal>
          <h2 className="font-heading text-[28px] font-bold tracking-[-0.02em] text-navy md:text-[34px]">Pricing</h2>
          <p className="mt-3 max-w-md text-[15.5px] leading-relaxed text-navy/65">
            During the pilot, our team adds businesses directly. Paid listings, featured placement and subscriptions will follow; pricing will be announced before anything is charged.
          </p>
          <div className="mt-8 space-y-3">
            {["Standard listing", "Featured placement", "Business subscription"].map((p) => (
              <div key={p} className="flex items-center justify-between rounded-card border border-navy/10 px-5 py-4">
                <span className="font-semibold text-navy">{p}</span>
                <span className="text-[13px] font-semibold text-gold-ink">To be announced</span>
              </div>
            ))}
          </div>
        </Reveal>
        <WaitlistForm />
      </section>
      <Footer />
    </main>
  );
}
