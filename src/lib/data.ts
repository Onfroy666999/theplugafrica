import "server-only";
import type { Business, Credential, Service } from "@prisma/client";
import { db } from "./db";
import type { CatKey } from "./directory";
import type { Listing } from "./listings";
import { PUBLIC_STATUSES } from "./status";

type Row = Business & { credentials: Credential[]; services?: Service[] };

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
    services: (b.services ?? [])
      .filter((sv) => sv.visible)
      .sort((x, y) => x.position - y.position)
      .map((sv) => ({ slug: sv.slug, name: sv.name })),
  };
}

// What visitors may see. The live site (SITE_ENV=production) hides the design's example businesses; staging and
// local keep them. Staging and production share one database for now (decided 2026-11-06), so this is a filter,
// not a separate dataset. Read per request: Workers expose SITE_ENV from wrangler.jsonc at runtime.
export const publicWhere = () => ({ status: { in: [...PUBLIC_STATUSES] }, ...(process.env.SITE_ENV === "production" && { isExample: false }) });

export async function getPublicListings(): Promise<Listing[]> {
  const rows = await db.business.findMany({
    where: publicWhere(),
    include: { credentials: true, services: true },
    orderBy: [{ status: "desc" }, { rating: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(toListing);
}

export async function getPublicListing(slug: string): Promise<Listing | null> {
  const row = await db.business.findFirst({ where: { slug, ...publicWhere() }, include: { credentials: true, services: true } });
  return row ? toListing(row) : null;
}

/* ---------------- Services (sub-categories, issue #26) ---------------- */

export type ServiceCard = { slug: string; name: string; description: string; image: string; count: number };

const toCard = (s: Service & { _count: { businesses: number } }): ServiceCard => ({
  slug: s.slug,
  name: s.name,
  description: s.description,
  image: s.image || "/images/rentals.jpg",
  count: s._count.businesses,
});

const countPublic = () => ({ _count: { select: { businesses: { where: publicWhere() } } } }) as const;

/** Visible services in one category, in admin order, with the number of public businesses. */
export async function getCategoryServices(category: string): Promise<ServiceCard[]> {
  const rows = await db.service.findMany({ where: { category, visible: true }, orderBy: [{ position: "asc" }, { name: "asc" }], include: countPublic() });
  return rows.map(toCard);
}

/** All visible services grouped by category (homepage tabs). */
export async function getServicesByCategory(): Promise<Record<string, ServiceCard[]>> {
  const rows = await db.service.findMany({ where: { visible: true }, orderBy: [{ position: "asc" }, { name: "asc" }], include: countPublic() });
  const out: Record<string, ServiceCard[]> = {};
  for (const r of rows) (out[r.category] ??= []).push(toCard(r));
  return out;
}

export async function getService(category: string, slug: string): Promise<ServiceCard | null> {
  const r = await db.service.findFirst({ where: { category, slug, visible: true }, include: countPublic() });
  return r ? toCard(r) : null;
}

/** Public businesses offering one service. */
export async function getServiceListings(category: string, slug: string): Promise<Listing[]> {
  const rows = await db.business.findMany({
    where: { ...publicWhere(), category, services: { some: { slug, category } } },
    include: { credentials: true, services: true },
    orderBy: [{ status: "desc" }, { rating: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(toListing);
}

/* ---------------- Search engines (issue #13) ---------------- */

/** Real (non-example) public businesses: the only ones search engines should see. */
const realWhere = () => ({ ...publicWhere(), isExample: false });

/** Services that list at least one real business, with the cities those businesses are in. */
export async function getIndexableServices(): Promise<{ category: string; slug: string; updatedAt: Date; cities: string[] }[]> {
  const rows = await db.service.findMany({
    where: { visible: true, businesses: { some: realWhere() } },
    select: { category: true, slug: true, updatedAt: true, businesses: { where: realWhere(), select: { city: true } } },
  });
  return rows.map((r) => ({ category: r.category, slug: r.slug, updatedAt: r.updatedAt, cities: [...new Set(r.businesses.map((b) => b.city))] }));
}

export async function getIndexableListings() {
  return db.business.findMany({ where: realWhere(), select: { slug: true, updatedAt: true } });
}

/* ---------------- Reviews (issue #14) ---------------- */

export type PublicReview = { name: string; rating: number; body: string; date: Date; response: string | null };

/** Approved reviews for a listing, newest first. */
export async function getApprovedReviews(slug: string, take = 30): Promise<PublicReview[]> {
  const rows = await db.review.findMany({
    where: { status: "approved", business: { slug } },
    orderBy: { createdAt: "desc" },
    take,
    select: { name: true, rating: true, body: true, createdAt: true, response: true },
  });
  return rows.map((r) => ({ name: r.name, rating: r.rating, body: r.body, date: r.createdAt, response: r.response }));
}
