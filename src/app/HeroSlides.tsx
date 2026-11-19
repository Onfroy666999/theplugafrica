"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { DUR, EASE } from "@/lib/motion";

import type { SiteImage } from "@/lib/site-images";

/**
 * The home hero's cross-fading photos (issue #76). Its own small component, so changing the photo re-renders only this,
 * not the whole page. One photo layer serves both layouts: a panel above the search card on phones, the full hero
 * background from tablet up. Plays only while visible, stops when someone picks a photo, and doesn't play at all
 * with reduced motion (auto-moving content needs a way to stop it). The photos are chosen in Admin › Site photos (#112).
 */
export function HeroSlides({ slides, children }: { slides: SiteImage[]; children: React.ReactNode }) {
  const [i, setI] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [visible, setVisible] = useState(true);
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (stopped || reduce || !visible) return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible") setI((n) => (n + 1) % slides.length);
    }, 6000);
    return () => clearInterval(t);
  }, [stopped, reduce, visible, slides.length]);

  const s = slides[i] ?? slides[0];
  return (
    <>
      <div ref={ref} className="relative h-56 overflow-hidden rounded-panel bg-navy/5 sm:h-72 md:absolute md:inset-0 md:-z-10 md:h-auto md:rounded-none">
        <AnimatePresence initial={false}>
          <motion.div key={i} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: DUR.crossfade, ease: EASE.inOut }}>
            <Image src={s.url} alt={s.alt} fill priority={i === 0} sizes="(min-width:1280px) 1220px, 100vw" className="object-cover" style={{ objectPosition: s.position }} />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 hidden bg-gradient-to-r from-black/35 via-black/5 to-transparent md:block" />
        {/* Solid backing rather than a blur: a blur over a changing photo is recalculated every frame. */}
        <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1.5 text-[11.5px] font-medium text-white md:hidden">{s.caption}</span>
      </div>

      {children}

      <div className="absolute right-6 bottom-6 hidden items-center gap-3 md:flex">
        <span className="rounded-full bg-black/55 px-3.5 py-2 text-[12px] font-medium text-white">{s.caption}</span>
        <div className="flex gap-1.5 rounded-full bg-black/45 px-2.5 py-2.5">
          {slides.map((x, k) => (
            <button
              key={k}
              aria-label={`Show photo ${k + 1}${x.caption ? `: ${x.caption}` : ""}`}
              aria-pressed={k === i}
              onClick={() => {
                setI(k);
                setStopped(true);
              }}
              className={`h-1.5 rounded-full transition-[width,background-color] duration-250 ease-[var(--ease-out)] ${k === i ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"}`}
            />
          ))}
        </div>
      </div>
    </>
  );
}
