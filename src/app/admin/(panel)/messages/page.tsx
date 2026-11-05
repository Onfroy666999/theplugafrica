import { db } from "@/lib/db";
import { CONTACT_STATUS } from "@/lib/status";
import { InboxItem } from "../InboxItem";
import { Empty, PageHeader, Panel, fmtDate } from "../ui";

/** Messages from the Contact page (issue #29). */
export default async function Messages() {
  const rows = await db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <>
      <PageHeader title="Messages" sub="General messages from the Contact page. Reply by email or phone, then mark them Replied." />
      <Panel>
        {rows.length === 0 ? (
          <Empty title="No messages yet" body="Messages sent from the Contact page appear here." />
        ) : (
          <ul className="divide-y divide-navy/[0.07]">
            {rows.map((m) => (
              <InboxItem key={m.id} kind="contact" id={m.id} status={m.status} notes={m.notes ?? ""} statuses={CONTACT_STATUS}>
                <p className="text-[15px] font-semibold text-navy">
                  {m.name} <span className="font-normal text-navy/45">· {m.topic}</span>
                </p>
                <p className="mt-1 text-[14.5px] whitespace-pre-line text-navy/75">{m.message}</p>
                <p className="mt-1.5 text-[13px] text-navy/55">
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
    </>
  );
}
