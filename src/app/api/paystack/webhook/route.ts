import { applyPaystackEvent, type PaystackEvent } from "@/lib/membership";
import { signatureOk } from "@/lib/paystack";

// Paystack's webhook (issue #83). Set its URL in Paystack › Settings › API Keys & Webhooks:
//   https://theplugafrica.org/api/paystack/webhook
// Every event is signed with the secret key; anything unsigned or wrongly signed is refused.

export async function POST(req: Request) {
  const raw = await req.text();
  if (!(await signatureOk(raw, req.headers.get("x-paystack-signature")))) return new Response("Invalid signature", { status: 401 });
  let event: PaystackEvent;
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  const outcome = await applyPaystackEvent(event);
  // The event name and outcome only: no customer details in the logs.
  console.log(`Paystack ${event.event}: ${outcome}`);
  return Response.json({ ok: true, outcome });
}
