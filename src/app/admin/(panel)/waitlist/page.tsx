import { Suspense } from "react";
import { LinkButton } from "@/components/ui/Button";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { CATS } from "@/lib/directory";
import { inboxWhere, pageArgs } from "@/lib/inbox";
import { PAGE_SIZE, filterQuery, parseInboxFilters, recentMonths } from "@/lib/inbox-filters";
import { can } from "@/lib/roles";
import { WAITLIST_STATUS, values } from "@/lib/status";
import { InboxItem } from "../InboxItem";
import { InboxToolbar } from "../InboxToolbar";
import { Empty, PageHeader, Pager, Panel, fmtDate } from "../ui";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function Waitlist({ searchParams }: { searchParams: SP }) {
  const [admin, sp] = await Promise.all([requireAdmin(), searchParams]);
  const f = parseInboxFilters(sp, values(WAITLIST_STATUS));
  const where = inboxWhere("waitlist", f, admin.id);
  const [rows, total] = await Promise.all([db.waitlistEntry.findMany({ where, ...pageArgs(f) }), db.waitlistEntry.count({ where })]);
  const filtered = Boolean(f.status || f.q || f.month);
  const canEdit = can(admin.role, "edit");
  const catName = (k: string) => CATS.find((c) => c.key === k)?.name ?? k;
  return (
    <>
      <PageHeader
        title="Business waitlist"
        sub="Businesses asking to be listed. Contact them to start verification, then create the business from their entry."
        action={canEdit ? <LinkButton href="/admin/businesses/new" variant="secondary">Add a business</LinkButton> : undefined}
      />
      <Suspense>
        <InboxToolbar kind="waitlist" statuses={WAITLIST_STATUS} months={recentMonths()} placeholder="Search by business, name, phone, city or reference" />
      </Suspense>
      <Panel>
        {rows.length === 0 ? (
          filtered ? <Empty title="Nothing matches" body="Try another status or month, or clear the search." /> : <Empty title="No sign-ups yet" body="Businesses that join from the For businesses page appear here." />
        ) : (
          <ul className="divide-y divide-navy/[0.07]">
            {rows.map((w) => (
              <InboxItem key={w.id} kind="waitlist" id={w.id} refCode={w.ref} status={w.status} notes={w.notes ?? ""} statuses={WAITLIST_STATUS}>
                <p className="text-[15px] font-semibold text-navy">
                  {w.businessName} <span className="font-normal text-navy/65">· {catName(w.category)} · {w.city}</span>
                </p>
                <p className="mt-0.5 text-[13px] text-navy/65">
                  {w.name} · <a href={`tel:${w.phone.replace(/\s+/g, "")}`} className="font-medium text-navy hover:underline">{w.phone}</a>
                  {w.email && <> · <a href={`mailto:${w.email}`} className="font-medium text-navy hover:underline">{w.email}</a></>}
                  {" · "}{fmtDate(w.createdAt)} · <span className="font-mono">{w.ref}</span>
                </p>
                {canEdit && w.status !== "onboarded" && (
                  <div className="mt-3">
                    <LinkButton href={`/admin/businesses/new?waitlist=${w.id}`} variant="secondary" size="sm">Create business from this</LinkButton>
                  </div>
                )}
              </InboxItem>
            ))}
          </ul>
        )}
      </Panel>
      <Pager page={f.page} pageSize={PAGE_SIZE} total={total} query={filterQuery(f)} path="/admin/waitlist" />
    </>
  );
}
