import "server-only";
import images from "@/lib/photo-library.json";
import { onWorkers } from "@/lib/runtime";
import { listStoragePhotos, storageEnabled } from "@/lib/storage";

/**
 * Photos for the admin pickers: uploaded photos first (Supabase Storage when configured, otherwise
 * public/uploads on a local server), then the licensed photos in public/images (listed at build time,
 * see scripts/photo-manifest.mjs). Issues #3 and #4.
 */
export async function photoLibrary(): Promise<string[]> {
  if (storageEnabled()) return [...(await listStoragePhotos()), ...images];
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
