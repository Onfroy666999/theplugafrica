"use client";

import Image from "next/image";
import Link from "next/link";
import type { ServiceCard } from "@/lib/data";
import { STAGGER } from "@/lib/motion";
import { Reveal } from "./Sections";

/** Photo tiles for the services inside a category. Each links to that service's businesses. */
export function ServiceGrid({ category, services, concierge }: { category: string; services: ServiceCard[]; concierge?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
      {services.map((s, i) => (
        <Reveal key={s.slug} delay={Math.min(i, 8) * STAGGER}>
            <Link href={`/explore/${category}/${s.slug}`} className="group relative block aspect-[4/5] overflow-hidden rounded-card bg-navy/5">
              <Image src={s.image} alt={s.name} fill sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, 50vw" className="media-zoom object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="font-heading text-[17px] leading-tight font-bold text-white md:text-[19px]">{s.name}</p>
                <p className="mt-1 text-[12.5px] font-medium text-white/75">
                  {concierge ? "Handled by The Plug" : s.count > 0 ? `${s.count} ${s.count === 1 ? "business" : "businesses"}` : "Coming soon"}
                </p>
              </div>
            </Link>
        </Reveal>
      ))}
    </div>
  );
}
