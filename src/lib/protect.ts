import "server-only";
import { headers } from "next/headers";
import { db } from "./db";

// Abuse protection for public forms and admin sign-in (issue #7).
// Counters live in the database (RateLimit) so every Cloudflare isolate shares them; memory wouldn't.
// Visitors are identified by a salted one-way hash of their IP address; the IP itself is never stored.

export async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
}

/** Salted hash of the caller's IP (Cloudflare sets cf-connecting-ip). */
export async function visitorId() {
  const h = await headers();
  const ip = h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  return sha256(`${process.env.AUTH_SECRET ?? ""}:${ip}`);
}

/** Current count for a key within its window (0 if none or expired). */
export async function peek(key: string) {
  const row = await db.rateLimit.findUnique({ where: { key } });
  return row && row.resetAt > new Date() ? row.count : 0;
}

/** Adds one to a key's counter, starting a new window if the old one has expired. Returns the new count. */
export async function hit(key: string, windowSeconds: number) {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSeconds * 1000);
  const row = await db.rateLimit.findUnique({ where: { key } });
  // Now and then, clear counters that expired more than a day ago.
  if (Math.random() < 0.02) await db.rateLimit.deleteMany({ where: { resetAt: { lt: new Date(now.getTime() - 86_400_000) } } });
  if (!row || row.resetAt <= now) {
    await db.rateLimit.upsert({ where: { key }, create: { key, count: 1, resetAt }, update: { count: 1, resetAt } });
    return 1;
  }
  const updated = await db.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
  return updated.count;
}

export const clear = (key: string) => db.rateLimit.deleteMany({ where: { key } });

/** Seconds the visitor must wait before a form counts as human-made (bots submit instantly). */
const MIN_FILL_MS = 3000;
/** Submissions allowed per visitor per form within the window. */
const FORM_LIMIT = 6;
const FORM_WINDOW_S = 60 * 60;

/**
 * First check on a public form: honeypot, time taken, Turnstile (if configured).
 * Returns "bot" to silently pretend success, an error message to show, or null to carry on.
 */
export async function screenForm(fd: FormData, o: { turnstile?: boolean } = {}): Promise<string | "bot" | null> {
  if (String(fd.get("website") ?? "")) return "bot"; // honeypot: people never fill it
  // Time spent on the form, measured by the browser's own clock (a phone set a few minutes fast can't fail this).
  // Pages opened before this change send only the start time ("_t"): still accepted, measured on the server's clock.
  const elapsed = fd.get("_e") ? Number(fd.get("_e")) : Date.now() - Number(fd.get("_t"));
  if (!Number.isFinite(elapsed) || elapsed < MIN_FILL_MS) return "Please take a moment to check your details, then send again.";
  if (o.turnstile !== false && !(await turnstileOk(String(fd.get("cf-turnstile-response") ?? "")))) return "Please complete the check above the button, then send again.";
  return null;
}

/** Counts a valid submission against the visitor's limit for this form. Returns an error message when over it. */
export async function limitForm(kind: string, max = FORM_LIMIT): Promise<string | null> {
  const count = await hit(`form:${kind}:${await visitorId()}`, FORM_WINDOW_S);
  return count > max ? "You've sent several requests in a short time. Please wait a while, or contact us another way." : null;
}

/** Cloudflare Turnstile, when TURNSTILE_SECRET_KEY is set; passes when it isn't configured. */
async function turnstileOk(token: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  const h = await headers();
  const body = new URLSearchParams({ secret, response: token, remoteip: h.get("cf-connecting-ip") ?? "" });
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  const data = (await res.json().catch(() => ({}))) as { success?: boolean };
  return data.success === true;
}
