"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { SPRING } from "@/lib/motion";

export type NavTab = { href: string; label: string; count?: number };
/** A sidebar entry. With several tabs, its pages share a tab bar along the top (SectionTabs). */
export type NavSection = { label: string; tabs: NavTab[] };

const isOnTab = (path: string, href: string) => (href === "/admin" ? path === "/admin" : path === href || path.startsWith(`${href}/`));
const sectionOf = (path: string, sections: NavSection[]) => sections.find((s) => s.tabs.some((t) => isOnTab(path, t.href)));
const total = (s: NavSection) => s.tabs.reduce((n, t) => n + (t.count ?? 0), 0);

function Count({ n }: { n: number }) {
  return n ? <span className="relative rounded-full bg-info px-2 py-0.5 text-[11px] font-bold text-white">{n}</span> : null;
}

/** Admin navigation: vertical on desktop, a swipeable row on phones. Same sliding highlight as the public chips. */
export function AdminNav({ sections, layout }: { sections: NavSection[]; layout: "side" | "top" }) {
  const path = usePathname();
  const reduce = useReducedMotion();
  const current = sectionOf(path, sections);
  return (
    <nav aria-label="Admin" className={layout === "side" ? "flex flex-col gap-1" : "flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"}>
      {sections.map((s) => {
        const on = s === current;
        return (
          <Link
            key={s.label}
            href={s.tabs[0].href}
            aria-current={on ? "page" : undefined}
            className={`press relative flex h-10 shrink-0 items-center justify-between gap-3 rounded-full px-4 text-[14px] font-medium ${on ? "text-navy" : "text-navy/60 hover:text-navy"}`}
          >
            {on && <motion.span layoutId={reduce ? undefined : `admin-nav-${layout}`} transition={SPRING} className="absolute inset-0 rounded-full bg-navy/[0.07]" />}
            <span className="relative">{s.label}</span>
            <Count n={total(s)} />
          </Link>
        );
      })}
    </nav>
  );
}

/** The tabs of the current section (for example Inbox: Enquiries, Concierge, …), above the page. */
export function SectionTabs({ sections }: { sections: NavSection[] }) {
  const path = usePathname();
  const reduce = useReducedMotion();
  const s = sectionOf(path, sections);
  if (!s || s.tabs.length < 2) return null;
  return (
    <nav aria-label={s.label} className="mt-3 mb-6 flex gap-1 overflow-x-auto border-b border-navy/10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {s.tabs.map((t) => {
        const on = isOnTab(path, t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={on ? "page" : undefined}
            className={`press relative flex h-11 shrink-0 items-center gap-2 px-4 text-[14px] font-medium ${on ? "text-navy" : "text-navy/60 hover:text-navy"}`}
          >
            {t.label}
            <Count n={t.count ?? 0} />
            {on && <motion.span layoutId={reduce ? undefined : "admin-section-tab"} transition={SPRING} className="absolute inset-x-3 -bottom-px h-[2.5px] rounded-full bg-navy" />}
          </Link>
        );
      })}
    </nav>
  );
}
