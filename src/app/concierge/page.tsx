import type { Metadata } from "next";
import { pageMeta } from "@/lib/site";
import Image from "next/image";
import { Suspense } from "react";
import { Check } from "@/components/market/Icons";
import { Footer, Header, Reveal } from "@/components/market/Sections";
import { ConciergeForm } from "./ConciergeForm";

export const metadata: Metadata = pageMeta({
  title: "Concierge — The Plug Africa",
  description: "Tell a Plug concierge what you need. We find the right people, make introductions, mediate and follow up.",
  path: "/concierge",
});

const DOES = [
  "Find and shortlist verified businesses for you",
  "Make the introduction and arrange viewings or meetings",
  "Mediate if something goes wrong",
  "Follow up until it's done",
];

export default function ConciergePage() {
  return (
    <main className="min-h-screen bg-white text-navy">
      <Header />
      <section className="mx-auto grid max-w-[1280px] gap-10 px-5 pt-10 md:px-8 lg:grid-cols-[1fr_520px] lg:gap-16 lg:pt-16">
        <div>
          <p className="text-[13px] font-semibold tracking-[0.14em] text-gold uppercase">Special Services</p>
          <h1 className="mt-3 font-heading text-[36px] leading-[1.08] font-extrabold tracking-[-0.03em] text-navy md:text-[52px]">
            Tell us what you need. We&apos;ll handle it.
          </h1>
          <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-navy/65">
            Moving, hiring, renting or setting up? A Plug concierge does the legwork with businesses we&apos;ve checked, and stays with you until it&apos;s sorted.
          </p>
          <ul className="mt-8 space-y-3">
            {DOES.map((d) => (
              <li key={d} className="flex items-center gap-3 text-[15.5px] text-navy/80">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ok-soft text-ok"><Check className="h-3.5 w-3.5" /></span>
                {d}
              </li>
            ))}
          </ul>
          <div className="relative mt-10 hidden h-[320px] overflow-hidden rounded-hero lg:block">
            <Image src="/images/chauffeur.jpg" alt="Example chauffeur opening a car door" fill sizes="45vw" className="object-cover" />
          </div>
        </div>
        <div className="lg:pt-2">
          <Suspense fallback={<div className="h-[640px] rounded-hero bg-cream" />}>
            <ConciergeForm />
          </Suspense>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-[1280px] scroll-mt-24 px-5 pt-24 md:px-8">
        <Reveal>
          <div className="rounded-hero bg-cream p-8 md:p-12">
            <h2 className="font-heading text-[26px] font-bold text-navy md:text-[32px]">How concierge pricing works</h2>
            <p className="mt-3 max-w-2xl text-[15.5px] leading-relaxed text-navy/65">
              Concierge is The Plug&apos;s only paid, hands-on service. We agree the fee with you after the first call, before any work starts. You always pay businesses directly; The Plug never holds your money.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                { t: "Single task", d: "One introduction or arrangement, such as a viewing or a driver booking." },
                { t: "Project", d: "Several steps over a few weeks, such as relocating a family." },
                { t: "Ongoing", d: "Regular help for companies with staff arriving or based in Ghana." },
              ].map((p) => (
                <div key={p.t} className="rounded-card bg-white p-6">
                  <p className="font-heading text-[18px] font-bold text-navy">{p.t}</p>
                  <p className="mt-2 text-[14.5px] text-navy/60">{p.d}</p>
                  <p className="mt-4 text-[13px] font-semibold text-gold">Fee: to be confirmed</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>
      <Footer />
    </main>
  );
}
