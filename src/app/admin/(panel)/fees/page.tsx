import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { payUrl } from "@/lib/fee-server";
import { OVERDUE_DAYS, feeStatusLabel, isOverdue, percentLabel } from "@/lib/fees";
import { formatGhs } from "@/lib/membership-plan";
import { paystackKeySet } from "@/lib/paystack";
import { can } from "@/lib/roles";
import { Empty, PageHeader, Panel, StatCard, fmtDate } from "../ui";
import { FeeControls } from "./FeeControls";

type SP = Promise<{ show?: string }>;
const SHOW = [
  { value: "", label: "All" },
  { value: "due", label: "Due" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
] as const;

/** Concierge fees (issue #84): each deal with its customer and business fee, and what's still owed. */
export default async function Fees({ searchParams }: { searchParams: SP }) {
  const admin = await requireAdmin();
  const show = (await searchParams).show ?? "";
  const now = new Date();
  const overdueBefore = new Date(now.getTime() - OVERDUE_DAYS * 86_400_000);
  const feeWhere =
    show === "due" ? { status: "due" } : show === "paid" ? { status: "paid" } : show === "overdue" ? { status: "due", OR: [{ sentAt: { lt: overdueBefore } }, { sentAt: null, createdAt: { lt: overdueBefore } }] } : {};
  const [deals, due, paid, overdue] = await Promise.all([
    db.conciergeDeal.findMany({
      where: show ? { fees: { some: feeWhere } } : {},
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { fees: { orderBy: { party: "desc" } }, request: { select: { ref: true, name: true } }, recordedBy: { select: { name: true } } },
    }),
    db.conciergeFee.aggregate({ where: { status: "due" }, _sum: { amountPesewas: true }, _count: true }),
    db.conciergeFee.aggregate({ where: { status: "paid" }, _sum: { amountPesewas: true }, _count: true }),
    db.conciergeFee.count({ where: { status: "due", OR: [{ sentAt: { lt: overdueBefore } }, { sentAt: null, createdAt: { lt: overdueBefore } }] } }),
  ]);
  const canEdit = can(admin.role, "edit");
  const canWaive = can(admin.role, "delete");

  return (
    <>
      <PageHeader
        title="Concierge fees"
        sub={`The Plug's share of each deal the concierge closes: 10% from the customer and 10% from the business. Record a deal from its concierge request.${paystackKeySet() ? "" : " Paystack isn't connected yet: pay links show the fee but can't take payment, so mark fees paid when they're settled another way."}`}
        action={can(admin.role, "team") ? <a href={`/admin/export/fees${show ? `?show=${show}` : ""}`} className="press flex h-10 items-center rounded-full border border-navy/15 bg-white px-4 text-[14px] font-medium text-navy hover:border-navy/35">Download spreadsheet</a> : undefined}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label={`Due (${due._count})`} value={Math.round((due._sum.amountPesewas ?? 0) / 100)} href="/admin/fees?show=due" note="GHS still to collect" />
        <StatCard label="Overdue" value={overdue} href="/admin/fees?show=overdue" note={`Unpaid after ${OVERDUE_DAYS} days`} />
        <StatCard label={`Paid (${paid._count})`} value={Math.round((paid._sum.amountPesewas ?? 0) / 100)} href="/admin/fees?show=paid" note="GHS received" />
      </div>
      <nav aria-label="Show" className="mb-4 flex flex-wrap gap-2">
        {SHOW.map((s) => (
          <Link
            key={s.value}
            href={s.value ? `/admin/fees?show=${s.value}` : "/admin/fees"}
            className={`press flex h-9 items-center rounded-full border px-4 text-[13.5px] font-medium ${show === s.value ? "border-navy bg-navy text-white" : "border-navy/15 bg-white text-navy hover:border-navy/35"}`}
          >
            {s.label}
          </Link>
        ))}
      </nav>
      {deals.length === 0 ? (
        <Empty
          title={show ? "Nothing here" : "No deals recorded yet"}
          body={show ? "Try another view." : "When the concierge closes a deal, open its request in Concierge and choose “Record deal”."}
        />
      ) : (
        <Panel>
          <ul className="divide-y divide-navy/[0.07]">
            {deals.map((d) => (
              <li key={d.id} className="p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[15px] font-semibold text-navy">
                    {d.description} <span className="font-normal text-navy/65">· {d.businessName} · {formatGhs(d.valuePesewas)}</span>
                  </p>
                  <p className="text-[13px] text-navy/65">
                    <span className="font-mono">{d.request.ref}</span> · {d.request.name} · {fmtDate(d.createdAt)}
                    {d.recordedBy && <> · by {d.recordedBy.name}</>}
                  </p>
                </div>
                <ul className="mt-3 grid gap-3 md:grid-cols-2">
                  {d.fees.map((f) => {
                    const late = isOverdue(f, now);
                    const tone = f.status === "paid" ? "bg-ok-soft text-ok" : late ? "bg-ember-soft text-ember" : f.status === "due" ? "bg-warn-soft text-warn" : "bg-navy/[0.06] text-navy/65";
                    return (
                      <li key={f.id} className="rounded-card border border-navy/10 p-4 text-[14px]">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-navy">
                            {f.party === "customer" ? "Customer" : "Business"} · {formatGhs(f.amountPesewas)}{" "}
                            <span className="font-normal text-navy/65">({percentLabel(f.party === "customer" ? d.customerRate : d.businessRate)})</span>
                          </p>
                          <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${tone}`}>{late ? "Overdue" : feeStatusLabel(f.status)}</span>
                        </div>
                        <p className="mt-1 text-navy/65">
                          {f.name}
                          {f.email && <> · {f.email}</>}
                          {f.phone && <> · {f.phone}</>}
                        </p>
                        <p className="mt-1 text-[13px] text-navy/65">
                          <span className="font-mono">{f.ref}</span>
                          {f.sentAt ? <> · emailed {fmtDate(f.sentAt)}</> : <> · not emailed</>}
                          {f.paidAt && <> · paid {fmtDate(f.paidAt)}{f.paidVia === "offline" ? " (outside Paystack)" : ""}</>}
                          {f.note && <> · {f.note}</>}
                        </p>
                        {f.status === "due" && (canEdit || canWaive) && <FeeControls id={f.id} url={payUrl(f.token)} hasEmail={Boolean(f.email)} canEdit={canEdit} canWaive={canWaive} />}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
