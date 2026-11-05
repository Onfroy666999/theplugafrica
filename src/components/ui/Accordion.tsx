"use client";

import { Accordion as A } from "@base-ui/react/accordion";

/** The one FAQ list (issue #38). One answer open at a time; the panel height animates via `.ui-accordion-panel`. */
export function Accordion({ items, className = "" }: { items: { q: string; a: string }[]; className?: string }) {
  return (
    <A.Root className={`divide-y divide-navy/10 border-y border-navy/10 ${className}`}>
      {items.map((it) => (
        <A.Item key={it.q}>
          <A.Header>
            <A.Trigger className="group flex w-full items-center justify-between gap-6 py-5 text-left font-heading text-[16.5px] font-bold text-navy transition-colors duration-200 hover:text-navy/75 md:text-[17.5px]">
              {it.q}
              <span aria-hidden="true" className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-navy/15 transition-colors duration-200 group-hover:border-navy/35 group-data-[panel-open]:bg-navy group-data-[panel-open]:text-white">
                <span className="absolute h-[1.6px] w-3 rounded-full bg-current" />
                <span className="absolute h-3 w-[1.6px] rounded-full bg-current transition-transform duration-200 ease-[var(--ease-out)] group-data-[panel-open]:scale-y-0" />
              </span>
            </A.Trigger>
          </A.Header>
          <A.Panel className="ui-accordion-panel">
            <p className="max-w-3xl pb-6 text-[15.5px] leading-relaxed text-navy/70">{it.a}</p>
          </A.Panel>
        </A.Item>
      ))}
    </A.Root>
  );
}
