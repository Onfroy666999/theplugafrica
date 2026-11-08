// Inbox filters (issue #67): status, search, month, assignment and page, read from the address bar.
// Pure, so the admin pages, the spreadsheet export and the unit tests share one copy.

export const PAGE_SIZE = 50;
export type InboxKind = "enquiry" | "concierge" | "waitlist" | "contact";
export const INBOX_KINDS: readonly InboxKind[] = ["enquiry", "concierge", "waitlist", "contact"];

export type InboxFilters = { status?: string; q?: string; month?: string; assigned?: "me" | "none"; page: number };
type Params = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

/** Reads filters from search params, ignoring anything invalid. */
export function parseInboxFilters(sp: Params, statuses: readonly string[]): InboxFilters {
  const status = one(sp.status);
  const month = one(sp.month);
  const assigned = one(sp.assigned);
  const page = Number(one(sp.page));
  return {
    status: status && statuses.includes(status) ? status : undefined,
    q: one(sp.q)?.slice(0, 100),
    month: month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? month : undefined,
    assigned: assigned === "me" || assigned === "none" ? assigned : undefined,
    page: Number.isInteger(page) && page >= 1 && page <= 10_000 ? page : 1,
  };
}

/** The first moment of a month and of the next one (Accra is on UTC all year). */
export function monthRange(month: string) {
  const [y, m] = month.split("-").map(Number);
  return { gte: new Date(Date.UTC(y, m - 1, 1)), lt: new Date(Date.UTC(y, m, 1)) };
}

/** The last `n` months, newest first, for the month filter. */
export function recentMonths(now = new Date(), n = 12) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const value = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    return { value, label: new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(d) };
  });
}

/** Query string for the filters (without the page unless asked), for links and the export. */
export function filterQuery(f: InboxFilters, { page }: { page?: number } = {}) {
  const p = new URLSearchParams();
  if (f.status) p.set("status", f.status);
  if (f.q) p.set("q", f.q);
  if (f.month) p.set("month", f.month);
  if (f.assigned) p.set("assigned", f.assigned);
  if (page && page > 1) p.set("page", String(page));
  return p.toString();
}
