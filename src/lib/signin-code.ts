// Sign-in codes for visitor accounts (issue #82). Pure helpers, shared by the server code and the unit tests.

export const CODE_LENGTH = 6;
/** How long a code works. */
export const CODE_MINUTES = 10;
/** Wrong tries allowed per code before a new one is needed. */
export const CODE_TRIES = 5;

export const normaliseEmail = (e: string) => e.trim().toLowerCase();

/** Digits only, so "123 456" and "123-456" are accepted as typed or pasted. */
export const cleanCode = (c: unknown) => String(c ?? "").replace(/\D/g, "");

/** A random 6-digit code. Values above the last whole million are redrawn, so every code is equally likely. */
export function makeCode(): string {
  const buf = new Uint32Array(1);
  const limit = Math.floor(0x1_0000_0000 / 1_000_000) * 1_000_000;
  do crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return String(buf[0] % 1_000_000).padStart(CODE_LENGTH, "0");
}

/** What is stored instead of the code: a salted hash tied to the email, so a leaked table reveals no codes. */
export async function hashCode(secret: string, email: string, code: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${secret}:signin:${normaliseEmail(email)}:${code}`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Where to go after signing in: a path on this site only, never another site, the admin or the sign-in page itself. */
export function safeNext(next: unknown, fallback = "/account") {
  const n = typeof next === "string" ? next : "";
  // Browsers drop tabs and newlines and read a backslash as "/", so "/<tab>/evil.com" would become "//evil.com".
  if (!n.startsWith("/") || n.startsWith("//") || /[\u0000-\u0020\\]/.test(n)) return fallback;
  if (n.startsWith("/admin") || n.startsWith("/account/sign-in")) return fallback;
  return n;
}
