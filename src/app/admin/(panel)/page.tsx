import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { db } from "@/lib/db";
import { CONCIERGE_STATUS, ENQUIRY_STATUS, WAITLIST_STATUS, find } from "@/lib/status";
import { PageHeader, Panel, StatCard, fmtDate } from "./ui";

export default async function Dashboard() {
  const [byStatus, examples, newEnq, newCnc, newWl, newMsg, enquiries, concierge, waitlist] = await Promise.all([
    db.business.groupBy({ by: ["status"], _count: true }),
    db.business.count({ where: { isExample: true } }),
    db.enquiry.count({ where: { status: "new" } }),
    db.conciergeRequest.count({ where: { status: "new" } }),
    db.waitlistEntry.count({ where: { status: "new" } }),
    db.contactMessage.count({ where: { status: "new" } }),
    db.enquiry.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { business: { select: { name: true } } } }),
    db.conciergeRequest.findMany({ take: 5, orderBy: { createdAt: "desc" } }),
    db.waitlistEntry.findMany({ take: 5, orderBy: { createdAt: "desc" } }),
  ]);
  const count = (s: string) => byStatus.find((x) => x.status === s)?._count ?? 0;
  const live = count("verified") + count("in_review");

  type Row = { key: string; when: Date; title: string; sub: string; href: string; badge: { label: string; tone: Parameters<typeof Badge>[0]["tone"] } };
  const activity: Row[] = [
    ...enquiries.map((e) => ({ key: e.id, when: e.createdAt, title: `Enquiry ${e.ref}`, sub: e.business?.name ?? "Business removed", href: "/admin/enquiries", badge: find(ENQUIRY_STATUS, e.status) })),
    ...concierge.map((c) => ({ key: c.id, when: c.createdAt, title: `Concierge request from ${c.name}`, sub: `${c.city} · ${c.ref}`, href: "/admin/concierge", badge: find(CONCIERGE_STATUS, c.status) })),
    ...waitlist.map((w) => ({ key: w.id, when: w.createdAt, title: `${w.businessName} joined the waitlist`, sub: `${w.city} · ${w.ref}`, href: "/admin/waitlist", badge: find(WAITLIST_STATUS, w.status) })),
  ]
    .sort((a, b) => b.when.getTime() - a.when.getTime())
    .slice(0, 8);

  return (
    <>
      <PageHeader title="Dashboard" sub="What's live, and what needs you." action={<LinkButton href="/admin/businesses/new">Add a business</LinkButton>} />

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Live on the site" value={live} href="/admin/businesses" note={`${count("verified")} verified · ${count("in_review")} in review`} />
        <StatCard label="New enquiries" value={newEnq} href="/admin/enquiries" note="People who asked for contact details" />
        <StatCard label="New concierge requests" value={newCnc} href="/admin/concierge" note="Paid, hands-on requests" />
        <StatCard label="New on the waitlist" value={newWl} href="/admin/waitlist" note="Businesses asking to be listed" />
        <StatCard label="New messages" value={newMsg} href="/admin/messages" note="From the Contact page" />
      </div>

      {(count("draft") > 0 || examples > 0) && (
        <Panel className="mt-6 p-5 md:p-6">
          <h2 className="font-heading text-[17px] font-bold text-navy">Needs attention</h2>
          <ul className="mt-3 space-y-2 text-[14.5px] text-navy/75">
            {count("draft") > 0 && (
              <li>
                <Link href="/admin/businesses?status=draft" className="font-semibold text-navy underline-offset-4 hover:underline">{count("draft")} draft {count("draft") === 1 ? "business" : "businesses"}</Link> not yet on the site.
              </li>
            )}
            {examples > 0 && (
              <li>
                <Link href="/admin/businesses?examples=1" className="font-semibold text-navy underline-offset-4 hover:underline">{examples} example businesses</Link> are still public. Hide them once real businesses are in.
              </li>
            )}
          </ul>
        </Panel>
      )}

      <Panel className="mt-6">
        <h2 className="px-5 pt-5 font-heading text-[17px] font-bold text-navy md:px-6">Latest activity</h2>
        {activity.length ? (
          <ul className="mt-3 divide-y divide-navy/[0.07]">
            {activity.map((a) => (
              <li key={a.key}>
                <Link href={a.href} className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors duration-200 hover:bg-navy/[0.02] md:px-6">
                  <span className="min-w-0">
                    <span className="block truncate text-[14.5px] font-semibold text-navy">{a.title}</span>
                    <span className="block truncate text-[13px] text-navy/50">{a.sub} · {fmtDate(a.when)}</span>
                  </span>
                  <Badge tone={a.badge.tone}>{a.badge.label}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 pt-2 pb-6 text-[14px] text-navy/55 md:px-6">Nothing yet. Enquiries, concierge requests and waitlist sign-ups will appear here as they come in.</p>
        )}
      </Panel>
    </>
  );
}
