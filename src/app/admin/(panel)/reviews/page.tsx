import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { PAGE_SIZE } from "@/lib/inbox-filters";
import { Empty, PageHeader, Pager, Panel, fmtDate } from "../ui";
import { ReviewItem } from "./ReviewItem";

const TABS = [
  { value: "pending", label: "Waiting" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
] as const;

type SP = Promise<{ status?: string; page?: string }>;

/** Review moderation (issue #14): nothing appears on a listing until it's approved here. */
export default async function Reviews({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = TABS.some((t) => t.value === sp.status) ? sp.status! : "pending";
  const page = Math.max(1, Math.min(10_000, Number(sp.page) || 1));
  const where = { status };
  const [rows, total, counts] = await Promise.all([
    db.review.findMany({ where, orderBy: { createdAt: status === "pending" ? "asc" : "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { business: { select: { id: true, name: true, slug: true } } } }),
    db.review.count({ where }),
    db.review.groupBy({ by: ["status"], _count: true }),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  return (
    <>
      <PageHeader title="Reviews" sub="Each review comes from someone with a reference code for that business. Approve the genuine ones; nothing shows on a listing until you do." />
      <nav aria-label="Review status" className="mb-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={t.value === "pending" ? "/admin/reviews" : `/admin/reviews?status=${t.value}`}
            aria-current={status === t.value ? "page" : undefined}
            className={`press flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[14px] font-medium ${status === t.value ? "bg-navy text-white" : "border border-navy/15 bg-white text-navy/70 hover:border-navy/35"}`}
          >
            {t.label} <span className="tabular-nums opacity-70">{count(t.value)}</span>
          </Link>
        ))}
      </nav>
      <Panel>
        {rows.length === 0 ? (
          <Empty
            title={status === "pending" ? "Nothing waiting" : `No ${status} reviews`}
            body={status === "pending" ? "New reviews arrive here for approval. Visitors need the reference code they got when contacting the business." : "Reviews you approve or reject are kept here."}
          />
        ) : (
          <ul className="divide-y divide-navy/[0.07]">
            {rows.map((r) => (
              <ReviewItem
                key={r.id}
                review={{ id: r.id, name: r.name, rating: r.rating, body: r.body, ref: r.ref, status: r.status, response: r.response ?? "", when: fmtDate(r.createdAt) }}
                business={r.business}
              />
            ))}
          </ul>
        )}
      </Panel>
      <Pager page={page} pageSize={PAGE_SIZE} total={total} query={status === "pending" ? "" : `status=${status}`} path="/admin/reviews" />
    </>
  );
}
