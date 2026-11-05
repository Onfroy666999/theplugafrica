// Lists the licensed photos in public/images for the admin photo picker (issue #4).
// Cloudflare Workers have no file system at runtime, so the list is built before `next build` / `next dev`.
import { readdirSync, writeFileSync } from "node:fs";

const files = readdirSync("public/images")
  .filter((f) => /\.(jpe?g|png|webp)$/i.test(f) && f !== "share-card.png") // the share card isn't a listing photo
  .sort()
  .map((f) => `/images/${f}`);
writeFileSync("src/lib/photo-library.json", JSON.stringify(files, null, 2) + "\n");
console.log(`photo-manifest: ${files.length} photos`);
