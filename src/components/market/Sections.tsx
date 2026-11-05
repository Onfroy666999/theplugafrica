"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Lockup } from "@/components/Logo";
import { CATS, type CatKey } from "@/lib/directory";
import { LISTINGS, type Listing } from "@/lib/listings";
import type { ServiceCard } from "@/lib/data";
import { ListingCard } from "./ListingCard";
import { Arrow, CatIcon, Chat, Check } from "./Icons";
import { LinkButton } from "@/components/ui/Button";
import { DUR, EASE, SPRING, STAGGER, fadeUp } from "@/lib/motion";

// Motion values live in lib/motion (mirrors the CSS tokens in globals.css).
export { EASE } from "@/lib/motion";

/* ---------- Header ---------- */

const NAV = [
  { label: "Explore", href: "/explore" },
  { label: "Concierge", href: "/concierge" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Emergency", href: "/emergency" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header
      className={`sticky top-0 z-50 bg-white/90 backdrop-blur-md transition-shadow duration-200 ${scrolled ? "shadow-header" : ""}`}
    >
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-5 md:px-8">
        <Link href="/" aria-label="The Plug Africa home"><Lockup tone="light" /></Link>
        <nav className="hidden items-center gap-1 text-[14px] font-medium text-navy/75 lg:flex">
          {NAV.map((n) => {
            const on = path === n.href;
            return (
              <Link key={n.label} href={n.href} className={`press flex h-10 items-center rounded-full px-4 hover:bg-navy/[0.05] hover:text-navy ${on ? "bg-navy/[0.05] text-navy" : ""}`}>
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <LinkButton href="/businesses" variant="ghost" size="sm" className="hidden sm:inline-flex">List your business</LinkButton>
          <LinkButton href="#" size="sm" className="hidden sm:inline-flex">Sign in</LinkButton>
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="press flex h-10 w-10 items-center justify-center rounded-full border border-navy/15 text-navy lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d={open ? "M6 6l12 12M18 6 6 18" : "M4 7h16M4 12h16M4 17h16"} />
            </svg>
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, transform: "translateY(-8px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            exit={{ opacity: 0, transform: "translateY(-8px)", transition: { duration: DUR.fast * 0.6 } }}
            transition={{ duration: DUR.fast, ease: EASE.out }}
            className="border-t border-navy/10 bg-white px-5 pt-2 pb-5 lg:hidden"
          >
            {[...NAV, { label: "List your business", href: "/businesses" }].map((n) => (
              <Link key={n.label} href={n.href} className="block border-b border-navy/[0.06] py-3.5 font-heading text-[17px] font-semibold text-navy">
                {n.label}
              </Link>
            ))}
            <LinkButton href="#" full className="mt-4">Sign in</LinkButton>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ---------- Reveal on scroll ---------- */

export function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : fadeUp.hidden}
      whileInView={fadeUp.shown}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay, duration: DUR.enter, ease: EASE.out }}
    >
      {children}
    </motion.div>
  );
}

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

/* ---------- Category explorer: icon tabs swap a row of photo tiles ---------- */

/** Category tabs; each tab shows that category's services (from the database) linking to their service pages. */
export function CategoryExplorer({ id = "explore", services }: { id?: string; services?: Record<string, ServiceCard[]> }) {
  const [active, setActive] = useState<CatKey>("rentals");
  const reduce = useReducedMotion();
  const cat = CATS.find((c) => c.key === active)!;
  const fromDb = services?.[active];
  // Services from the database when available; Emergency (and the reference page) use the built-in tiles.
  const tiles = fromDb?.length
    ? fromDb.slice(0, 8).map((s) => ({ title: s.name, img: s.image, href: `/explore/${active}/${s.slug}`, note: s.count ? `${s.count} ${s.count === 1 ? "business" : "businesses"}` : "Coming soon" }))
    : cat.tiles.map((t) => ({ ...t, href: active === "emergency" ? "/emergency" : `/explore?cat=${active}`, note: "" }));
  const seeAll = active === "emergency" ? "/emergency" : `/explore/${active}`;

  return (
    <section id={id} className="mx-auto max-w-[1280px] px-5 pt-20 md:px-8">
      <Reveal>
        <h2 className="font-heading text-[28px] font-bold tracking-[-0.02em] text-navy md:text-[34px]">What do you need help with?</h2>
        <p className="mt-2 text-[15px] text-navy/60">Eight categories, one place. Pick one to see what&apos;s inside.</p>
      </Reveal>

      <div role="tablist" className="mt-8 flex gap-1 overflow-x-auto border-b border-navy/10 [mask-image:linear-gradient(90deg,#000_85%,transparent)] [scrollbar-width:none] md:[mask-image:none] [&::-webkit-scrollbar]:hidden">
        {CATS.map((c) => {
          const on = c.key === active;
          return (
            <button
              key={c.key}
              role="tab"
              aria-selected={on}
              onClick={() => setActive(c.key)}
              className={`group relative flex min-w-[96px] shrink-0 flex-col items-center gap-2 px-3 pt-2 pb-3.5 text-[13px] font-medium transition-colors duration-200 ${
                on ? "text-navy" : "text-navy/50 hover:text-navy/80"
              }`}
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-card transition-colors duration-200 ${on ? "bg-gold/15 text-gold" : "bg-transparent group-hover:bg-navy/[0.04]"}`}>
                <CatIcon k={c.key} />
              </span>
              <span className="whitespace-nowrap">{c.name}</span>
              {on && (
                <motion.span
                  layoutId={`tab-underline-${id}`}
                  className="absolute inset-x-3 -bottom-px h-[2.5px] rounded-full bg-navy"
                  transition={SPRING}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="relative mt-7 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <AnimatePresence mode="popLayout" initial={false}>
          {tiles.map((t, i) => (
            <motion.a
              href={t.href}
              key={`${active}-${t.title}`}
              initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(8px) scale(0.98)" }}
              animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
              exit={{ opacity: 0, transition: { duration: DUR.fast * 0.6 } }}
              transition={{ delay: i * STAGGER, duration: DUR.base, ease: EASE.out }}
              className="group relative block aspect-[4/5] overflow-hidden rounded-card bg-navy/5"
            >
              <Image src={t.img} alt={t.title} fill sizes="(min-width:768px) 25vw, 50vw" className="object-cover media-zoom" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="font-heading text-[17px] leading-tight font-bold text-white md:text-[19px]">{t.title}</p>
                {t.note && <p className="mt-1 text-[12.5px] font-medium text-white/75">{t.note}</p>}
              </div>
            </motion.a>
          ))}
        </AnimatePresence>
      </div>
      <Link href={seeAll} className="group mt-5 inline-flex items-center gap-1.5 text-[14px] font-semibold text-navy">
        {fromDb && fromDb.length > 8 ? `See all ${fromDb.length} services in ${cat.name}` : `Explore ${cat.name}`}
        <span className="transition-transform duration-200 ease-[var(--ease-out)] group-hover:translate-x-1"><Arrow /></span>
      </Link>
    </section>
  );
}

/* ---------- Popular rail (Airbnb-style cards with scroll arrows) ---------- */

export function PopularRail({ title = "Popular in Accra", listings = LISTINGS }: { title?: string; listings?: Listing[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const update = () => {
    const el = ref.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  };
  const scroll = (d: 1 | -1) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <section className="mx-auto max-w-[1280px] px-5 pt-20 md:px-8">
      <div className="flex items-end justify-between">
        <Reveal>
          <h2 className="font-heading text-[24px] font-bold tracking-[-0.02em] text-navy md:text-[28px]">{title}</h2>
          {listings.some((l) => l.isExample) && <p className="mt-1 text-[14px] text-navy/55">Example listings. Real businesses are being added now.</p>}
        </Reveal>
        <div className="hidden gap-2 md:flex">
          {([-1, 1] as const).map((d) => (
            <button
              key={d}
              aria-label={d < 0 ? "Previous" : "Next"}
              onClick={() => scroll(d)}
              disabled={d < 0 ? edge.start : edge.end}
              className="press flex h-10 w-10 items-center justify-center rounded-full border border-navy/15 text-navy hover:border-navy/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Arrow dir={d < 0 ? "left" : "right"} />
            </button>
          ))}
        </div>
      </div>

      <div ref={ref} onScroll={update} className="-mx-5 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] md:-mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
        {listings.filter((l) => l.city === "Accra").slice(0, 8).map((l, i) => (
          <Reveal key={l.slug} delay={i * STAGGER} className="w-[78%] shrink-0 snap-start sm:w-[46%] md:w-[calc((100%-48px)/4)]">
            <ListingCard l={l} />
          </Reveal>
        ))}
      </div>
    </section>
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

export function ConciergeBand() {
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
            <Image src="/images/portrait-efua.jpg" alt="Example concierge" fill sizes="(min-width:768px) 45vw, 100vw" className="object-cover object-top" />
            <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/20 to-transparent md:via-transparent" />
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------- Businesses + emergency ---------- */

export function BusinessAndEmergency() {
  return (
    <section className="mx-auto grid max-w-[1280px] gap-4 px-5 pt-4 md:grid-cols-[1.4fr_1fr] md:px-8">
      <Reveal>
        <div className="relative flex h-full min-h-[300px] overflow-hidden rounded-hero">
          <Image src="/images/jobs.jpg" alt="Business team in a meeting" fill sizes="(min-width:768px) 55vw, 100vw" className="object-cover" />
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
          <p className="mt-auto pt-6 text-[13px] text-navy/55">Verified numbers per city are being collected. Until then, check local official sources.</p>
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
    { h: "Explore", l: CATS.filter((c) => c.key !== "emergency").slice(0, 5).map((c) => ({ t: c.name, href: `/explore/${c.key}` })) },
    { h: "The Plug", l: [{ t: "How it works", href: "/#how-it-works" }, { t: "Concierge", href: "/concierge" }, { t: "Emergency", href: "/emergency" }] },
    { h: "Businesses", l: [{ t: "List your business", href: "/businesses" }, { t: "How verification works", href: "/businesses#verification" }] },
  ];
  return (
    <footer className="mt-24 border-t border-navy/10 bg-white">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:px-8">
        <div>
          <Link href="/" aria-label="The Plug Africa home"><Lockup tone="light" /></Link>
          <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-navy/60">
            A directory of verified businesses and services across Africa. The Plug connects you; it doesn&apos;t take payments or guarantee outcomes, so always check credentials.
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
      <div className="border-t border-navy/10 py-5 text-center text-[12px] text-navy/45">© The Plug Africa · Photos: Unsplash</div>
    </footer>
  );
}

/* ---------- Floating concierge pill ---------- */

export function FloatingConcierge() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 600);
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.a
          href="/concierge"
          initial={{ opacity: 0, transform: "translateY(12px) scale(0.96)" }}
          animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
          exit={{ opacity: 0, transform: "translateY(12px) scale(0.96)", transition: { duration: DUR.fast * 0.6 } }}
          transition={{ duration: DUR.base, ease: EASE.out }}
          className="press fixed right-5 bottom-6 z-50 flex h-12 items-center gap-2 rounded-full bg-navy pr-5 pl-4 text-[14px] font-semibold text-white shadow-float hover:bg-navy-hover"
        >
          <Chat /> Ask a concierge
        </motion.a>
      )}
    </AnimatePresence>
  );
}
