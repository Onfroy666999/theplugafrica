"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";
import { SPRING } from "@/lib/motion";

export type Chip = { value: string; label: string; icon?: React.ReactNode };

/**
 * Single-select pill filters. The navy highlight slides between chips (one spring, site-wide).
 * Used for: Explore categories, Emergency cities.
 */
export function ChipGroup({ chips, value, onChange, label, className = "" }: { chips: Chip[]; value: string; onChange: (v: string) => void; label: string; className?: string }) {
  const id = useId();
  const reduce = useReducedMotion();
  return (
    <div role="radiogroup" aria-label={label} className={`flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}>
      {chips.map((c) => {
        const on = c.value === value;
        return (
          <button
            key={c.value}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(c.value)}
            className={`press relative flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-[14px] font-medium ${on ? "border-navy text-white" : "border-navy/15 text-navy hover:border-navy/35"}`}
          >
            {on && (
              <motion.span
                layoutId={reduce ? undefined : `chip-${id}`}
                className="absolute inset-0 rounded-full bg-navy"
                transition={SPRING}
              />
            )}
            <span className="relative flex items-center gap-2">
              {c.icon}
              {c.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
