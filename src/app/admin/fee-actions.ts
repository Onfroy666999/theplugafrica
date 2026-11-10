"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { createDeal, feeForEmail, payUrl, sendFeeEmail } from "@/lib/fee-server";
import { businessRate, customerRate, parseCedis } from "@/lib/fees";
import { formatGhs } from "@/lib/membership-plan";

// Concierge fees in the admin (issue #84). Editors record deals and mark fees paid; owners waive or cancel them.

const text = (max: number) => z.string().trim().min(1).max(max);
const optional = (max: number) => z.string().trim().max(max).optional().transform((v) => v || null);
const email = z.string().trim().toLowerCase().max(160).optional().transform((v) => v || null).pipe(z.email().nullable());

const DealSchema = z.object({
  requestId: text(40),
  businessId: optional(40),
  businessName: optional(160),
  description: text(200),
  value: text(30),
  chargeCustomer: z.string().optional(),
  chargeBusiness: z.string().optional(),
  customerName: optional(120),
  customerEmail: email,
  customerPhone: optional(40),
  businessEmail: email,
  businessPhone: optional(40),
  send: z.string().optional(),
});

export type DealResult =
  | { ok: true; dealId: string; fees: { party: string; ref: string; amount: string; url: string; emailed: boolean }[] }
  | { ok: false; error: string };

export async function recordDeal(fd: FormData): Promise<DealResult> {
  const admin = await requireAdmin("edit");
  const parsed = DealSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    return { ok: false, error: field === "customerEmail" || field === "businessEmail" ? "Check the email addresses." : "Fill in what the deal was for and its agreed price." };
  }
  const d = parsed.data;
  const value = parseCedis(d.value);
  if (!value) return { ok: false, error: "Enter the agreed price in cedis, for example 12500 or 12,500.50." };
  const request = await db.conciergeRequest.findUnique({ where: { id: d.requestId }, select: { id: true, ref: true, name: true, phone: true, email: true, fromMember: true } });
  if (!request) return { ok: false, error: "That concierge request no longer exists." };
  const business = d.businessId ? await db.business.findUnique({ where: { id: d.businessId }, select: { id: true, name: true, email: true, phone: true } }) : null;
  const businessName = business?.name ?? d.businessName;
  if (!businessName) return { ok: false, error: "Choose the business, or type its name if it isn't listed." };
  const chargeCustomer = d.chargeCustomer === "on";
  const chargeBusiness = d.chargeBusiness === "on";
  if (!chargeCustomer && !chargeBusiness) return { ok: false, error: "Charge at least one side." };

  const deal = await createDeal({
    requestId: request.id,
    businessId: business?.id ?? null,
    businessName,
    description: d.description,
    valuePesewas: value,
    // The member rate applies if the request came from a member (#83).
    customerRate: customerRate(request.fromMember),
    businessRate: businessRate(),
    customer: chargeCustomer ? { name: d.customerName ?? request.name, email: d.customerEmail ?? request.email, phone: d.customerPhone ?? request.phone } : null,
    business: chargeBusiness ? { name: businessName, email: d.businessEmail ?? business?.email ?? null, phone: d.businessPhone ?? business?.phone ?? null } : null,
    recordedById: admin.id,
  });

  const fees = [];
  for (const f of deal.fees) {
    let emailed = false;
    if (d.send === "on" && f.email) {
      const full = await feeForEmail(f.id);
      emailed = full ? await sendFeeEmail(full) : false;
    }
    fees.push({ party: f.party, ref: f.ref, amount: formatGhs(f.amountPesewas), url: payUrl(f.token), emailed });
  }
  await audit(admin, "fee.record", `Recorded a ${formatGhs(value)} deal on concierge request ${deal.request.ref}: ${fees.map((f) => `${f.party} ${f.amount}`).join(", ")}`, { type: "deal", id: deal.id });
  revalidatePath("/admin/fees");
  revalidatePath("/admin/concierge");
  return { ok: true, dealId: deal.id, fees };
}

type Simple = { ok: true; message?: string } | { ok: false; error: string };

/** Resend, mark paid (e.g. paid by mobile money directly), waive or cancel one fee. */
export async function updateFee(id: string, action: "resend" | "paid" | "waive" | "cancel", note?: string): Promise<Simple> {
  const admin = await requireAdmin(action === "waive" || action === "cancel" ? "delete" : "edit");
  const fee = await feeForEmail(String(id));
  if (!fee) return { ok: false, error: "That fee no longer exists." };
  const cleanNote = String(note ?? "").trim().slice(0, 300) || null;
  if (action === "resend") {
    if (fee.status !== "due") return { ok: false, error: "Only a fee that's still due can be sent again." };
    if (!fee.email) return { ok: false, error: "There's no email address for this fee. Copy the pay link and send it by WhatsApp." };
    if (!(await sendFeeEmail(fee))) return { ok: false, error: "The email didn't send. Check the email settings, or copy the link instead." };
    await audit(admin, "fee.resend", `Sent fee ${fee.ref} again`, { type: "fee", id: fee.id });
  } else {
    if (fee.status !== "due") return { ok: false, error: "This fee is no longer due." };
    const status = action === "paid" ? "paid" : action === "waive" ? "waived" : "cancelled";
    await db.conciergeFee.update({
      where: { id: fee.id },
      data: { status, note: cleanNote, ...(action === "paid" && { paidVia: "offline", paidAt: new Date() }) },
    });
    const verb = { paid: "Marked fee", waive: "Waived fee", cancel: "Cancelled fee" }[action];
    await audit(admin, action === "paid" ? "fee.paid" : action === "waive" ? "fee.waive" : "fee.cancel", `${verb} ${fee.ref} (${formatGhs(fee.amountPesewas)})${action === "paid" ? " as paid outside Paystack" : ""}`, { type: "fee", id: fee.id });
  }
  revalidatePath("/admin/fees");
  return { ok: true, message: action === "resend" ? "Sent." : undefined };
}
