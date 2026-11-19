// Site sections. The static ones below render on the server; the interactive ones (header menu, tabs, scrolling
// rails, animations) live in SectionsClient.tsx and are re-exported here so pages import everything from one place
// (issue #76: phones no longer rebuild static content in the browser).

import Image from "next/image";
import Link from "next/link";
import { Lockup } from "@/components/Logo";
import { CATS } from "@/lib/directory";
import { Arrow, CatIcon, Check } from "./Icons";
import { LinkButton } from "@/components/ui/Button";
import { STAGGER } from "@/lib/motion";
import { Reveal } from "./SectionsClient";
import type { SiteImage } from "@/lib/site-images";

const PHOTO = { concierge: { url: "/images/portrait-efua.jpg", alt: "Example concierge", caption: "", position: "50% 0%" }, business: { url: "/images/jobs.jpg", alt: "Business team in a meeting", caption: "" } };

export { CategoryExplorer, FloatingConcierge, Header, PopularRail, Reveal } from "./SectionsClient";
// Motion values live in lib/motion (mirrors the CSS tokens in globals.css).
export { EASE } from "@/lib/motion";

/* ---------- Trust chips (Checkatrade-style, but only claims we can stand behind) ---------- */

export function TrustChips({ tone = "light" }: { tone?: "light" | "onPhoto" }) {
  const chips = ["Every business checked by our team", "Contact them directly", "We never handle your money"];
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-medium">
      {chips.map((c) => (
        <li key={c} className={`flex items-center gap-1.5 ${tone === "light" ? "text-navy/70" : "text-white/90"}`}>
          <span className={`flex h-[18px] w-[18px] items-center justify-center rounded-full ${tone === "light" ? "bg-ok-soft text-ok" : "bg-white/20 text-white"}`}>
            <Check className="h-3 w-3" />
          </span>
          {c}
        </li>
      ))}
    </ul>
  );
}

/* ---------- How it works ---------- */

export function HowItWorks() {
  const steps = [
    { t: "Tell us what you need", d: "Search by what you need and the city you're in. No account needed to look." },
    { t: "Check who you're dealing with", d: "Every listing shows credentials, ratings and what other customers said." },
    { t: "Contact them, or let us", d: "Reach the business directly. Prefer help? A Plug concierge can handle it for you." },
  ];
  return (
    <section id="how-it-works" className="mx-auto max-w-[1280px] scroll-mt-24 px-5 pt-24 md:px-8">
      <Reveal>
        <h2 className="font-heading text-[28px] font-bold tracking-[-0.02em] text-navy md:text-[34px]">How The Plug works</h2>
      </Reveal>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {steps.map((s, i) => (
          <Reveal key={s.t} delay={i * STAGGER}>
            <div className="h-full rounded-panel bg-cream p-7">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy font-heading text-[15px] font-bold text-white">{i + 1}</span>
              <h3 className="mt-6 font-heading text-[19px] font-bold text-navy">{s.t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-navy/65">{s.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------- Concierge band (Quintessentially-style quiet dark block) ---------- */

export function ConciergeBand({ img = PHOTO.concierge }: { img?: SiteImage }) {
  return (
    <section className="mx-auto max-w-[1280px] px-5 pt-24 md:px-8">
      <Reveal>
        <div className="grid overflow-hidden rounded-hero bg-navy md:grid-cols-[1.1fr_1fr]">
          <div className="p-8 md:p-14">
            <p className="text-[13px] font-semibold tracking-[0.14em] text-gold-light uppercase">Special Services</p>
            <h2 className="mt-4 font-heading text-[30px] leading-[1.15] font-bold tracking-[-0.02em] text-white md:text-[40px]">
              Rather someone handled it for you?
            </h2>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-white/70">
              Tell a Plug concierge what you need. We find the right people, make the introductions, mediate if needed, and follow up until it&apos;s done.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/concierge" variant="gold" size="lg">Request a concierge</LinkButton>
              <LinkButton href="/concierge#pricing" variant="outlineLight" size="lg">How it&apos;s priced</LinkButton>
            </div>
          </div>
          <div className="relative min-h-[280px]">
            <Image src={img.url} alt={img.alt} fill sizes="(min-width:768px) 45vw, 100vw" className="object-cover" style={{ objectPosition: img.position }} />
            <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/20 to-transparent md:via-transparent" />
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------- Businesses + emergency ---------- */

export function BusinessAndEmergency({ img = PHOTO.business }: { img?: SiteImage }) {
  return (
    <section className="mx-auto grid max-w-[1280px] gap-4 px-5 pt-4 md:grid-cols-[1.4fr_1fr] md:px-8">
      <Reveal>
        <div className="relative flex h-full min-h-[300px] overflow-hidden rounded-hero">
          <Image src={img.url} alt={img.alt} fill sizes="(min-width:768px) 55vw, 100vw" className="object-cover" style={{ objectPosition: img.position }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
          <div className="relative mt-auto p-8">
            <h3 className="font-heading text-[26px] font-bold text-white">Run a business? Get found.</h3>
            <p className="mt-2 max-w-md text-[15px] text-white/80">Join the waitlist to be listed and verified. Customers who find you through The Plug come with a reference number.</p>
            <LinkButton href="/businesses" variant="light" className="mt-5">Join the waitlist</LinkButton>
          </div>
        </div>
      </Reveal>
      <Reveal delay={STAGGER}>
        <div className="flex h-full flex-col rounded-hero border border-ember/25 bg-ember-soft p-8">
          <span className="flex h-11 w-11 items-center justify-center rounded-card bg-ember text-white"><CatIcon k="emergency" /></span>
          <h3 className="mt-5 font-heading text-[22px] font-bold text-navy">In an emergency</h3>
          <p className="mt-2 text-[15px] text-navy/70">Hospitals, police, fire and embassies for your city.</p>
          <p className="mt-auto pt-6 text-[13px] text-navy/65">Verified numbers per city are being collected. Until then, check local official sources.</p>
          <Link href="/emergency" className="group mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-ember">
            Open emergency page <span className="transition-transform duration-200 ease-[var(--ease-out)] group-hover:translate-x-1"><Arrow /></span>
          </Link>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------- Footer ---------- */

export function Footer() {
  const cols = [
    { h: "Explore", l: CATS.filter((c) => c.key !== "emergency").slice(0, 6).map((c) => ({ t: c.name, href: `/explore/${c.key}` })) },
    { h: "The Plug", l: [{ t: "About", href: "/about" }, { t: "How it works", href: "/#how-it-works" }, { t: "Concierge", href: "/concierge" }, { t: "Membership", href: "/membership" }, { t: "Emergency", href: "/emergency" }, { t: "Contact", href: "/contact" }] },
    { h: "Businesses", l: [{ t: "List your business", href: "/businesses" }, { t: "How verification works", href: "/businesses#verification" }] },
  ];
  return (
    <footer className="mt-24 border-t border-navy/10 bg-white">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-8">
        <div>
          <Link href="/" aria-label="The Plug Africa home"><Lockup tone="light" /></Link>
          <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-navy/60">
            A directory of verified businesses and services across Africa. The Plug connects you; it never handles payments between you and a business, or guarantees outcomes, so always check credentials.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.h}>
            <p className="font-heading text-[14px] font-bold text-navy">{c.h}</p>
            <ul className="mt-3 space-y-0.5 text-[14px] text-navy/60">
              {c.l.map((x) => (
                <li key={x.t}><Link href={x.href} className="inline-block py-1.5 transition-colors duration-200 hover:text-navy">{x.t}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-navy/10 py-5 text-center text-[12px] text-navy/65">© The Plug Africa · Photos: Unsplash</div>
    </footer>
  );
}
