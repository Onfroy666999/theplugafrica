"use client";

import Image from "next/image";
import Link from "next/link";
import type { ServiceCard } from "@/lib/data";
import { STAGGER } from "@/lib/motion";
import { Arrow } from "./Icons";
import { Reveal } from "./Sections";

/**
 * The services inside a category.
 * Listing categories: photo tiles with the number of businesses.
 * Concierge categories (New Business, #36): larger cards with the description, since there are few and each is a service The Plug delivers.
 */
export function ServiceGrid({ category, services, concierge }: { category: string; services: ServiceCard[]; concierge?: boolean }) {
  if (concierge) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {services.map((s, i) => (
          <Reveal key={s.slug} delay={i * STAGGER}>
            <ServiceCardLink category={category} s={s} />
          </Reveal>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
      {services.map((s, i) => (
        <Reveal key={s.slug} delay={Math.min(i, 8) * STAGGER}>
          <Link href={`/explore/${category}/${s.slug}`} className="group relative block aspect-[4/5] overflow-hidden rounded-card bg-navy/5">
            <Image src={s.image} alt={s.name} fill sizes="(min-width:1024px) 25vw, (min-width:768px) 33vw, 50vw" className="media-zoom object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="font-heading text-[17px] leading-tight font-bold text-white md:text-[19px]">{s.name}</p>
              <p className="mt-1 text-[12.5px] font-medium text-white/75">{s.count > 0 ? `${s.count} ${s.count === 1 ? "business" : "businesses"}` : "Coming soon"}</p>
            </div>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}

/** A service as a card: photo, name, description, link. Also used for "other services" on a service page. */
export function ServiceCardLink({ category, s }: { category: string; s: ServiceCard }) {
  return (
    <Link href={`/explore/${category}/${s.slug}`} className="group flex h-full flex-col overflow-hidden rounded-panel border border-navy/10 bg-white transition-shadow duration-200 hover:shadow-card">
      <span className="relative block aspect-[16/10] overflow-hidden bg-navy/5">
        <Image src={s.image} alt={s.name} fill sizes="(min-width:768px) 33vw, 100vw" className="media-zoom object-cover" />
      </span>
      <span className="flex flex-1 flex-col p-6">
        <span className="font-heading text-[19px] font-bold text-navy">{s.name}</span>
        <span className="mt-2 flex-1 text-[15px] leading-relaxed text-navy/65">{s.description}</span>
        <span className="mt-5 inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-navy">
          See what&apos;s included
          <Arrow className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      </span>
    </Link>
  );
}
