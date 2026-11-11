// Concierge membership (issue #83): the price, what members get, and who counts as a member.
// Pure, so it's safe in client components and unit-tested.

/** Decided by the owner on 2026-11-09: $8 a month, fixed. Paystack charges the cedi amount set on the plan. */
export const MEMBERSHIP_USD = 8;

/**
 * What members get. Proposed in issue #83 for the owner to confirm or edit: change this list and the membership page,
 * the account page and the emails all follow.
 */
export const BENEFITS = [
  { title: "Priority with the concierge", body: "Your requests go to the top of the concierge's list, so we pick them up first." },
  { title: "A check before you pay", body: "Before you pay any business, listed here or not, we check its registration, references and reviews, and tell you what we found." },
  { title: "Two quick tasks a month", body: "A call, a booking, or a price or availability check, done for you." },
  { title: "A direct line", body: "Message your concierge on WhatsApp instead of filling in a form each time." },
  { title: "Members' offers", body: "Discounts and extras from listed businesses, as they join." },
] as const;

export type MembershipStatus = "pending" | "active" | "non_renewing" | "past_due" | "cancelled";
export type MembershipLike = { status: string; currentPeriodEnd: Date | null } | null | undefined;

/** Days a member keeps the benefits after a renewal fails, while Paystack tries the card again. */
export const GRACE_DAYS = 3;

/** Whether this membership gives the benefits right now. Cancelling keeps them until the paid month ends. */
export function hasBenefits(m: MembershipLike, now = new Date()) {
  if (!m) return false;
  const end = m.currentPeriodEnd?.getTime();
  switch (m.status) {
    case "active":
      // Paystack renews before this date; if no renewal arrives, the benefits stop after the grace days.
      return end === undefined || end + GRACE_DAYS * 86_400_000 > now.getTime();
    case "non_renewing":
    case "cancelled":
      return end !== undefined && end > now.getTime();
    case "past_due":
      return end !== undefined && end + GRACE_DAYS * 86_400_000 > now.getTime();
    default:
      return false;
  }
}

/** Whether a new subscription can be started (nothing running that would charge twice). */
export const canJoin = (m: MembershipLike, now = new Date()) => !m || (m.status !== "active" && m.status !== "past_due" && !hasBenefits(m, now));

const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Accra" });

/** A sentence for the account page. */
export function describeMembership(m: MembershipLike, now = new Date()): string {
  if (!m) return "Not a member";
  const end = m.currentPeriodEnd ? day.format(m.currentPeriodEnd) : null;
  switch (m.status) {
    case "active":
      return end ? `Active. Renews on ${end}.` : "Active.";
    case "non_renewing":
    case "cancelled":
      return hasBenefits(m, now) && end ? `Cancelled. Your benefits last until ${end}.` : "Ended.";
    case "past_due":
      return "Your last payment didn't go through. Paystack will try your card again; you can also update it.";
    case "pending":
      return "Waiting for your payment to be confirmed.";
    default:
      return "Not a member";
  }
}

/** Paystack amounts are in pesewas. */
export function formatGhs(pesewas: number) {
  const cedis = pesewas / 100;
  return `GHS ${cedis.toLocaleString("en-GH", { minimumFractionDigits: Number.isInteger(cedis) ? 0 : 2, maximumFractionDigits: 2 })}`;
}
