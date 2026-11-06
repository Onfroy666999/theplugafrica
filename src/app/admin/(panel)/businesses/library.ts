import "server-only";
import images from "@/lib/photo-library.json";
import { onWorkers } from "@/lib/runtime";

/**
 * Licensed photos in public/images (listed at build time, see scripts/photo-manifest.mjs) plus, on a local
 * server, anything uploaded to public/uploads. Hosted uploads move to Supabase Storage with issue #3.
 */
export async function photoLibrary(): Promise<string[]> {
  if (onWorkers) return images;
  try {
    const { readdir } = await import("node:fs/promises");
    const path = await import("node:path");
    const uploads = (await readdir(path.join(process.cwd(), "public", "uploads"))).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).map((f) => `/uploads/${f}`);
    return [...uploads, ...images];
  } catch {
    return images;
  }
}
