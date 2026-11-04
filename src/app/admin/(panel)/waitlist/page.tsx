import { LinkButton } from "@/components/ui/Button";
import { db } from "@/lib/db";
import { CATS } from "@/lib/directory";
import { WAITLIST_STATUS } from "@/lib/status";
import { InboxItem } from "../InboxItem";
import { Empty, PageHeader, Panel, fmtDate } from "../ui";

export default async function Waitlist() {
  const rows = await db.waitlistEntry.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const catName = (k: string) => CATS.find((c) => c.key === k)?.name ?? k;
  return (
    <>
      <PageHeader title="Business waitlist" sub="Businesses asking to be listed. Contact them to start verification, then add them under Businesses." action={<LinkButton href="/admin/businesses/new" variant="secondary">Add a business</LinkButton>} />
      <Panel>
        {rows.length === 0 ? (
          <Empty title="No sign-ups yet" body="Businesses that join from the For businesses page appear here." />
        ) : (
          <ul className="divide-y divide-navy/[0.07]">
            {rows.map((w) => (
              <InboxItem key={w.id} kind="waitlist" id={w.id} status={w.status} notes={w.notes ?? ""} statuses={WAITLIST_STATUS}>
                <p className="text-[15px] font-semibold text-navy">
                  {w.businessName} <span className="font-normal text-navy/45">· {catName(w.category)} · {w.city}</span>
                </p>
                <p className="mt-0.5 text-[13px] text-navy/55">
                  {w.name} · <a href={`tel:${w.phone.replace(/\s+/g, "")}`} className="font-medium text-navy hover:underline">{w.phone}</a>
                  {w.email && <> · <a href={`mailto:${w.email}`} className="font-medium text-navy hover:underline">{w.email}</a></>}
                  {" · "}{fmtDate(w.createdAt)} · <span className="font-mono">{w.ref}</span>
                </p>
              </InboxItem>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
