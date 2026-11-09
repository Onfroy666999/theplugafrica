import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { MEMBERSHIP_USD, hasBenefits } from "@/lib/membership-plan";
import { paystackReady } from "@/lib/paystack";
import { Empty, PageHeader, Panel, StatCard, fmtDate } from "../ui";

const LABEL: Record<string, string> = {
  active: "Active",
  non_renewing: "Cancelled, benefits until it ends",
  past_due: "Payment failed",
  cancelled: "Cancelled",
};

/** Concierge members (issue #83), read-only: payments and refunds are handled in the Paystack dashboard. */
export default async function Members() {
  await requireAdmin();
  const rows = await db.membership.findMany({
    where: { status: { not: "pending" } },
    orderBy: [{ startedAt: "desc" }],
    take: 500,
    include: { user: { select: { email: true, name: true, phone: true } } },
  });
  const now = new Date();
  const current = rows.filter((m) => hasBenefits(m, now)).length;
  const failing = rows.filter((m) => m.status === "past_due").length;
  return (
    <>
      <PageHeader
        title="Members"
        sub={`Concierge membership, $${MEMBERSHIP_USD} a month through Paystack. Refunds and card problems are handled in the Paystack dashboard.${paystackReady() ? "" : " Paystack isn't connected yet, so nobody can join."}`}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Members now" value={current} href="/admin/members" />
        <StatCard label="Payment failed" value={failing} href="/admin/members" note="Paystack tries the card again" />
        <StatCard label="Ever joined" value={rows.length} href="/admin/members" />
      </div>
      {rows.length === 0 ? (
        <Empty title="No members yet" body="People who join the concierge membership appear here, with their status and renewal date." />
      ) : (
        <Panel className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[14px]">
            <thead className="text-[12.5px] text-navy/65">
              <tr className="border-b border-navy/10">
                <th className="px-5 py-3 font-semibold">Member</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Since</th>
                <th className="px-5 py-3 font-semibold">Renews or ends</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => {
                const on = hasBenefits(m, now);
                const tone = !on ? "bg-navy/[0.06] text-navy/65" : m.status === "past_due" ? "bg-warn-soft text-warn" : "bg-ok-soft text-ok";
                return (
                  <tr key={m.id} className="border-b border-navy/[0.06] last:border-0">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-navy">{m.user.name || "No name yet"}</p>
                      <p className="text-navy/65">
                        <a href={`mailto:${m.user.email}`} className="hover:underline">{m.user.email}</a>
                        {m.user.phone && <> · {m.user.phone}</>}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-[12.5px] font-semibold ${tone}`}>{on || m.status !== "non_renewing" ? (LABEL[m.status] ?? m.status) : "Ended"}</span>
                    </td>
                    <td className="px-5 py-3.5 text-navy/65">{m.startedAt ? fmtDate(m.startedAt) : "—"}</td>
                    <td className="px-5 py-3.5 text-navy/65">{m.currentPeriodEnd ? fmtDate(m.currentPeriodEnd) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      )}
    </>
  );
}
