"use client";

// The interactive site sections (issue #76): they need the browser for scrolling, tabs, menus or animation.
// Everything static lives in Sections.tsx and renders on the server, so phones don't rebuild it.

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Lockup } from "@/components/Logo";
import { CATS, type CatKey } from "@/lib/directory";
import type { CardListing } from "@/lib/listings";
import type { ServiceCard } from "@/lib/data";
import { ListingCard } from "./ListingCard";
import { Arrow, CatIcon, Chat } from "./Icons";
import { LinkButton } from "@/components/ui/Button";
import { DUR, EASE, SPRING, STAGGER, fadeUp } from "@/lib/motion";

/* ---------- Header ---------- */

const NAV = [
  { label: "Explore", href: "/explore" },
  { label: "New Business", href: "/explore/new-business" },
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
    // Nearly opaque instead of a see-through blur: a blur behind a sticky header is recalculated on every scroll frame.
    <header className={`sticky top-0 z-50 bg-white/[0.97] transition-shadow duration-200 ${scrolled ? "shadow-header" : ""}`}>
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
          {/* Customer sign-in arrives with accounts (#20); until then there is no Sign in button. */}
          {/* max-sm:hidden, not hidden sm:inline-flex: the kit button's own inline-flex would win over plain hidden (issue #46). */}
          <LinkButton href="/businesses" size="sm" className="max-sm:hidden">List your business</LinkButton>
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
            {NAV.map((n) => (
              <Link key={n.label} href={n.href} className="block border-b border-navy/[0.06] py-3.5 font-heading text-[17px] font-semibold text-navy">
                {n.label}
              </Link>
            ))}
            {/* Phones only: from sm up the header already shows this button (issue #46). */}
            <LinkButton href="/businesses" full className="mt-4 sm:hidden">List your business</LinkButton>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ---------- Reveal on scroll ---------- */

/**
 * Fades content up as it scrolls into view. `as="li"` keeps lists valid for screen readers (issue #30).
 * With reduced motion, content is simply shown: nothing waits, invisible, for an animation.
 */
export function Reveal({ children, delay = 0, className = "", as = "div" }: { children: React.ReactNode; delay?: number; className?: string; as?: "div" | "li" }) {
  const reduce = useReducedMotion();
  const Tag = as === "li" ? motion.li : motion.div;
  return (
    <Tag
      className={className}
      initial={reduce ? false : fadeUp.hidden}
      whileInView={fadeUp.shown}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay, duration: DUR.enter, ease: EASE.out }}
    >
      {children}
    </Tag>
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
    ? fromDb.slice(0, 8).map((s) => ({ title: s.name, img: s.image, href: `/explore/${active}/${s.slug}`, note: cat.concierge ? "Handled by The Plug" : s.count ? `${s.count} ${s.count === 1 ? "business" : "businesses"}` : "Coming soon" }))
    : cat.tiles.map((t) => ({ ...t, href: active === "emergency" ? "/emergency" : `/explore?cat=${active}`, note: "" }));
  const seeAll = active === "emergency" ? "/emergency" : `/explore/${active}`;

  return (
    <section id={id} className="mx-auto max-w-[1280px] px-5 pt-20 md:px-8">
      <Reveal>
        <h2 className="font-heading text-[28px] font-bold tracking-[-0.02em] text-navy md:text-[34px]">What do you need help with?</h2>
        <p className="mt-2 text-[15px] text-navy/60">Every category in one place. Pick one to see what&apos;s inside.</p>
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
                on ? "text-navy" : "text-navy/65 hover:text-navy/80"
              }`}
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-card transition-colors duration-200 ${on ? "bg-gold/15 text-gold" : "bg-transparent group-hover:bg-navy/[0.04]"}`}>
                <CatIcon k={c.key} />
              </span>
              <span className="whitespace-nowrap">{c.name}</span>
              {on && (
                <motion.span
                  layoutId={reduce ? undefined : `tab-underline-${id}`}
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

/** `listings`: the cards to show, already chosen and trimmed by the page (the first 8 in Accra on the home page). */
export function PopularRail({ title = "Popular in Accra", listings }: { title?: string; listings: CardListing[] }) {
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
          {listings.some((l) => l.isExample) && <p className="mt-1 text-[14px] text-navy/65">Example listings. Real businesses are being added now.</p>}
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

      <div ref={ref} onScroll={update} className="-mx-5 mt-6 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 md:scroll-px-0 [scrollbar-width:none] md:-mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
        {listings.map((l, i) => (
          <Reveal key={l.slug} delay={i * STAGGER} className="w-[78%] shrink-0 snap-start sm:w-[46%] md:w-[calc((100%-48px)/4)]">
            <ListingCard l={l} />
          </Reveal>
        ))}
      </div>
    </section>
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
