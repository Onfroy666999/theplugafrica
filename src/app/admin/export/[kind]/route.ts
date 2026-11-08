import { getAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { toCsv } from "@/lib/csv";
import { db } from "@/lib/db";
import { getCat } from "@/lib/directory";
import { inboxWhere } from "@/lib/inbox";
import { INBOX_KINDS, parseInboxFilters, type InboxKind } from "@/lib/inbox-filters";
import { describeRequest } from "@/lib/requests";
import { can } from "@/lib/roles";
import { CONCIERGE_STATUS, CONTACT_STATUS, ENQUIRY_STATUS, WAITLIST_STATUS, find, values } from "@/lib/status";

// Spreadsheet download of an inbox with its current filters (issue #67). Owners only: it contains visitors' personal
// details. Used to reconcile introductions and commission with businesses.

export const dynamic = "force-dynamic";
const MAX_ROWS = 10_000;
const STATUSES = { enquiry: ENQUIRY_STATUS, concierge: CONCIERGE_STATUS, waitlist: WAITLIST_STATUS, contact: CONTACT_STATUS } as const;
const LABEL: Record<InboxKind, string> = { enquiry: "enquiries", concierge: "concierge requests", waitlist: "waitlist entries", contact: "messages" };

export async function GET(req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const admin = await getAdmin();
  if (!admin) return new Response("Sign in first.", { status: 401 });
  if (!can(admin.role, "team")) return new Response("Only owners can download inbox data.", { status: 403 });
  const { kind: raw } = await params;
  if (!INBOX_KINDS.includes(raw as InboxKind)) return new Response("Unknown inbox.", { status: 404 });
  const kind = raw as InboxKind;
  const statuses = STATUSES[kind];
  const f = parseInboxFilters(Object.fromEntries(new URL(req.url).searchParams), values(statuses));
  const where = inboxWhere(kind, f, admin.id);
  const status = (v: string) => find(statuses, v).label;
  const take = { where, orderBy: { createdAt: "desc" as const }, take: MAX_ROWS };

  let csv: string;
  let count: number;
  if (kind === "enquiry") {
    const rows = await db.enquiry.findMany({ ...take, include: { business: { select: { name: true } } } });
    count = rows.length;
    csv = toCsv(
      ["Reference", "Date", "Type", "Business", "Status", "Name", "Phone", "Email", "City", "Where", "When", "Message", "Notes"],
      rows.map((e) => {
        const d = describeRequest(e);
        return [e.ref, e.createdAt, e.kind === "request" ? "Request" : "Contact details", e.business?.name ?? "Business removed", status(e.status), e.name, e.phone, e.email, e.city, d.place, d.when, e.message, e.notes];
      }),
    );
  } else if (kind === "concierge") {
    const rows = await db.conciergeRequest.findMany({ ...take, include: { business: { select: { name: true } }, assignedTo: { select: { name: true } } } });
    count = rows.length;
    csv = toCsv(
      ["Reference", "Date", "Status", "Handled by", "Category", "Service", "About business", "Name", "Phone", "Email", "City", "Where", "When", "How soon", "Request", "Notes"],
      rows.map((r) => {
        const d = describeRequest(r);
        return [r.ref, r.createdAt, status(r.status), r.assignedTo?.name, getCat(r.category)?.name ?? r.category, r.service, r.business?.name, r.name, r.phone, r.email, r.city, d.place, d.when, r.timing, r.details, r.notes];
      }),
    );
  } else if (kind === "waitlist") {
    const rows = await db.waitlistEntry.findMany(take);
    count = rows.length;
    csv = toCsv(
      ["Reference", "Date", "Status", "Business", "Category", "City", "Contact name", "Phone", "Email", "Notes"],
      rows.map((w) => [w.ref, w.createdAt, status(w.status), w.businessName, getCat(w.category)?.name ?? w.category, w.city, w.name, w.phone, w.email, w.notes]),
    );
  } else {
    const rows = await db.contactMessage.findMany(take);
    count = rows.length;
    csv = toCsv(
      ["Reference", "Date", "Status", "Topic", "Name", "Email", "Phone", "Message", "Notes"],
      rows.map((m) => [m.ref, m.createdAt, status(m.status), m.topic, m.name, m.email, m.phone, m.message, m.notes]),
    );
  }

  await audit(admin, "inbox.export", `Downloaded ${count} ${LABEL[kind]} as a spreadsheet`);
  const day = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="theplugafrica-${kind}-${f.month ?? day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
