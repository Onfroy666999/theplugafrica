// Concierge fees (issue #84): The Plug's share of a deal the concierge closes. Pure, so it's unit-tested and safe in
// client components (the admin form previews the fees as you type).

/** Decided by the owner on 2026-11-09: 10% of the agreed price from the customer, and 10% from the business. */
export const CONCIERGE_FEE_PERCENT = 10;
/** The customer's side when they're a concierge member (#83). A setting: the owner may lower it later. */
export const MEMBER_FEE_PERCENT = 10;
/** A fee still unpaid this many days after it was sent counts as overdue. */
export const OVERDUE_DAYS = 14;

export const FEE_STATUS = [
  { value: "due", label: "Due" },
  { value: "paid", label: "Paid" },
  { value: "waived", label: "Waived" },
  { value: "cancelled", label: "Cancelled" },
] as const;
export type FeeStatus = (typeof FEE_STATUS)[number]["value"];
export const feeStatusLabel = (s: string) => FEE_STATUS.find((x) => x.value === s)?.label ?? s;

/** Percent to basis points (10% → 1000), the form rates are stored in. */
export const toBasisPoints = (percent: number) => Math.round(percent * 100);
export const percentLabel = (bp: number) => `${(bp / 100).toLocaleString("en-GB", { maximumFractionDigits: 2 })}%`;

/** The fee on a deal, in pesewas, rounded to the nearest pesewa. */
export const feeAmount = (valuePesewas: number, basisPoints: number) => Math.round((valuePesewas * basisPoints) / 10_000);

/** The customer's rate: the member rate for concierge members, the standard rate otherwise. */
export const customerRate = (member: boolean) => toBasisPoints(member ? MEMBER_FEE_PERCENT : CONCIERGE_FEE_PERCENT);
export const businessRate = () => toBasisPoints(CONCIERGE_FEE_PERCENT);

/** Up to GHS 10 million, so a typo can't produce an absurd bill. */
const MAX_CEDIS = 10_000_000;

/**
 * A deal value typed in cedis ("12,500", "GHS 12500.50", "12 500") as pesewas, or null if it isn't a sensible
 * positive amount with at most two decimal places.
 */
export function parseCedis(input: unknown): number | null {
  const s = String(input ?? "").replace(/ghs|gh₵|₵|cedis?/gi, "").replace(/[\s,]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const cedis = Number(s);
  if (!(cedis > 0) || cedis > MAX_CEDIS) return null;
  return Math.round(cedis * 100);
}

export function isOverdue(fee: { status: string; sentAt: Date | null; createdAt: Date }, now = new Date()) {
  const from = (fee.sentAt ?? fee.createdAt).getTime();
  return fee.status === "due" && now.getTime() - from > OVERDUE_DAYS * 86_400_000;
}
