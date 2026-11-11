"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getMembership } from "@/lib/membership";
import { canJoin } from "@/lib/membership-plan";
import { disableSubscription, initializeSubscription, manageLink, paystackReady } from "@/lib/paystack";
import { abs } from "@/lib/site";
import { getUser } from "@/lib/users";

// Concierge membership (issue #83): start a Paystack checkout, cancel, or change the card.

export type JoinResult = { ok: true; url: string } | { ok: false; signIn?: true; error: string };

export async function startMembership(): Promise<JoinResult> {
  const user = await getUser();
  if (!user) return { ok: false, signIn: true, error: "Please sign in first." };
  if (!paystackReady()) return { ok: false, error: "Membership opens soon. We'll let you know." };
  const m = await getMembership(user.id);
  if (!canJoin(m)) return { ok: false, error: "You're already a member. Your account shows when it renews or ends." };
  const checkout = await initializeSubscription({
    email: user.email,
    callbackUrl: abs("/membership/welcome"),
    metadata: { userId: user.id, purpose: "membership" },
  });
  if (!checkout) return { ok: false, error: "We couldn't reach Paystack just now. Please try again in a minute." };
  // Marks the checkout as started: only a pending membership can be confirmed on the way back.
  await db.membership.upsert({ where: { userId: user.id }, create: { userId: user.id, status: "pending" }, update: { status: "pending" } });
  return { ok: true, url: checkout.authorization_url };
}

type Simple = { ok: true } | { ok: false; error: string };

/** Stops future payments. The benefits last until the end of the month already paid for. */
export async function cancelMembership(): Promise<Simple> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Your session has ended. Please sign in again." };
  const m = await getMembership(user.id);
  if (!m || !["active", "past_due"].includes(m.status)) return { ok: false, error: "There's no active membership to cancel." };
  if (!m.subscriptionCode || !m.emailToken)
    return { ok: false, error: "Your membership is still being set up with Paystack. Please try again in a few minutes." };
  if (!(await disableSubscription(m.subscriptionCode, m.emailToken))) return { ok: false, error: "We couldn't reach Paystack just now. Please try again in a minute." };
  await db.membership.update({ where: { userId: user.id }, data: { status: "cancelled", cancelledAt: new Date(), lastEvent: "cancelled by member" } });
  revalidatePath("/account");
  return { ok: true };
}

/** A Paystack page where the member changes the card their membership is charged to. */
export async function cardLink(): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Your session has ended. Please sign in again." };
  const m = await getMembership(user.id);
  if (!m?.subscriptionCode) return { ok: false, error: "Your membership is still being set up with Paystack. Please try again in a few minutes." };
  const url = await manageLink(m.subscriptionCode);
  return url ? { ok: true, url } : { ok: false, error: "We couldn't reach Paystack just now. Please try again in a minute." };
}
