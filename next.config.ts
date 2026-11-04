import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a production build run alongside the dev server without sharing a build folder.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
