"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { DUR, EASE, swap } from "@/lib/motion";

const CITIES = ["Accra", "Kumasi", "Takoradi", "Tamale"];
const SERVICES = [
  { t: "Ambulance", d: "National Ambulance Service" },
  { t: "Police", d: "Ghana Police Service" },
  { t: "Fire", d: "Ghana National Fire Service" },
  { t: "Hospitals", d: "Nearest hospitals with an emergency unit" },
  { t: "Embassies", d: "Consular help for foreign nationals" },
  { t: "Pharmacies", d: "Late-night and 24-hour pharmacies" },
];

/** City filter + services. Numbers are deliberately not shown until verified per city (see CLAUDE.md open items). */
export function EmergencyClient() {
  const [city, setCity] = useState("Accra");
  return (
    <div>
      <ChipGroup label="City" chips={CITIES.map((c) => ({ value: c, label: c }))} value={city} onChange={setCity} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.ul key={city} {...swap} transition={{ duration: DUR.base, ease: EASE.out }} className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <li key={s.t} className="rounded-card border border-navy/10 bg-white p-5">
              <p className="font-heading text-[17px] font-bold text-navy">{s.t}</p>
              <p className="mt-1 text-[14px] text-navy/55">{s.d} · {city}</p>
              <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-warn-soft px-3 py-1.5 text-[12.5px] font-semibold text-warn">
                <span className="h-1.5 w-1.5 rounded-full bg-warn-dot" /> Number being verified
              </p>
            </li>
          ))}
        </motion.ul>
      </AnimatePresence>
    </div>
  );
}
