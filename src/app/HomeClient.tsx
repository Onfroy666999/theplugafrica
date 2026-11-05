"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { SearchBar } from "@/components/market/SearchBar";
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
import { DUR, EASE } from "@/lib/motion";
import type { Listing } from "@/lib/listings";
import type { ServiceCard } from "@/lib/data";

const SLIDES = [
  { img: "/images/rentals.jpg", cap: "Rentals · Example home, East Legon", pos: "50% 55%" },
  { img: "/images/chauffeur.jpg", cap: "Special Services · Example chauffeur, Accra", pos: "50% 40%" },
  { img: "/images/education.jpg", cap: "Education · Example school, Kumasi", pos: "50% 35%" },
  { img: "/images/dining.jpg", cap: "Entertainment · Example restaurant, Osu", pos: "50% 40%" },
];

export function HomeClient({ listings, services }: { listings: Listing[]; services: Record<string, ServiceCard[]> }) {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="min-h-screen bg-white text-navy">
      <Header />

      {/* Hero: rounded photo panel with a white search card (Thumbtack pattern) */}
      <section className="mx-auto max-w-[1280px] px-3 pt-2 md:px-8 md:pt-4">
        <div className="relative isolate overflow-hidden rounded-hero md:min-h-[600px] md:rounded-hero">
          <div className="absolute inset-0 -z-10 hidden md:block">
            <AnimatePresence initial={false}>
              <motion.div
                key={i}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DUR.crossfade, ease: EASE.inOut }}
              >
                <motion.div
                  className="absolute inset-0"
                  initial={{ transform: "scale(1.06)" }}
                  animate={{ transform: reduce ? "scale(1.06)" : "scale(1)" }}
                  transition={{ duration: 7, ease: "linear" }}
                >
                  <Image src={SLIDES[i].img} alt="" fill priority={i === 0} sizes="(min-width:1280px) 1220px, 100vw" className="object-cover" style={{ objectPosition: SLIDES[i].pos }} />
                </motion.div>
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-black/5 to-transparent" />
          </div>

          {/* Phones: the same cross-fading photos as a panel above the search card */}
          <div className="relative h-56 overflow-hidden rounded-panel bg-navy/5 sm:h-72 md:hidden">
            <AnimatePresence initial={false}>
              <motion.div
                key={i}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DUR.crossfade, ease: EASE.inOut }}
              >
                <Image src={SLIDES[i].img} alt="" fill priority={i === 0} sizes="100vw" className="object-cover" style={{ objectPosition: SLIDES[i].pos }} />
              </motion.div>
            </AnimatePresence>
            <span className="absolute bottom-3 left-3 rounded-full bg-black/50 px-3 py-1.5 text-[11.5px] font-medium text-white backdrop-blur-md">
              {SLIDES[i].cap}
            </span>
          </div>

          <div className="flex items-center md:min-h-[600px] md:p-12 lg:p-16">
            <motion.div
              initial={{ opacity: 0, transform: "translateY(14px)" }}
              animate={{ opacity: 1, transform: "translateY(0px)" }}
              transition={{ duration: DUR.enter, ease: EASE.out }}
              className="w-full rounded-panel bg-white px-2 pt-6 pb-2 md:max-w-[600px] md:p-9 md:shadow-float"
            >
              <h1 className="font-heading text-[36px] leading-[1.06] font-extrabold tracking-[-0.03em] text-navy md:text-[52px]">
                Find people you can <span className="text-gold">trust</span>, anywhere in Africa.
              </h1>
              <p className="mt-4 text-[16px] leading-relaxed text-navy/65 md:text-[17px]">
                Homes, schools, drivers, recruiters, places to eat. Every business is checked before it&apos;s listed.
              </p>
              <div className="mt-7">
                <SearchBar />
              </div>
              <div className="mt-5">
                <TrustChips />
              </div>
            </motion.div>
          </div>

          {/* Caption + slide dots */}
          <div className="absolute right-6 bottom-6 hidden items-center gap-3 md:flex">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={i}
                initial={{ opacity: 0, transform: "translateY(4px)" }}
                animate={{ opacity: 1, transform: "translateY(0px)" }}
                exit={{ opacity: 0, transition: { duration: DUR.fast * 0.6 } }}
                transition={{ duration: DUR.base, ease: EASE.out }}
                className="rounded-full bg-black/45 px-3.5 py-2 text-[12px] font-medium text-white backdrop-blur-md"
              >
                {SLIDES[i].cap}
              </motion.span>
            </AnimatePresence>
            <div className="flex gap-1.5 rounded-full bg-black/35 px-2.5 py-2.5 backdrop-blur-md">
              {SLIDES.map((s, k) => (
                <button
                  key={s.img}
                  aria-label={`Show ${s.cap}`}
                  onClick={() => setI(k)}
                  className={`h-1.5 rounded-full transition-[width,background-color] duration-250 ease-[var(--ease-out)] ${k === i ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <CategoryExplorer services={services} />
      <PopularRail listings={listings} />
      <HowItWorks />
      <ConciergeBand />
      <BusinessAndEmergency />
      <Footer />
      <FloatingConcierge />
    </main>
  );
}
