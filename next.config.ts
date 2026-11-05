import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a production build run alongside the dev server without sharing a build folder.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Bundle Prisma's generated client for the Workers runtime (issue #4).
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
};

export default nextConfig;

// Gives `next dev` access to Cloudflare bindings (issue #4).
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
