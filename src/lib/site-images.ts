// Every photo on the site that the admin can change (issue #112), with the built-in photo each one starts with.
// Admin › Site photos lists these; a changed slot is stored in the SiteImage table, and "Reset" goes back to the
// photo here. Business and service photos aren't here: they're edited on the business and in Admin › Services.

import { CATEGORY_CONTENT } from "./content";
import { CATS } from "./directory";

export type SiteImage = {
  url: string;
  alt: string;
  /** Hero slides only: the line shown on the photo. */
  caption: string;
  /** Focal point for the built-in photo (CSS object-position); a replaced photo is centred. */
  position?: string;
};

export type SiteImageSlot = SiteImage & {
  key: string;
  group: SiteImageGroup;
  label: string;
  /** Where it appears and what shape it is shown in, to help choose a photo that fits. */
  where: string;
  hasCaption?: boolean;
};

export type SiteImageGroup = "hero" | "category" | "page" | "home" | "emergency";

export const SITE_IMAGE_GROUPS: { id: SiteImageGroup; title: string; sub: string }[] = [
  { id: "hero", title: "Home: hero slideshow", sub: "The four photos that cross-fade behind the search on the home page. Wide, landscape photos work best." },
  { id: "category", title: "Category headers", sub: "The photo at the top of each category page, shown in a 4:3 frame." },
  { id: "page", title: "Page headers", sub: "The large photos at the top of other pages. Text sits over the left side of most of them." },
  { id: "home", title: "Home: bands", sub: "The concierge band and the “Run a business?” panel further down the home page." },
  { id: "emergency", title: "Home: Emergency tiles", sub: "The four tiles shown under the Emergency tab on the home page." },
];

const hero = (n: number, url: string, caption: string, position: string): SiteImageSlot => ({
  key: `hero.${n}`,
  group: "hero",
  label: `Slide ${n}`,
  where: "Home page, behind the search card",
  url,
  alt: "",
  caption,
  position,
  hasCaption: true,
});

const slot = (key: string, group: SiteImageGroup, label: string, where: string, url: string, alt: string, position?: string): SiteImageSlot => ({
  key, group, label, where, url, alt, caption: "", position,
});

export const SITE_IMAGE_SLOTS: SiteImageSlot[] = [
  hero(1, "/images/rentals.jpg", "Rentals · Example home, East Legon", "50% 55%"),
  hero(2, "/images/chauffeur.jpg", "Special Services · Example chauffeur, Accra", "50% 40%"),
  hero(3, "/images/education.jpg", "Education · Example school, Kumasi", "50% 35%"),
  hero(4, "/images/dining.jpg", "Entertainment · Example restaurant, Osu", "50% 40%"),

  ...CATS.flatMap((c) => {
    const content = CATEGORY_CONTENT[c.key];
    return content ? [slot(`category.${c.key}`, "category", c.name, `Top of /explore/${c.key}`, content.image, content.imageAlt)] : [];
  }),

  slot("page.about", "page", "About", "Top of /about, beside the introduction", "/images/market.jpg", "A trader at her stall on a street in Ghana", "50% 30%"),
  slot("page.businesses", "page", "For businesses", "Behind the heading of /businesses", "/images/jobs.jpg", "Business team in a meeting"),
  slot("page.concierge", "page", "Concierge", "On /concierge, under the list of what a concierge does (large screens)", "/images/chauffeur.jpg", "Example chauffeur opening a car door"),
  slot("page.emergency", "page", "Emergency", "Behind the heading of /emergency", "/images/emergency.jpg", "Ambulance crew at work"),

  slot("home.concierge", "home", "Concierge band", "Right half of the navy concierge band", "/images/portrait-efua.jpg", "Example concierge", "50% 0%"),
  slot("home.business", "home", "Run a business? panel", "Behind the “Run a business? Get found.” panel", "/images/jobs.jpg", "Business team in a meeting"),

  ...(CATS.find((c) => c.key === "emergency")?.tiles ?? []).map((t, i) => slot(`emergency.${i + 1}`, "emergency", t.title, "Home page › Emergency tab", t.img, t.title)),
];

export const getSlot = (key: string) => SITE_IMAGE_SLOTS.find((s) => s.key === key);

export type SiteImages = Record<string, SiteImage>;

/** The built-in photos, keyed by slot. */
export function defaultSiteImages(): SiteImages {
  return Object.fromEntries(SITE_IMAGE_SLOTS.map((s) => [s.key, { url: s.url, alt: s.alt, caption: s.caption, position: s.position }]));
}

/** Puts the admin's changes over the built-in photos. A changed photo loses the built-in focal point. */
export function mergeSiteImages(rows: { key: string; url: string; alt: string; caption: string }[], allowed: (url: string) => boolean): SiteImages {
  const out = defaultSiteImages();
  for (const r of rows) {
    const s = getSlot(r.key);
    if (!s || !allowed(r.url)) continue;
    out[r.key] = { url: r.url, alt: r.alt || (r.url === s.url ? s.alt : ""), caption: s.hasCaption ? r.caption || s.caption : "", position: r.url === s.url ? s.position : undefined };
  }
  return out;
}

/** The hero slides in order. */
export const heroSlides = (img: SiteImages) => SITE_IMAGE_SLOTS.filter((s) => s.group === "hero").map((s) => img[s.key]);
/** The home Emergency tiles in order, with their titles. */
export const emergencyTiles = (img: SiteImages) => SITE_IMAGE_SLOTS.filter((s) => s.group === "emergency").map((s) => ({ title: s.label, img: img[s.key].url }));
