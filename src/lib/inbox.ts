import "server-only";
import { monthRange, PAGE_SIZE, type InboxFilters, type InboxKind } from "./inbox-filters";

// Inbox queries (issue #67), shared by the admin pages and the spreadsheet export.

const contains = (q: string) => ({ contains: q, mode: "insensitive" as const });

/** Fields each inbox searches. */
const SEARCH: Record<InboxKind, string[]> = {
  enquiry: ["ref", "name", "phone", "email", "message"],
  concierge: ["ref", "name", "phone", "email", "details", "city", "service"],
  waitlist: ["ref", "businessName", "name", "phone", "email", "city"],
  contact: ["ref", "name", "phone", "email", "message", "topic"],
};

/**
 * The database filter for an inbox. `me` is the signed-in member, for "assigned to me".
 * Returned loosely typed; each caller passes it to its own model (the fields above exist on that model).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function inboxWhere(kind: InboxKind, f: InboxFilters, me: string): any {
  const where: Record<string, unknown> = {};
  if (f.status) where.status = f.status;
  if (f.month) where.createdAt = monthRange(f.month);
  if (f.q) {
    const or: Record<string, unknown>[] = SEARCH[kind].map((field) => ({ [field]: contains(f.q!) }));
    if (kind === "enquiry") or.push({ business: { name: contains(f.q) } });
    where.OR = or;
  }
  if (kind === "concierge" && f.assigned) where.assignedToId = f.assigned === "me" ? me : null;
  return where;
}

/** Newest first, one page at a time. */
export const pageArgs = (f: InboxFilters) => ({ orderBy: { createdAt: "desc" as const }, skip: (f.page - 1) * PAGE_SIZE, take: PAGE_SIZE });
