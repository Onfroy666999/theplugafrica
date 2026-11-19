import { describe, expect, it } from "vitest";
import { SITE_IMAGE_SLOTS, defaultSiteImages, emergencyTiles, getSlot, heroSlides, mergeSiteImages } from "@/lib/site-images";

const allowed = (u: string) => u.startsWith("/");

describe("site photos (issue #112)", () => {
  it("has unique slots covering the hero, every category header and the page headers", () => {
    const keys = SITE_IMAGE_SLOTS.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(heroSlides(defaultSiteImages())).toHaveLength(4);
    expect(keys).toEqual(expect.arrayContaining(["category.rentals", "category.education", "page.about", "page.emergency", "home.concierge"]));
    expect(emergencyTiles(defaultSiteImages())).toHaveLength(4);
  });

  it("puts changes over the built-in photos and drops the built-in focal point", () => {
    const img = mergeSiteImages([{ key: "hero.1", url: "/uploads/a.jpg", alt: "A", caption: "Cap" }], allowed);
    expect(img["hero.1"]).toEqual({ url: "/uploads/a.jpg", alt: "A", caption: "Cap", position: undefined });
    expect(img["hero.2"].url).toBe(getSlot("hero.2")!.url);
  });

  it("keeps the built-in caption and description when left empty", () => {
    const img = mergeSiteImages([{ key: "hero.1", url: getSlot("hero.1")!.url, alt: "", caption: "" }], allowed);
    expect(img["hero.1"].caption).toBe(getSlot("hero.1")!.caption);
    expect(img["hero.1"].position).toBe(getSlot("hero.1")!.position);
  });

  it("ignores unknown slots, photos from elsewhere, and captions on slots without one", () => {
    const img = mergeSiteImages(
      [
        { key: "nope", url: "/uploads/a.jpg", alt: "", caption: "" },
        { key: "page.about", url: "https://evil.example/x.jpg", alt: "", caption: "" },
        { key: "page.emergency", url: "/uploads/b.jpg", alt: "", caption: "Should not show" },
      ],
      allowed,
    );
    expect(img.nope).toBeUndefined();
    expect(img["page.about"].url).toBe("/images/market.jpg");
    expect(img["page.emergency"].caption).toBe("");
  });
});
