// What an error alert says (issue #8). Pure, so it's unit-tested. Deliberately short: only the error's first line and a
// few stack frames, and the page path without its query string, so visitors' details never end up in an email.

export type ErrorSummary = { message: string; digest: string | null; frames: string[] };

export function summariseError(err: unknown): ErrorSummary {
  const e: Error & { digest?: string } = err instanceof Error ? err : new Error(String(err));
  const first = (e.message || e.name || "Unknown error").split("\n")[0].trim();
  const frames = (e.stack ?? "")
    .split("\n")
    .slice(1)
    .map((l) => l.trim())
    .filter((l) => l.startsWith("at "))
    .slice(0, 5)
    .map((l) => l.slice(0, 200));
  return { message: `${e.name && !first.startsWith(e.name) ? `${e.name}: ` : ""}${first}`.slice(0, 300), digest: e.digest ?? null, frames };
}

/** The path only: query strings can carry search terms, names or phone numbers. */
export const safePath = (path: string) => path.split("?")[0].split("#")[0].slice(0, 200);

/** A short, stable key for "the same error on the same route", for throttling alerts. */
export function alertKey(s: ErrorSummary, route: string) {
  const text = `${route}|${s.digest ?? s.message}`;
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (Math.imul(31, h) + text.charCodeAt(i)) | 0;
  return `alert:${(h >>> 0).toString(36)}`;
}
