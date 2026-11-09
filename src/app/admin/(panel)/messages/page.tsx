import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { inboxWhere, pageArgs } from "@/lib/inbox";
import { PAGE_SIZE, filterQuery, parseInboxFilters, recentMonths } from "@/lib/inbox-filters";
import { CONTACT_STATUS, values } from "@/lib/status";
import { InboxItem } from "../InboxItem";
import { InboxToolbar } from "../InboxToolbar";
import { Empty, PageHeader, Pager, Panel, fmtDate } from "../ui";

type SP = Promise<Record<string, string | string[] | undefined>>;

/** Messages from the Contact page (issue #29). */
export default async function Messages({ searchParams }: { searchParams: SP }) {
  const [admin, sp] = await Promise.all([requireAdmin(), searchParams]);
  const f = parseInboxFilters(sp, values(CONTACT_STATUS));
  const where = inboxWhere("contact", f, admin.id);
  const [rows, total] = await Promise.all([db.contactMessage.findMany({ where, ...pageArgs(f) }), db.contactMessage.count({ where })]);
  const filtered = Boolean(f.status || f.q || f.month);
  return (
    <>
      <PageHeader title="Messages" sub="General messages from the Contact page. Reply by email or phone, then mark them Replied." />
      <InboxToolbar kind="contact" statuses={CONTACT_STATUS} months={recentMonths()} placeholder="Search by name, email, phone, topic or reference" />
      <Panel>
        {rows.length === 0 ? (
          filtered ? <Empty title="Nothing matches" body="Try another status or month, or clear the search." /> : <Empty title="No messages yet" body="Messages sent from the Contact page appear here." />
        ) : (
          <ul className="divide-y divide-navy/[0.07]">
            {rows.map((m) => (
              <InboxItem key={m.id} kind="contact" id={m.id} refCode={m.ref} status={m.status} notes={m.notes ?? ""} statuses={CONTACT_STATUS}>
                <p className="text-[15px] font-semibold text-navy">
                  {m.name} <span className="font-normal text-navy/65">· {m.topic}</span>
                </p>
                <p className="mt-1 text-[14.5px] whitespace-pre-line text-navy/75">{m.message}</p>
                <p className="mt-1.5 text-[13px] text-navy/65">
                  {m.email && <a href={`mailto:${m.email}`} className="font-medium text-navy hover:underline">{m.email}</a>}
                  {m.email && m.phone && " · "}
                  {m.phone && <a href={`tel:${m.phone.replace(/\s+/g, "")}`} className="font-medium text-navy hover:underline">{m.phone}</a>}
                  {" · "}{fmtDate(m.createdAt)} · <span className="font-mono">{m.ref}</span>
                </p>
              </InboxItem>
            ))}
          </ul>
        )}
      </Panel>
      <Pager page={f.page} pageSize={PAGE_SIZE} total={total} query={filterQuery(f)} path="/admin/messages" />
    </>
  );
}
