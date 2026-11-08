import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { CATS } from "@/lib/directory";
import { inboxWhere, pageArgs } from "@/lib/inbox";
import { PAGE_SIZE, filterQuery, parseInboxFilters, recentMonths } from "@/lib/inbox-filters";
import { describeRequest } from "@/lib/requests";
import { CONCIERGE_STATUS, values } from "@/lib/status";
import { InboxItem } from "../InboxItem";
import { InboxToolbar } from "../InboxToolbar";
import { Empty, PageHeader, Pager, Panel, fmtDate } from "../ui";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function Concierge({ searchParams }: { searchParams: SP }) {
  const [admin, sp] = await Promise.all([requireAdmin(), searchParams]);
  const f = parseInboxFilters(sp, values(CONCIERGE_STATUS));
  const where = inboxWhere("concierge", f, admin.id);
  const [rows, total, team] = await Promise.all([
    db.conciergeRequest.findMany({ where, ...pageArgs(f), include: { business: { select: { id: true, name: true } }, assignedTo: { select: { id: true, name: true } } } }),
    db.conciergeRequest.count({ where }),
    // Owners and editors can handle requests; viewers can't change anything.
    db.admin.findMany({ where: { role: { in: ["owner", "editor"] } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const filtered = Boolean(f.status || f.q || f.month || f.assigned);
  const catName = (k: string) => CATS.find((c) => c.key === k)?.name ?? k;
  const options = (current: { id: string; name: string } | null) => {
    const list = team.map((t) => ({ value: t.id, label: t.id === admin.id ? `${t.name} (you)` : t.name }));
    return current && !team.some((t) => t.id === current.id) ? [...list, { value: current.id, label: current.name }] : list;
  };
  return (
    <>
      <PageHeader title="Concierge requests" sub="Paid, hands-on requests. Agree the fee before any work starts." />
      <Suspense>
        <InboxToolbar kind="concierge" statuses={CONCIERGE_STATUS} months={recentMonths()} placeholder="Search by name, phone, email, city or reference" assignable />
      </Suspense>
      <Panel>
        {rows.length === 0 ? (
          filtered ? <Empty title="Nothing matches" body="Try another status, month or assignment, or clear the search." /> : <Empty title="No requests yet" body="Requests from the Concierge page, and from “Ask a concierge to handle it” on listings, arrive here." />
        ) : (
          <ul className="divide-y divide-navy/[0.07]">
            {rows.map((r) => (
              <InboxItem
                key={r.id}
                kind="concierge"
                id={r.id}
                refCode={r.ref}
                status={r.status}
                notes={r.notes ?? ""}
                statuses={CONCIERGE_STATUS}
                assign={{ options: options(r.assignedTo), value: r.assignedTo?.id ?? "" }}
              >
                <p className="text-[15px] font-semibold text-navy">
                  {r.name} <span className="font-normal text-navy/65">· {catName(r.category)}{r.service && <> › {r.service}</>} · {r.city}</span>
                </p>
                <p className="mt-0.5 text-[13px] text-navy/65">
                  <a href={`tel:${r.phone.replace(/\s+/g, "")}`} className="font-medium text-navy hover:underline">{r.phone}</a>
                  {r.email && <> · <a href={`mailto:${r.email}`} className="font-medium text-navy hover:underline">{r.email}</a></>}
                  {" · "}{r.timing} · {fmtDate(r.createdAt)} · <span className="font-mono">{r.ref}</span>
                </p>
                {(() => { const d = describeRequest(r); return (d.place || d.when) && (
                  <p className="mt-1 text-[13px] text-navy/70">
                    {d.place && <><span className="text-navy/65">Where:</span> {d.place}</>}
                    {d.place && d.when && " · "}
                    {d.when && <><span className="text-navy/65">When:</span> {d.when}</>}
                  </p>
                ); })()}
                {r.business && (
                  <p className="mt-1 text-[13px] text-navy/65">About <Link href={`/admin/businesses/${r.business.id}`} className="font-semibold text-navy hover:underline">{r.business.name}</Link></p>
                )}
                <p className="mt-2 max-w-3xl text-[14.5px] leading-relaxed whitespace-pre-line text-navy/80">{r.details}</p>
              </InboxItem>
            ))}
          </ul>
        )}
      </Panel>
      <Pager page={f.page} pageSize={PAGE_SIZE} total={total} query={filterQuery(f)} path="/admin/concierge" />
    </>
  );
}
