import "server-only";
import { layout, sendEmail } from "./email";
import { alertKey, safePath, summariseError } from "./error-summary";
import { hit } from "./protect";

// Error alerts (issue #8): when the server hits an error, email the team so problems don't go unnoticed.
// Off until email is set up (RESEND_API_KEY). Goes to ALERT_EMAIL, or NOTIFY_EMAIL if that isn't set.
// Throttled: the same error on the same route alerts once an hour, and at most 10 alerts go out an hour.

const SAME_ERROR_WINDOW_S = 60 * 60;
const MAX_PER_HOUR = 10;

const recipients = () => (process.env.ALERT_EMAIL || process.env.NOTIFY_EMAIL || "").split(",").map((s) => s.trim()).filter(Boolean);

// Fallback counters for when the database itself is what's failing (per Worker instance).
const memory = new Map<string, { count: number; until: number }>();
function memoryHit(key: string, windowS: number) {
  const now = Date.now();
  const m = memory.get(key);
  if (!m || m.until < now) {
    memory.set(key, { count: 1, until: now + windowS * 1000 });
    return 1;
  }
  return ++m.count;
}
async function count(key: string, windowS: number) {
  try {
    return await hit(key, windowS);
  } catch {
    return memoryHit(key, windowS);
  }
}

export type RequestInfo = { path: string; method: string };
export type ErrorContext = { routePath: string; routeType: string; routerKind?: string };

/** Called by src/instrumentation.ts for every server error. Never throws. */
export async function reportError(err: unknown, request: RequestInfo, context: ErrorContext) {
  try {
    const to = recipients();
    if (!process.env.RESEND_API_KEY || !to.length) return;
    const s = summariseError(err);
    if ((await count(alertKey(s, context.routePath), SAME_ERROR_WINDOW_S)) > 1) return;
    if ((await count("alert:all", SAME_ERROR_WINDOW_S)) > MAX_PER_HOUR) return;
    const site = process.env.SITE_ENV === "staging" ? "staging" : process.env.SITE_ENV === "production" ? "live site" : "local";
    const kind = { render: "showing a page", route: "an API route", action: "a form or button", middleware: "the sign-in check" }[context.routeType] ?? context.routeType;
    await sendEmail({
      to,
      subject: `Site error (${site}): ${context.routePath}`,
      ...layout({
        heading: "The site hit an error",
        intro: `Something failed on the ${site} while ${kind}. Visitors saw an error message. Similar errors on this page won't be emailed again for an hour.`,
        rows: [
          ["When", new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC"],
          ["Page", `${request.method} ${safePath(request.path)}`],
          ["Route", context.routePath],
          ["Error", s.message],
          ["Error ID", s.digest],
          ["Where in the code", s.frames.join("\n") || null],
        ],
        footer: "Find the full details in Cloudflare › Workers & Pages › the Worker › Logs, by searching for the error ID. Sent by The Plug Africa's error alerts.",
      }),
    });
  } catch {
    // An alert must never cause another error.
  }
}
