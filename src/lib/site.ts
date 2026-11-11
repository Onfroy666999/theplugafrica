// Site-wide SEO helpers (issue #13).
import type { Metadata } from "next";
import { CITIES } from "./listings";

/** Public address of the site. Set NEXT_PUBLIC_SITE_URL in each environment (e.g. https://theplugafrica.org). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
export const SITE_NAME = "The Plug Africa";

export const abs = (path: string) => (path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`);

export const citySlug = (city: string) => city.toLowerCase().replace(/\s+/g, "-");
export const cityFromSlug = (slug: string) => CITIES.find((c) => citySlug(c) === slug) ?? null;

/**
 * Title, description, canonical address and share preview for one page.
 * Child pages replace (not merge) openGraph, so every page builds the whole object here.
 */
export function pageMeta({ title, description, path, image, noindex }: { title: string; description: string; path?: string; image?: string; noindex?: boolean }): Metadata {
  // Without its own photo a page uses the branded share card: a fixed PNG (Workers have no disk to read fonts from at runtime, issue #4).
  const images = [{ url: abs(image ?? "/images/share-card.png"), width: 1200, height: 630, alt: title }];
  return {
    title,
    description,
    ...(path && { alternates: { canonical: path } }),
    openGraph: { title, description, ...(path && { url: path }), siteName: SITE_NAME, locale: "en_GH", type: "website", images },
    twitter: { card: "summary_large_image", title, description, images: images.map((i) => i.url) },
    ...(noindex && { robots: { index: false, follow: true } }),
  };
}

/** Renders schema.org structured data. `<` is escaped so text can't close the script tag. */
export function jsonLd(data: object) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029") };
}
