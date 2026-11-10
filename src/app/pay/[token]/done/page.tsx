import { redirect } from "next/navigation";
import { confirmFeePayment } from "@/lib/fee-server";
import { verifyTransaction } from "@/lib/paystack";

/**
 * Paystack sends payers back here after checkout (issue #84). The payment is checked with Paystack (never trusted from
 * the address), then the fee's page shows "Paid" or the button again.
 */
export default async function Done({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ reference?: string; trxref?: string }> }) {
  const [{ token }, sp] = await Promise.all([params, searchParams]);
  const reference = String(sp.reference ?? sp.trxref ?? "").slice(0, 100);
  if (reference) await confirmFeePayment(await verifyTransaction(reference));
  redirect(`/pay/${encodeURIComponent(token)}`);
}
