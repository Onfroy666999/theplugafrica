import Link from "next/link";
import { db } from "@/lib/db";
import { CATS } from "@/lib/directory";
import { CONCIERGE_STATUS } from "@/lib/status";
import { InboxItem } from "../InboxItem";
import { Empty, PageHeader, Panel, fmtDate } from "../ui";

export default async function Concierge() {
  const rows = await db.conciergeRequest.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { business: { select: { id: true, name: true } } } });
  const catName = (k: string) => CATS.find((c) => c.key === k)?.name ?? k;
  return (
    <>
      <PageHeader title="Concierge requests" sub="Paid, hands-on requests. Agree the fee before any work starts." />
      <Panel>
        {rows.length === 0 ? (
          <Empty title="No requests yet" body="Requests from the Concierge page, and from “Ask a concierge to handle it” on listings, arrive here." />
        ) : (
          <ul className="divide-y divide-navy/[0.07]">
            {rows.map((r) => (
              <InboxItem key={r.id} kind="concierge" id={r.id} status={r.status} notes={r.notes ?? ""} statuses={CONCIERGE_STATUS}>
                <p className="text-[15px] font-semibold text-navy">
                  {r.name} <span className="font-normal text-navy/45">· {catName(r.category)} · {r.city}</span>
                </p>
                <p className="mt-0.5 text-[13px] text-navy/55">
                  <a href={`tel:${r.phone.replace(/\s+/g, "")}`} className="font-medium text-navy hover:underline">{r.phone}</a>
                  {r.email && <> · <a href={`mailto:${r.email}`} className="font-medium text-navy hover:underline">{r.email}</a></>}
                  {" · "}{r.timing} · {fmtDate(r.createdAt)} · <span className="font-mono">{r.ref}</span>
                </p>
                {r.business && (
                  <p className="mt-1 text-[13px] text-navy/55">About <Link href={`/admin/businesses/${r.business.id}`} className="font-semibold text-navy hover:underline">{r.business.name}</Link></p>
                )}
                <p className="mt-2 max-w-3xl text-[14.5px] leading-relaxed whitespace-pre-line text-navy/80">{r.details}</p>
              </InboxItem>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
