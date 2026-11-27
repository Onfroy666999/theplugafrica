import type { MetadataRoute } from "next";
import { getCategoryServices, getIndexableListings, getIndexableServices } from "@/lib/data";
import { CATS, listsBusinesses } from "@/lib/directory";
import { CITIES } from "@/lib/listings";
import { SITE_URL, citySlug } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * Every public page worth finding (issue #13). Service and city pages are listed only once they
 * show a real business, and example listings are never listed, so search engines don't index placeholders.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const conciergeCats = CATS.filter((c) => c.concierge);
  const [services, listings, ...conciergeServices] = await Promise.all([getIndexableServices(), getIndexableListings(), ...conciergeCats.map((c) => getCategoryServices(c.key))]);
  const u = (path: string, extra: Partial<MetadataRoute.Sitemap[number]> = {}) => ({ url: `${SITE_URL}${path}`, ...extra });

  return [
    u("/", { changeFrequency: "daily", priority: 1 }),
    u("/explore", { changeFrequency: "daily", priority: 0.9 }),
    ...CATS.filter((c) => c.key !== "emergency").map((c) => u(`/explore/${c.key}`, { changeFrequency: "weekly", priority: 0.8 })),
    // Services The Plug delivers itself (New Business, #36) are real pages from day one.
    ...conciergeCats.flatMap((c, i) => conciergeServices[i].filter((s) => !listsBusinesses(c.key, s.slug)).map((s) => u(`/explore/${c.key}/${s.slug}`, { changeFrequency: "monthly", priority: 0.8 }))),
    ...services.flatMap((s) => [
      u(`/explore/${s.category}/${s.slug}`, { lastModified: s.updatedAt, changeFrequency: "weekly", priority: 0.7 }),
      ...s.cities.filter((c) => CITIES.includes(c)).map((c) => u(`/explore/${s.category}/${s.slug}/${citySlug(c)}`, { lastModified: s.updatedAt, priority: 0.6 })),
    ]),
    ...listings.map((l) => u(`/listing/${l.slug}`, { lastModified: l.updatedAt, priority: 0.6 })),
    u("/concierge", { priority: 0.7 }),
    u("/membership", { priority: 0.6 }),
    u("/businesses", { priority: 0.5 }),
    u("/emergency", { priority: 0.5 }),
    u("/about", { priority: 0.5 }),
    u("/contact", { priority: 0.4 }),
  ];
}
