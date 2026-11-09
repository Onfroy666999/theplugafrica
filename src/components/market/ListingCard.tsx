"use client";

import Image from "next/image";
import Link from "next/link";
import type { CardListing } from "@/lib/listings";
import { Heart, Shield, Star } from "./Icons";
import { useSaved } from "./saved";

export function StatusBadge({ status, className = "" }: { status: CardListing["status"]; className?: string }) {
  return status === "verified" ? (
    <span className={`inline-flex items-center gap-1 text-[12px] font-semibold text-ok ${className}`}>
      <Shield className="h-4 w-4" /> Verified
    </span>
  ) : (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold text-warn ${className}`}>
      <span className="h-2 w-2 rounded-full bg-warn-dot" /> Verification in review
    </span>
  );
}

/** `priority`: load the photo straight away; set it for the first cards on a page, which are usually the largest thing on screen (issue #30). */
export function ListingCard({ l, sizes = "(min-width:1024px) 25vw, (min-width:640px) 50vw, 90vw", priority = false }: { l: CardListing; sizes?: string; priority?: boolean }) {
  const [saved, toggle] = useSaved(l.slug);
  return (
    <Link href={`/listing/${l.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-card bg-navy/5">
        <Image src={l.images[0]} alt={l.name} fill sizes={sizes} priority={priority} className="object-cover media-zoom" />
        {l.isExample && <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-navy shadow-sm">Example</span>}
        <button
          aria-label={saved ? `Remove ${l.name} from saved` : `Save ${l.name}`}
          aria-pressed={saved}
          onClick={(e) => {
            // Inside the card's link: save without opening the listing.
            e.preventDefault();
            e.stopPropagation();
            toggle();
          }}
          className="absolute top-1.5 right-1.5 flex h-11 w-11 items-center justify-center transition-transform duration-150 ease-[var(--ease-out)] active:scale-90"
        >
          <Heart filled={saved} className="h-6 w-6" />
        </button>
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <p className="font-heading text-[15px] leading-snug font-bold text-navy">{l.name}</p>
        <span className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-navy">
          {l.reviewCount > 0 ? (
            <>
              <Star className="h-3.5 w-3.5 text-gold" /> {l.rating.toFixed(1)}
            </>
          ) : (
            <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-semibold text-gold-ink">New</span>
          )}
        </span>
      </div>
      <p className="text-[14px] text-navy/60">
        {l.kind} · {l.area}, {l.city}
      </p>
      <StatusBadge status={l.status} className="mt-1.5" />
    </Link>
  );
}
