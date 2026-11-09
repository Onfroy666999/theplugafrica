import "server-only";
import { db } from "./db";
import { hasBenefits } from "./membership-plan";
import { notifyNewMember } from "./notify";
import { planCode, type PaystackTransaction } from "./paystack";
import { normaliseEmail } from "./signin-code";

// Concierge membership records (issue #83). Paystack is the source of truth: its webhook events update the row,
// and the return from checkout confirms the first payment straight away so the member doesn't wait for the webhook.

export const getMembership = (userId: string) => db.membership.findUnique({ where: { userId } });

export async function isMember(userId: string) {
  return hasBenefits(await getMembership(userId));
}

const planOf = (p: PaystackTransaction["plan"], o?: PaystackTransaction["plan_object"]) => (typeof p === "string" ? p : (p?.plan_code ?? o?.plan_code ?? null));

/** After checkout: a successful payment for the membership plan by this visitor makes them a member. */
export async function confirmCheckout(userId: string, email: string, t: PaystackTransaction | null) {
  if (!t || t.status !== "success") return false;
  if (normaliseEmail(t.customer?.email ?? "") !== normaliseEmail(email)) return false;
  if (planOf(t.plan, t.plan_object) !== planCode()) return false;
  await activate(userId, { customerCode: t.customer?.customer_code ?? null, lastEvent: "checkout" });
  return true;
}

async function activate(userId: string, data: { customerCode?: string | null; subscriptionCode?: string | null; emailToken?: string | null; currentPeriodEnd?: Date | null; lastEvent: string }) {
  const before = await getMembership(userId);
  const fresh = !before || !hasBenefits(before);
  const set = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined && v !== null));
  await db.membership.upsert({
    where: { userId },
    create: { userId, status: "active", planCode: planCode(), startedAt: new Date(), ...set },
    update: { status: "active", planCode: planCode(), cancelledAt: null, ...(fresh && { startedAt: new Date() }), ...set },
  });
  if (fresh) {
    const u = await db.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
    if (u) notifyNewMember(u);
  }
}

// The parts of Paystack's webhook payloads this uses.
type Sub = { subscription_code?: string; email_token?: string; next_payment_date?: string | null; status?: string; plan?: { plan_code?: string } };
export type PaystackEvent = {
  event: string;
  data: Sub & {
    customer?: { email?: string; customer_code?: string };
    plan?: { plan_code?: string } | string | null;
    subscription?: Sub;
    paid?: boolean;
    status?: string;
  };
};

const date = (s?: string | null) => (s ? new Date(s) : undefined);

/** Applies one webhook event. Returns what it did, for the logs and the tests. */
export async function applyPaystackEvent(e: PaystackEvent): Promise<string> {
  const d = e.data ?? {};
  const email = normaliseEmail(d.customer?.email ?? "");
  const user = email ? await db.user.findUnique({ where: { email }, select: { id: true } }) : null;
  if (!user) return "ignored: no account for this customer";
  const plan = typeof d.plan === "string" ? d.plan : (d.plan?.plan_code ?? d.subscription?.plan?.plan_code);
  if (plan && plan !== planCode()) return "ignored: another plan";
  const sub = d.subscription ?? d;
  const where = { userId: user.id };

  switch (e.event) {
    case "subscription.create":
      await activate(user.id, {
        subscriptionCode: d.subscription_code,
        emailToken: d.email_token,
        customerCode: d.customer?.customer_code,
        currentPeriodEnd: date(d.next_payment_date),
        lastEvent: e.event,
      });
      return "active";
    case "charge.success":
      if (!plan) return "ignored: not a membership charge";
      await activate(user.id, { customerCode: d.customer?.customer_code, lastEvent: e.event });
      return "active";
    case "invoice.create":
    case "invoice.update":
      if (!d.paid) return "ignored: unpaid invoice";
      await activate(user.id, { currentPeriodEnd: date(sub.next_payment_date), subscriptionCode: sub.subscription_code, lastEvent: e.event });
      return "active";
    case "invoice.payment_failed":
      await db.membership.updateMany({ where, data: { status: "past_due", lastEvent: e.event } });
      return "past_due";
    case "subscription.not_renew":
      await db.membership.updateMany({ where, data: { status: "non_renewing", currentPeriodEnd: date(d.next_payment_date), lastEvent: e.event } });
      return "non_renewing";
    case "subscription.disable":
      await db.membership.updateMany({ where, data: { status: "cancelled", cancelledAt: new Date(), lastEvent: e.event } });
      return "cancelled";
    default:
      return `ignored: ${e.event}`;
  }
}
