import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a production build run alongside the dev server without sharing a build folder.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Bundle Prisma's generated client for the Workers runtime (issue #4).
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  // Uploaded photos live in Supabase Storage (issue #3); let next/image optimise them like local photos.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
};

export default nextConfig;

// Gives `next dev` access to Cloudflare bindings (issue #4).
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
