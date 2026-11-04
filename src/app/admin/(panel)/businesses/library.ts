import "server-only";
import { readdir } from "node:fs/promises";
import path from "node:path";

/** Licensed photos in public/images plus anything uploaded, for the photo picker. */
export async function photoLibrary(): Promise<string[]> {
  const read = async (dir: string, base: string) => {
    try {
      return (await readdir(path.join(process.cwd(), "public", dir)))
        .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
        .map((f) => `${base}/${f}`);
    } catch {
      return [];
    }
  };
  return [...(await read("uploads", "/uploads")), ...(await read("images", "/images"))];
}
