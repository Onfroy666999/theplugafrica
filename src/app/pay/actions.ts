"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { startFeePayment } from "@/lib/fee-server";
import { paystackKeySet } from "@/lib/paystack";
import { limitForm } from "@/lib/protect";

// Paying a concierge fee from its emailed link (issue #84). No account needed: the link itself is the key.

const EmailSchema = z.string().trim().toLowerCase().max(160).pipe(z.email());

export async function payFee(token: string, emailInput?: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (await limitForm("pay", 20)) return { ok: false, error: "Too many tries in a short time. Please wait a few minutes." };
  const fee = await db.conciergeFee.findUnique({ where: { token: String(token) } });
  if (!fee) return { ok: false, error: "This payment link isn't valid." };
  if (fee.status !== "due") return { ok: false, error: fee.status === "paid" ? "This fee has already been paid. Thank you." : "This fee is no longer due." };
  if (!paystackKeySet()) return { ok: false, error: "Online payment isn't available yet. Please reply to the email and we'll arrange it." };
  // Paystack needs an email for the receipt; most fees already have one.
  const email = fee.email ?? (emailInput ? EmailSchema.safeParse(emailInput).data : undefined);
  if (!email) return { ok: false, error: "Enter your email address for the receipt." };
  const checkout = await startFeePayment(fee, email);
  if (!checkout) return { ok: false, error: "We couldn't reach Paystack just now. Please try again in a minute." };
  return { ok: true, url: checkout.authorization_url };
}
