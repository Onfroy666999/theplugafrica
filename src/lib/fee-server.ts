import "server-only";
import { after } from "next/server";
import { db } from "./db";
import { layout, sendEmail } from "./email";
import { feeAmount, percentLabel } from "./fees";
import { formatGhs } from "./membership-plan";
import { initializeCharge, metadataOf, type PaystackTransaction } from "./paystack";
import { SITE_URL } from "./site";
import { makeRef } from "./validation";

// Concierge fees (issue #84): record a deal, email each side a pay link, take the payment through Paystack and mark
// the fee paid. The Plug only ever receives its own fee; the deal is paid directly between customer and business.

/** 32 random hex characters: the part of a pay link nobody can guess. */
function token() {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

export const payUrl = (t: string) => `${SITE_URL}/pay/${t}`;

type Party = { name: string; email: string | null; phone: string | null };

export type DealInput = {
  requestId: string;
  businessId: string | null;
  businessName: string;
  description: string;
  valuePesewas: number;
  customerRate: number;
  businessRate: number;
  customer: Party | null; // null = don't charge the customer
  business: Party | null; // null = don't charge the business
  recordedById: string;
};

/** Saves the deal and one fee per side charged. A rate of 0 charges nothing on that side. */
export async function createDeal(d: DealInput) {
  const fees: (Party & { party: string; amountPesewas: number })[] = [];
  if (d.customer) fees.push({ party: "customer", ...d.customer, amountPesewas: feeAmount(d.valuePesewas, d.customerRate) });
  if (d.business) fees.push({ party: "business", ...d.business, amountPesewas: feeAmount(d.valuePesewas, d.businessRate) });
  fees.splice(0, fees.length, ...fees.filter((f) => f.amountPesewas > 0));
  return db.conciergeDeal.create({
    data: {
      requestId: d.requestId,
      businessId: d.businessId,
      businessName: d.businessName,
      description: d.description,
      valuePesewas: d.valuePesewas,
      customerRate: d.customerRate,
      businessRate: d.businessRate,
      recordedById: d.recordedById,
      fees: { create: fees.map((f) => ({ ...f, ref: makeRef("FEE"), token: token() })) },
    },
    include: { fees: true, request: { select: { ref: true } } },
  });
}

type FeeWithDeal = {
  id: string;
  ref: string;
  token: string;
  party: string;
  name: string;
  email: string | null;
  amountPesewas: number;
  deal: { description: string; businessName: string; valuePesewas: number; customerRate: number; businessRate: number; request: { ref: string; name: string } };
};

/** Emails one side its fee with the pay link. Returns false if there's no address or sending failed. */
export async function sendFeeEmail(f: FeeWithDeal) {
  if (!f.email) return false;
  const d = f.deal;
  const rate = percentLabel(f.party === "customer" ? d.customerRate : d.businessRate);
  const customerFirst = d.request.name.split(" ")[0];
  const intro =
    f.party === "customer"
      ? `Thank you for using The Plug concierge. As agreed before we started, our fee is ${rate} of the agreed price with ${d.businessName}.`
      : `The Plug concierge introduced ${customerFirst} to ${d.businessName}. As agreed, The Plug's fee is ${rate} of the agreed price.`;
  const sent = await sendEmail({
    to: f.email,
    subject: `${f.party === "customer" ? "Your concierge fee" : "Introduction fee from The Plug"}: ${d.description} (${f.ref})`,
    ...layout({
      heading: f.party === "customer" ? "Your concierge fee" : "Introduction fee",
      intro,
      rows: [
        ["For", d.description],
        ["Agreed price", formatGhs(d.valuePesewas)],
        [`Fee (${rate})`, formatGhs(f.amountPesewas)],
        ["Fee reference", f.ref],
        ["Request", d.request.ref],
      ],
      button: { label: `Pay ${formatGhs(f.amountPesewas)}`, href: payUrl(f.token) },
      footer:
        f.party === "customer"
          ? `Pay by card or mobile money through Paystack. This fee is The Plug's only charge: you pay ${d.businessName} directly for the service itself.`
          : `Pay by card or mobile money through Paystack. The Plug never handles the payment between you and your customer.`,
    }),
  });
  if (sent) await db.conciergeFee.update({ where: { id: f.id }, data: { sentAt: new Date() } });
  return sent;
}

export const feeForEmail = (id: string) =>
  db.conciergeFee.findUnique({
    where: { id },
    include: { deal: { select: { description: true, businessName: true, valuePesewas: true, customerRate: true, businessRate: true, request: { select: { ref: true, name: true } } } } },
  });

/** Opens a Paystack checkout for a fee. Each attempt gets its own Paystack reference; the fee is found by its id. */
export async function startFeePayment(fee: { id: string; ref: string; token: string; amountPesewas: number }, email: string) {
  const attempt = `${fee.ref}-${Date.now().toString(36).toUpperCase()}`;
  return initializeCharge({
    email,
    amountPesewas: fee.amountPesewas,
    reference: attempt,
    callbackUrl: `${SITE_URL}/pay/${fee.token}/done`,
    metadata: { purpose: "concierge_fee", feeId: fee.id },
  });
}

/**
 * Marks a fee paid from a Paystack transaction (the return from checkout, or the webhook), after checking it really
 * is a successful payment of at least the fee, in cedis, for this fee. Returns the fee's ref when it was newly paid.
 */
export async function confirmFeePayment(t: PaystackTransaction | null): Promise<"paid" | "already" | "no"> {
  if (!t || t.status !== "success") return "no";
  const meta = metadataOf(t);
  if (meta.purpose !== "concierge_fee" || typeof meta.feeId !== "string") return "no";
  const fee = await db.conciergeFee.findUnique({ where: { id: meta.feeId }, include: { deal: { select: { description: true } } } });
  if (!fee) return "no";
  if (fee.status !== "due") {
    // Money arrived for a fee that was already paid, waived or cancelled (two tabs, or waived during checkout).
    if (t.reference !== fee.paystackRef) await flagRefund(fee, t);
    return "already";
  }
  if ((t.currency ?? "GHS") !== "GHS" || (t.amount ?? 0) < fee.amountPesewas) return "no";
  // Only a fee still due becomes paid; the condition makes a webhook and a return arriving together count once.
  const done = await db.conciergeFee.updateMany({ where: { id: fee.id, status: "due" }, data: { status: "paid", paidVia: "paystack", paystackRef: t.reference, paidAt: new Date() } });
  if (done.count === 0) return "already";
  notifyFeePaid({ ref: fee.ref, party: fee.party, name: fee.name, amountPesewas: fee.amountPesewas, description: fee.deal.description });
  return "paid";
}

/** Records an extra payment on the fee and tells the team, once per Paystack reference. */
async function flagRefund(fee: { id: string; ref: string; status: string; note: string | null }, t: PaystackTransaction) {
  const mark = `Extra payment ${t.reference}`;
  if (fee.note?.includes(mark)) return;
  const amount = formatGhs(t.amount ?? 0);
  await db.conciergeFee.update({ where: { id: fee.id }, data: { note: [fee.note, `${mark} (${amount}): refund needed`].filter(Boolean).join(" · ").slice(0, 1000) } });
  const to = (process.env.NOTIFY_EMAIL ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!to.length) return;
  after(() =>
    sendEmail({
      to,
      subject: `Refund needed: ${amount} paid on fee ${fee.ref}`,
      ...layout({
        heading: "A payment needs refunding",
        intro: `Paystack took ${amount} for fee ${fee.ref}, which was already ${fee.status}. Refund it in the Paystack dashboard.`,
        rows: [["Paystack reference", t.reference], ["Fee reference", fee.ref]],
        button: { label: "Open fees in the admin", href: `${SITE_URL}/admin/fees` },
        footer: "You're receiving this because you're on The Plug Africa team.",
      }),
    }),
  );
}

function notifyFeePaid(f: { ref: string; party: string; name: string; amountPesewas: number; description: string }) {
  const to = (process.env.NOTIFY_EMAIL ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!to.length) return;
  after(async () => {
    await sendEmail({
      to,
      subject: `Fee paid: ${formatGhs(f.amountPesewas)} from ${f.name} (${f.ref})`,
      ...layout({
        heading: "A concierge fee was paid",
        intro: `${f.name} (${f.party}) paid ${formatGhs(f.amountPesewas)} through Paystack.`,
        rows: [["For", f.description], ["Fee reference", f.ref]],
        button: { label: "Open fees in the admin", href: `${SITE_URL}/admin/fees` },
        footer: "You're receiving this because you're on The Plug Africa team.",
      }),
    });
  });
}
