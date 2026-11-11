import "server-only";

// Paystack's REST API (issue #83), used for The Plug's own fees only: the concierge membership now, and concierge
// fees later (#84). The Plug never handles the payments between visitors and businesses.
// Configure with PAYSTACK_SECRET_KEY and PAYSTACK_PLAN_CODE as Worker secrets. Test keys (sk_test_…) take no real money.

const API = () => (process.env.PAYSTACK_API_URL || "https://api.paystack.co").replace(/\/+$/, "");
const key = () => process.env.PAYSTACK_SECRET_KEY ?? "";
export const planCode = () => process.env.PAYSTACK_PLAN_CODE ?? "";

/** Both settings present: the membership can take payments. Until then the page says it opens soon. */
export const paystackReady = () => Boolean(key() && planCode());
/** The secret key alone is enough for one-off payments such as concierge fees (#84). */
export const paystackKeySet = () => Boolean(key());

type Reply<T> = { status: boolean; message?: string; data?: T };

/** One API call. Returns the data, or null on any failure (logged without personal details). */
async function call<T>(path: string, init: { method?: "GET" | "POST"; body?: unknown } = {}): Promise<T | null> {
  try {
    const res = await fetch(API() + path, {
      method: init.method ?? "GET",
      headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    const json = (await res.json().catch(() => null)) as Reply<T> | null;
    if (!res.ok || !json?.status) {
      console.error(`Paystack ${path.split("/")[1]} failed: ${res.status} ${json?.message ?? ""}`.trim());
      return null;
    }
    return (json.data ?? ({} as T)) as T;
  } catch {
    console.error(`Paystack ${path.split("/")[1]} unreachable`);
    return null;
  }
}

/** Starts a checkout that subscribes the customer to the membership plan. The plan sets the amount. */
export function initializeSubscription(o: { email: string; callbackUrl: string; metadata: Record<string, string> }) {
  return call<{ authorization_url: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    // Paystack requires an amount, but a plan replaces it with the plan's own amount.
    body: { email: o.email, amount: 100, plan: planCode(), callback_url: o.callbackUrl, metadata: o.metadata },
  });
}

export type PaystackTransaction = {
  status: string;
  reference: string;
  amount?: number; // pesewas
  paid_at?: string | null;
  currency?: string;
  metadata?: Record<string, unknown> | string | null;
  customer?: { email?: string; customer_code?: string };
  plan?: string | { plan_code?: string } | null;
  plan_object?: { plan_code?: string } | null;
};

/** A one-off payment in cedis (concierge fees, #84). Card and mobile money, whatever Paystack offers the customer. */
export function initializeCharge(o: { email: string; amountPesewas: number; reference: string; callbackUrl: string; metadata: Record<string, string> }) {
  return call<{ authorization_url: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: { email: o.email, amount: o.amountPesewas, currency: "GHS", reference: o.reference, callback_url: o.callbackUrl, metadata: o.metadata },
  });
}

/** Paystack sometimes sends metadata as a JSON string. */
export function metadataOf(t: { metadata?: unknown }): Record<string, unknown> {
  const m = t.metadata;
  if (m && typeof m === "object") return m as Record<string, unknown>;
  if (typeof m === "string") {
    try {
      const parsed = JSON.parse(m);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {}
  }
  return {};
}

export const verifyTransaction = (reference: string) => call<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`);

/** Stops future charges. The member keeps the benefits until the paid month ends. */
export async function disableSubscription(code: string, token: string) {
  return (await call<unknown>("/subscription/disable", { method: "POST", body: { code, token } })) !== null;
}

/** A Paystack page where the member can change the card the membership is charged to. */
export async function manageLink(code: string) {
  return (await call<{ link: string }>(`/subscription/${encodeURIComponent(code)}/manage/link`))?.link ?? null;
}

let price: { at: number; value: { amount: number; currency: string } | null } | null = null;

/** The plan's price as set in Paystack (pesewas), kept for an hour. null if Paystack isn't set up or can't be reached. */
export async function planPrice() {
  if (!paystackReady()) return null;
  if (price && Date.now() - price.at < 3_600_000) return price.value;
  const plan = await call<{ amount: number; currency: string }>(`/plan/${encodeURIComponent(planCode())}`);
  price = { at: Date.now(), value: plan ? { amount: plan.amount, currency: plan.currency } : null };
  return price.value;
}

/** Paystack signs each webhook with HMAC-SHA512 of the raw body, using the secret key. */
export async function signatureOk(rawBody: string, signature: string | null) {
  if (!signature || !key()) return false;
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(key()), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(rawBody)));
  const expected = [...mac].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}
