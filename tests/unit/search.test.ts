import { describe, expect, it } from "vitest";
import { root, searchListings } from "@/lib/search";

const base = { area: "Osu", city: "Accra", status: "verified" as const, rating: 4.5, reviewCount: 10 };
const listings = [
  { ...base, name: "Spotless Homes", kind: "Cleaning service", blurb: "Weekly home cleaning", cat: "special-services" as const, rating: 4.9, reviewCount: 3 },
  { ...base, name: "Little Stars", kind: "Nannies and childcare", blurb: "Vetted nannies", cat: "special-services" as const, city: "Kumasi", reviewCount: 40 },
  { ...base, name: "Ridge Suites", kind: "Furnished apartment", blurb: "Two bedrooms near the airport", cat: "rentals" as const, status: "in-review" as const, rating: 4.1 },
];
const names = (r: { name: string }[]) => r.map((l) => l.name);

describe("search", () => {
  it("returns everything with no filters", () => {
    expect(searchListings(listings, {})).toHaveLength(3);
  });

  it("matches word roots: 'cleaner' finds cleaning, 'nanny' finds nannies", () => {
    expect(names(searchListings(listings, { q: "cleaner" }))).toEqual(["Spotless Homes"]);
    expect(names(searchListings(listings, { q: "nanny" }))).toEqual(["Little Stars"]);
    expect(root("apartments")).toBe("apartment");
  });

  it("is case-insensitive, ignores short words and matches any word", () => {
    expect(names(searchListings(listings, { q: "AIRPORT" }))).toEqual(["Ridge Suites"]);
    expect(searchListings(listings, { q: "a an of" })).toHaveLength(3);
    expect(names(searchListings(listings, { q: "nanny apartment" }))).toEqual(["Little Stars", "Ridge Suites"]);
  });

  it("filters by category, city and verified only", () => {
    expect(names(searchListings(listings, { cat: "rentals" }))).toEqual(["Ridge Suites"]);
    expect(names(searchListings(listings, { city: "Kumasi" }))).toEqual(["Little Stars"]);
    expect(names(searchListings(listings, { verifiedOnly: true }))).toEqual(["Spotless Homes", "Little Stars"]);
  });

  it("sorts by rating or number of reviews without changing the input", () => {
    expect(names(searchListings(listings, { sort: "rating" }))[0]).toBe("Spotless Homes");
    expect(names(searchListings(listings, { sort: "reviews" }))[0]).toBe("Little Stars");
    expect(names(listings)[0]).toBe("Spotless Homes");
  });
});
