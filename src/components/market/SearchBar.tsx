"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FIND_PLACEHOLDERS } from "@/lib/directory";
import { Pin, Search } from "./Icons";
import { DUR, EASE } from "@/lib/motion";
import { Select, toOptions } from "@/components/ui/Select";
import { buttonStyles } from "@/components/ui/Button";

const CITY_OPTIONS = toOptions(["Any city", "Accra", "Kumasi", "Takoradi", "Tamale"]);

/** Search with an animated example placeholder (pauses while the field is in use). */
export function SearchBar({ size = "lg", initialQ = "", initialCity = "Accra" }: { size?: "lg" | "xl"; initialQ?: string; initialCity?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [city, setCity] = useState(initialCity);
  const [focus, setFocus] = useState(false);
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();
  const idle = !q && !focus;

  useEffect(() => {
    if (!idle) return;
    const t = setInterval(() => setI((n) => (n + 1) % FIND_PLACEHOLDERS.length), 2600);
    return () => clearInterval(t);
  }, [idle]);

  const h = size === "xl" ? "md:h-[68px]" : "md:h-[60px]";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const p = new URLSearchParams();
        if (q.trim()) p.set("q", q.trim());
        if (city) p.set("city", city);
        router.push(`/explore?${p.toString()}`);
      }}
      className={`flex flex-col gap-2 rounded-panel border bg-white p-2 transition-[box-shadow,border-color] duration-200 md:flex-row md:items-center md:gap-0 md:rounded-full md:p-1.5 ${
        focus ? "border-navy/25 shadow-float" : "border-navy/12 shadow-card"
      }`}
    >
      <label className={`relative flex h-14 min-w-0 flex-1 items-center gap-3 px-4 ${h}`}>
        <Search className="h-5 w-5 shrink-0 text-navy/65" />
        <span className="relative min-w-0 flex-1">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            aria-label="What do you need?"
            className="w-full bg-transparent text-[16px] text-navy outline-none"
          />
          {!q && (
            <span className="pointer-events-none absolute inset-0 flex items-center overflow-hidden text-[16px] whitespace-nowrap text-navy/65">
              <span className="mr-1">Find</span>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={i}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(60%)" }}
                  animate={{ opacity: 1, transform: "translateY(0%)" }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(-60%)" }}
                  transition={{ duration: DUR.base, ease: EASE.out }}
                  className="truncate"
                >
                  {FIND_PLACEHOLDERS[i]}
                </motion.span>
              </AnimatePresence>
            </span>
          )}
        </span>
      </label>
      <span className="hidden h-8 w-px bg-navy/10 md:block" />
      <div className={`flex h-14 items-center rounded-card bg-navy/[0.03] px-4 md:w-[160px] md:bg-transparent ${h}`}>
        <Select variant="bare" label="City" options={CITY_OPTIONS} value={city} onChange={setCity} icon={<Pin className="h-5 w-5" />} />
      </div>
      <button type="submit" className={`${buttonStyles({ size: "lg" })} rounded-card md:rounded-full ${h}`}>
        <Search className="h-[18px] w-[18px] md:hidden" /> Search
      </button>
    </form>
  );
}
