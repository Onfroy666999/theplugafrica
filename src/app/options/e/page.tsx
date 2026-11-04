"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { SearchBar } from "@/components/market/SearchBar";
import { CatIcon } from "@/components/market/Icons";
import {
  BusinessAndEmergency,
  CategoryExplorer,
  ConciergeBand,
  
  FloatingConcierge,
  Footer,
  Header,
  HowItWorks,
  PopularRail,
  TrustChips,
} from "@/components/market/Sections";
import { DUR, EASE, SPRING, STAGGER } from "@/lib/motion";
import { CATS } from "@/lib/directory";

// Photo "chips" framing the search: real scenes, one per need.
const FRAMES = [
  { img: "/images/rentals-3.jpg", label: "Rentals", cls: "left-[2%] top-[8%] h-40 w-32 -rotate-6" },
  { img: "/images/portrait-efua.jpg", label: "Relocation", cls: "left-[9%] top-[52%] h-36 w-36 rotate-3" },
  { img: "/images/chauffeur.jpg", label: "Drivers", cls: "right-[3%] top-[10%] h-36 w-36 rotate-6" },
  { img: "/images/education-2.jpg", label: "Tutors", cls: "right-[10%] top-[54%] h-40 w-32 -rotate-3" },
];

export default function OptionE() {
  const reduce = useReducedMotion();

  return (
    <main className="min-h-screen bg-white text-navy">
      <Header />

      {/* Hero: centred search on a soft brand wash, framed by real photos */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(60%_70%_at_50%_0%,rgba(180,145,63,.18),transparent_70%),radial-gradient(40%_50%_at_85%_80%,rgba(20,23,58,.06),transparent_70%)]" />

        {FRAMES.map((f, k) => (
          <motion.div
            key={f.img}
            className={`absolute hidden overflow-hidden rounded-panel shadow-float ring-4 ring-white xl:block ${f.cls}`}
            initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(18px) scale(0.96)" }}
            animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
            transition={{ delay: 0.25 + k * 0.08, ...SPRING }}
          >
            <Image src={f.img} alt="" fill sizes="160px" className="object-cover" />
            <span className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-navy">{f.label}</span>
          </motion.div>
        ))}

        <div className="relative mx-auto max-w-[820px] px-5 pt-16 pb-14 text-center md:pt-24 md:pb-20">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: DUR.enter }}
            className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-white/70 px-3.5 py-1.5 text-[13px] font-medium text-navy/75"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-gold" /> Now building in Accra
          </motion.p>
          <motion.h1
            initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(12px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            transition={{ delay: 0.05, duration: DUR.enter, ease: EASE.out }}
            className="mt-6 font-heading text-[40px] leading-[1.04] font-extrabold tracking-[-0.035em] text-navy md:text-[68px]"
          >
            The right people for
            <br className="hidden sm:block" /> whatever you need.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, transform: "translateY(10px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            transition={{ delay: 0.12, duration: DUR.enter, ease: EASE.out }}
            className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-navy/65 md:text-[19px]"
          >
            Verified homes, schools, drivers, recruiters and more across Africa. Contact them directly, or let a Plug concierge do it.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, transform: "translateY(10px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            transition={{ delay: 0.2, duration: DUR.enter, ease: EASE.out }}
            className="mx-auto mt-9 max-w-[720px] text-left"
          >
            <SearchBar size="xl" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: DUR.enter }}
            className="mt-5 flex justify-center"
          >
            <TrustChips />
          </motion.div>
        </div>

        {/* Quick category row (Jiji/TaskRabbit pattern, calmer) */}
        <div className="relative mx-auto max-w-[1280px] px-5 pb-6 md:px-8">
          <div className="grid grid-cols-4 gap-2 md:grid-cols-8">
            {CATS.map((c, k) => (
              <motion.a
                key={c.key}
                href="#explore"
                initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(10px)" }}
                animate={{ opacity: 1, transform: "translateY(0px)" }}
                transition={{ delay: 0.4 + k * STAGGER * 0.7, duration: DUR.base, ease: EASE.out }}
                className="group flex flex-col items-center gap-2 rounded-card px-1 py-4 text-center transition-colors duration-150 hover:bg-cream"
              >
                <span className={`flex h-12 w-12 items-center justify-center rounded-card transition-transform duration-200 ease-[var(--ease-out)] [@media(hover:hover)]:group-hover:-translate-y-0.5 ${c.key === "emergency" ? "bg-ember-soft text-ember" : "bg-cream text-navy"}`}>
                  <CatIcon k={c.key} />
                </span>
                <span className="text-[12.5px] leading-tight font-medium text-navy/80">{c.name}</span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      <PopularRail />
      <CategoryExplorer />
      <HowItWorks />
      <ConciergeBand />
      <BusinessAndEmergency />
      <Footer />
      <FloatingConcierge />
    </main>
  );
}
