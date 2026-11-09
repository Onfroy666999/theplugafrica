import type { MetadataRoute } from "next";
import { isStaging } from "@/lib/runtime";
import { SITE_URL } from "@/lib/site";

// Read per request so the staging Worker can refuse all crawlers (issue #4).
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  if (isStaging()) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/options", "/account"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
