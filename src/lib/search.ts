// Directory search and filters (Explore page). Pure, so it runs in the browser and in unit tests.
import type { Listing } from "./listings";

export type SearchFilters = { q?: string; cat?: string | null; city?: string; verifiedOnly?: boolean; sort?: string };

/** Rough English word root: strips common endings, keeping at least 3 letters. */
export function root(w: string) {
  const r = w.replace(/(ies|ers|er|ing|es|s|y)$/, "");
  return r.length >= 3 ? r : w;
}

/** Listings matching the filters. Words are compared by root, so "cleaner" finds "cleaning" and "nanny" finds "nannies". */
export function searchListings<T extends Pick<Listing, "name" | "kind" | "area" | "blurb" | "cat" | "city" | "status" | "rating" | "reviewCount">>(
  listings: T[],
  { q = "", cat, city, verifiedOnly, sort = "relevant" }: SearchFilters,
): T[] {
  const words = q
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map(root);
  let r = listings.filter(
    (l) =>
      (!cat || l.cat === cat) &&
      (!city || l.city === city) &&
      (!verifiedOnly || l.status === "verified") &&
      (!words.length || words.some((w) => `${l.name} ${l.kind} ${l.area} ${l.blurb}`.toLowerCase().includes(w))),
  );
  if (sort === "rating") r = [...r].sort((a, b) => b.rating - a.rating);
  if (sort === "reviews") r = [...r].sort((a, b) => b.reviewCount - a.reviewCount);
  return r;
}
