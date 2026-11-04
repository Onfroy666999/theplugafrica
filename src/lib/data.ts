import "server-only";
import type { Business, Credential } from "@prisma/client";
import { db } from "./db";
import type { CatKey } from "./directory";
import type { Listing } from "./listings";
import { PUBLIC_STATUSES } from "./status";

type Row = Business & { credentials: Credential[] };

export function parseImages(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Database row -> the shape the public components already use. */
export function toListing(b: Row): Listing {
  const images = parseImages(b.images);
  return {
    slug: b.slug,
    name: b.name,
    cat: b.category as CatKey,
    kind: b.kind,
    city: b.city,
    area: b.area,
    images: images.length ? images : ["/images/rentals.jpg"],
    blurb: b.blurb,
    about: b.about,
    credentials: b.credentials
      .filter((c) => c.state !== "pending")
      .sort((x, y) => x.position - y.position)
      .map((c) => ({ label: c.label, state: c.state === "verified" ? "verified" : "in-review" })),
    status: b.status === "verified" ? "verified" : "in-review",
    rating: b.rating ?? 0,
    reviewCount: b.reviewCount,
    price: b.price,
    responds: b.responds,
    languages: b.languages.split(",").map((s) => s.trim()).filter(Boolean),
    isExample: b.isExample,
  };
}

const publicWhere = { status: { in: [...PUBLIC_STATUSES] } };

export async function getPublicListings(): Promise<Listing[]> {
  const rows = await db.business.findMany({
    where: publicWhere,
    include: { credentials: true },
    orderBy: [{ status: "desc" }, { rating: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(toListing);
}

export async function getPublicListing(slug: string): Promise<Listing | null> {
  const row = await db.business.findFirst({ where: { slug, ...publicWhere }, include: { credentials: true } });
  return row ? toListing(row) : null;
}
