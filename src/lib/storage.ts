import "server-only";

// Photo storage in Supabase Storage (issue #3).
// Uploads go to a public bucket through the Storage REST API using a secret key that only the server sees.
// Configure with SUPABASE_URL (the project URL, not a secret) and SUPABASE_SECRET_KEY (a Worker secret).
// Without them (e.g. a local server), uploads fall back to public/uploads on disk.

const BUCKET = process.env.SUPABASE_BUCKET || "business-photos";

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SECRET_KEY;
  return url && key ? { url, key } : null;
}

export const storageEnabled = () => config() !== null;

/** Public address prefix of files in the bucket, e.g. https://<ref>.supabase.co/storage/v1/object/public/business-photos/ */
export function publicPrefix() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  return url ? `${url}/storage/v1/object/public/${BUCKET}/` : null;
}

/** Photos the site may show: licensed/local files ("/images/...", "/uploads/...") or files in our own bucket. */
export function isAllowedPhoto(src: string) {
  if (src.startsWith("/") && !src.startsWith("//") && !src.startsWith("/\\")) return true;
  const prefix = publicPrefix();
  return prefix !== null && src.startsWith(prefix);
}

const headers = (key: string) => ({ apikey: key, Authorization: `Bearer ${key}` });

/** Uploads one file and returns its public URL. */
export async function uploadToStorage(name: string, body: ArrayBuffer, contentType: string): Promise<string> {
  const c = config();
  if (!c) throw new Error("Storage is not configured.");
  const path = `uploads/${name}`;
  const res = await fetch(`${c.url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: { ...headers(c.key), "Content-Type": contentType, "Cache-Control": "max-age=31536000", "x-upsert": "false" },
    body,
  });
  if (!res.ok) throw new Error(`Storage upload failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  return `${publicPrefix()}${path}`;
}

/** Public URLs of uploaded photos, newest first. */
export async function listStoragePhotos(): Promise<string[]> {
  const c = config();
  if (!c) return [];
  const res = await fetch(`${c.url}/storage/v1/object/list/${BUCKET}`, {
    method: "POST",
    headers: { ...headers(c.key), "Content-Type": "application/json" },
    body: JSON.stringify({ prefix: "uploads", limit: 500, sortBy: { column: "created_at", order: "desc" } }),
  });
  if (!res.ok) return [];
  const rows = (await res.json()) as { name: string; id: string | null }[];
  return rows.filter((r) => r.id && /\.(jpe?g|png|webp)$/i.test(r.name)).map((r) => `${publicPrefix()}uploads/${r.name}`);
}
