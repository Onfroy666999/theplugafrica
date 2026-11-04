import Link from "next/link";
import { db } from "@/lib/db";
import { ENQUIRY_STATUS } from "@/lib/status";
import { InboxItem } from "../InboxItem";
import { Empty, PageHeader, Panel, fmtDate } from "../ui";

export default async function Enquiries() {
  const rows = await db.enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { business: { select: { id: true, name: true, phone: true, whatsapp: true } } } });
  return (
    <>
      <PageHeader title="Enquiries" sub="Every time someone asks for a business's contact details. The reference code proves the lead came from The Plug." />
      <Panel>
        {rows.length === 0 ? (
          <Empty title="No enquiries yet" body="When a visitor taps Contact on a listing and accepts the disclaimer, it lands here with its reference code." />
        ) : (
          <ul className="divide-y divide-navy/[0.07]">
            {rows.map((e) => (
              <InboxItem key={e.id} kind="enquiry" id={e.id} status={e.status} notes={e.notes ?? ""} statuses={ENQUIRY_STATUS}>
                <p className="font-mono text-[15px] font-bold tracking-[0.06em] text-navy">{e.ref}</p>
                <p className="mt-0.5 text-[14px] text-navy/70">
                  {e.business ? (
                    <Link href={`/admin/businesses/${e.business.id}`} className="font-semibold text-navy hover:underline hover:underline-offset-4">{e.business.name}</Link>
                  ) : (
                    "Business removed"
                  )}
                  <span className="text-navy/45"> · {fmtDate(e.createdAt)}</span>
                </p>
                <p className="mt-1 text-[12.5px] text-navy/45">Tell the business this reference so the introduction is on record.</p>
              </InboxItem>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
