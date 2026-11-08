import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { inboxWhere, pageArgs } from "@/lib/inbox";
import { PAGE_SIZE, filterQuery, parseInboxFilters, recentMonths } from "@/lib/inbox-filters";
import { describeRequest } from "@/lib/requests";
import { ENQUIRY_STATUS, values } from "@/lib/status";
import { InboxItem } from "../InboxItem";
import { InboxToolbar } from "../InboxToolbar";
import { Empty, PageHeader, Pager, Panel, fmtDate } from "../ui";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function Enquiries({ searchParams }: { searchParams: SP }) {
  const [admin, sp] = await Promise.all([requireAdmin(), searchParams]);
  const f = parseInboxFilters(sp, values(ENQUIRY_STATUS));
  const where = inboxWhere("enquiry", f, admin.id);
  const [rows, total] = await Promise.all([
    db.enquiry.findMany({ where, ...pageArgs(f), include: { business: { select: { id: true, name: true } } } }),
    db.enquiry.count({ where }),
  ]);
  const filtered = Boolean(f.status || f.q || f.month);
  return (
    <>
      <PageHeader title="Enquiries" sub="Contact-detail requests and requests sent through The Plug. The reference code proves the lead came from The Plug." />
      <Suspense>
        <InboxToolbar kind="enquiry" statuses={ENQUIRY_STATUS} months={recentMonths()} placeholder="Search by reference, business, name or phone" />
      </Suspense>
      <Panel>
        {rows.length === 0 && filtered ? (
          <Empty title="Nothing matches" body="Try another status or month, or clear the search." />
        ) : rows.length === 0 ? (
          <Empty title="No enquiries yet" body="When a visitor taps Contact on a listing and accepts the disclaimer, it lands here with its reference code." />
        ) : (
          <ul className="divide-y divide-navy/[0.07]">
            {rows.map((e) => (
              <InboxItem key={e.id} kind="enquiry" id={e.id} refCode={e.ref} status={e.status} notes={e.notes ?? ""} statuses={ENQUIRY_STATUS}>
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[15px] font-bold tracking-[0.06em] text-navy">{e.ref}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${e.kind === "request" ? "bg-gold/15 text-navy" : "bg-navy/[0.06] text-navy/60"}`}>{e.kind === "request" ? "Request" : "Contact details"}</span>
                </p>
                <p className="mt-0.5 text-[14px] text-navy/70">
                  {e.business ? (
                    <Link href={`/admin/businesses/${e.business.id}`} className="font-semibold text-navy hover:underline hover:underline-offset-4">{e.business.name}</Link>
                  ) : (
                    "Business removed"
                  )}
                  <span className="text-navy/65"> · {fmtDate(e.createdAt)}</span>
                </p>
                {e.kind === "request" && <RequestLines e={e} />}
                <p className="mt-1 text-[12.5px] text-navy/65">{e.kind === "request" ? "Pass this request to the business with its reference." : "Tell the business this reference so the introduction is on record."}</p>
              </InboxItem>
            ))}
          </ul>
        )}
      </Panel>
      <Pager page={f.page} pageSize={PAGE_SIZE} total={total} query={filterQuery(f)} path="/admin/enquiries" />
    </>
  );
}

function RequestLines({ e }: { e: Parameters<typeof describeRequest>[0] & { name: string | null; phone: string | null; email: string | null; message: string | null } }) {
  const d = describeRequest(e);
  return (
    <div className="mt-2 space-y-1 text-[13.5px] text-navy/75">
      <p>
        <span className="font-semibold text-navy">{e.name}</span>
        {e.phone && <> · <a href={`tel:${e.phone.replace(/\s+/g, "")}`} className="font-medium text-navy hover:underline">{e.phone}</a></>}
        {e.email && <> · <a href={`mailto:${e.email}`} className="font-medium text-navy hover:underline">{e.email}</a></>}
      </p>
      {e.message && <p className="whitespace-pre-line">{e.message}</p>}
      {d.place && <p><span className="text-navy/65">Where:</span> {d.place}</p>}
      {d.when && <p><span className="text-navy/65">When:</span> {d.when}</p>}
    </div>
  );
}
