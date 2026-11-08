"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { EMERGENCY_CITIES, EMERGENCY_SERVICES, telHref } from "@/lib/emergency";
import { DUR, EASE, swap } from "@/lib/motion";

export type PublicContact = {
  id: string;
  city: string; // "" = the whole country
  service: string;
  name: string;
  phone: string;
  altPhone: string | null;
  address: string | null;
  notes: string | null;
  source: string | null;
  sourceUrl: string | null;
  verifiedOn: string;
};

/** City filter + services, with verified numbers only (issue #11). National numbers show in every city. */
export function EmergencyClient({ contacts }: { contacts: PublicContact[] }) {
  const [city, setCity] = useState<string>("Accra");
  const here = contacts.filter((c) => c.city === "" || c.city === city);
  const services = EMERGENCY_SERVICES.filter((s) => s.value !== "other" || here.some((c) => c.service === "other"));
  return (
    <div>
      <ChipGroup label="City" chips={EMERGENCY_CITIES.map((c) => ({ value: c, label: c }))} value={city} onChange={setCity} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.ul key={city} {...swap} transition={{ duration: DUR.base, ease: EASE.out }} className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => {
            const list = here.filter((c) => c.service === s.value);
            return (
              <li key={s.value} className="rounded-card border border-navy/10 bg-white p-5">
                <p className="font-heading text-[17px] font-bold text-navy">{s.label}</p>
                <p className="mt-1 text-[14px] text-navy/65">{s.hint} · {city}</p>
                {list.length === 0 ? (
                  <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-warn-soft px-3 py-1.5 text-[12.5px] font-semibold text-warn">
                    <span className="h-1.5 w-1.5 rounded-full bg-warn-dot" /> Number being verified
                  </p>
                ) : (
                  <ul className="mt-4 space-y-4">
                    {list.map((c) => (
                      <li key={c.id}>
                        <p className="text-[14px] font-semibold text-navy">
                          {c.name}
                          {c.city === "" && <span className="ml-2 rounded-full bg-navy/[0.06] px-2 py-0.5 text-[11px] font-semibold text-navy/60">Nationwide</span>}
                        </p>
                        <p className="mt-1 flex flex-wrap gap-2">
                          <a href={telHref(c.phone)} className="press inline-flex h-11 items-center rounded-full bg-ember px-5 text-[16px] font-bold text-white tabular-nums hover:bg-ember/90">
                            Call {c.phone}
                          </a>
                          {c.altPhone && (
                            <a href={telHref(c.altPhone)} className="press inline-flex h-11 items-center rounded-full border border-navy/15 px-4 text-[15px] font-semibold text-navy tabular-nums hover:border-navy/35">
                              {c.altPhone}
                            </a>
                          )}
                        </p>
                        {(c.address || c.notes) && <p className="mt-2 text-[13.5px] text-navy/65">{[c.address, c.notes].filter(Boolean).join(" · ")}</p>}
                        <p className="mt-1.5 text-[12px] text-navy/65">
                          Verified {c.verifiedOn}
                          {c.source && (
                            <>
                              {" · "}
                              {c.sourceUrl ? (
                                <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-navy">{c.source}</a>
                              ) : (
                                c.source
                              )}
                            </>
                          )}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </motion.ul>
      </AnimatePresence>
    </div>
  );
}
