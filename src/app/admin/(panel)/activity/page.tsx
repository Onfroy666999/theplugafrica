import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { Empty, PageHeader, Panel, fmtDate } from "../ui";

const PAGE = 50;

/** Where an entry's subject lives in the admin, when it still exists. */
const TARGET_PATH: Record<string, (id: string) => string> = {
  business: (id) => `/admin/businesses/${id}`,
  service: () => "/admin/services",
  enquiry: () => "/admin/enquiries",
  concierge: () => "/admin/concierge",
  waitlist: () => "/admin/waitlist",
  contact: () => "/admin/messages",
  admin: () => "/admin/team",
};

type SP = Promise<{ who?: string; before?: string }>;

export default async function Activity({ searchParams }: { searchParams: SP }) {
  await requireAdmin("team");
  const sp = await searchParams;
  const before = sp.before && !Number.isNaN(Date.parse(sp.before)) ? new Date(sp.before) : undefined;
  const where: Prisma.AuditLogWhereInput = { ...(sp.who ? { adminId: sp.who } : {}), ...(before ? { createdAt: { lt: before } } : {}) };
  const [rows, people] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: PAGE + 1 }),
    db.admin.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const more = rows.length > PAGE;
  const shown = rows.slice(0, PAGE);
  const href = (q: { who?: string; before?: string }) => {
    const p = new URLSearchParams(Object.entries(q).filter((e): e is [string, string] => Boolean(e[1])));
    return `/admin/activity${p.size ? `?${p}` : ""}`;
  };
  const chip = (on: boolean) =>
    `press flex h-10 shrink-0 items-center rounded-full px-4 text-[14px] font-medium ${on ? "bg-navy text-white" : "border border-navy/15 bg-white text-navy/70 hover:border-navy/35"}`;

  return (
    <>
      <PageHeader title="Activity" sub="Who changed what in the admin, newest first. Visitors' requests are in the inboxes." />
      <nav aria-label="Filter by person" className="mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        <Link href={href({})} className={chip(!sp.who)} aria-current={!sp.who ? "page" : undefined}>Everyone</Link>
        {people.map((p) => (
          <Link key={p.id} href={href({ who: p.id })} className={chip(sp.who === p.id)} aria-current={sp.who === p.id ? "page" : undefined}>
            {p.name}
          </Link>
        ))}
      </nav>
      <Panel>
        {shown.length === 0 ? (
          <Empty title="Nothing yet" body="Changes made in the admin appear here: businesses, services, inboxes, photos and the team." />
        ) : (
          <ul className="divide-y divide-navy/[0.07]">
            {shown.map((r) => {
              const to = r.targetType && r.targetId && !r.action.endsWith(".delete") && r.action !== "team.remove" ? TARGET_PATH[r.targetType]?.(r.targetId) : undefined;
              return (
                <li key={r.id} className="flex flex-col gap-1 px-4 py-3.5 md:flex-row md:items-baseline md:gap-5 md:px-6">
                  <time dateTime={r.createdAt.toISOString()} className="shrink-0 text-[13px] text-navy/65 tabular-nums md:w-[120px]">{fmtDate(r.createdAt)}</time>
                  <p className="min-w-0 flex-1 text-[14.5px] text-navy">
                    <span className="font-semibold">{r.actorName}</span>
                    <span className="text-navy/65"> · </span>
                    {to ? <Link href={to} className="hover:underline hover:underline-offset-4">{r.summary}</Link> : r.summary}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
      {(more || before) && (
        <div className="mt-4 flex gap-2">
          {before && <Link href={href({ who: sp.who })} className={chip(false)}>Newest</Link>}
          {more && <Link href={href({ who: sp.who, before: shown[shown.length - 1].createdAt.toISOString() })} className={chip(false)}>Older</Link>}
        </div>
      )}
    </>
  );
}
