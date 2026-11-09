// Concierge membership end to end (issue #83), against the stand-in Paystack in setup.ts: joining, the return from
// checkout, signed webhooks, member priority on concierge requests, cancelling, and deleting an account.
import { createHmac } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { BASE, act, adminCredentials, clearEmails, db, emails, form, page, signIn, visitor } from "./helpers";
import { PAYSTACK_PORT, PAYSTACK_TEST_KEY, PAYSTACK_TEST_PLAN } from "./setup";

const tag = Math.random().toString(36).slice(2, 8);
const EMAIL = `e2e-member-${tag}@example.test`;
const OTHER = `e2e-member-other-${tag}@example.test`;
let cookie: string | null = null;
let reference = "";

async function signInVisitor(email: string) {
  await act("requestSignInCode", [form({ email })], { at: "/account/sign-in", ip: visitor() });
  const list = await emails((l) => l.some((e) => e.to.includes(email) && /sign-in code/.test(e.subject)));
  const code = list.filter((e) => e.to.includes(email) && /sign-in code/.test(e.subject)).pop()!.subject.slice(0, 6);
  return (await act("verifySignInCode", [form({ email, code }, { human: false })], { at: "/account/sign-in", ip: visitor() })).cookie;
}

const paystackCalls = async () => (await (await fetch(`http://localhost:${PAYSTACK_PORT}/__paystack`)).json()) as { path: string; body: Record<string, unknown> }[];

/** Sends a webhook the way Paystack does: signed with HMAC-SHA512 of the body. */
async function webhook(event: string, data: Record<string, unknown>, sign = true) {
  const body = JSON.stringify({ event, data });
  const signature = sign ? createHmac("sha512", PAYSTACK_TEST_KEY).update(body).digest("hex") : "0".repeat(128);
  const res = await fetch(`${BASE}/api/paystack/webhook`, { method: "POST", headers: { "Content-Type": "application/json", "x-paystack-signature": signature }, body });
  return { status: res.status, body: (await res.json().catch(() => ({}))) as { outcome?: string } };
}

const membership = async (email: string) => (await db.user.findUnique({ where: { email }, include: { membership: true } }))?.membership ?? null;
const later = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

beforeAll(async () => {
  await clearEmails();
  cookie = await signInVisitor(EMAIL);
});

afterAll(async () => {
  await db.conciergeRequest.deleteMany({ where: { name: { startsWith: "E2E Member" } } });
  await db.user.deleteMany({ where: { email: { startsWith: "e2e-member-" } } });
  await db.signInCode.deleteMany({ where: { email: { startsWith: "e2e-member-" } } });
  await db.rateLimit.deleteMany({ where: { key: { startsWith: "signin" } } });
});

describe("joining", () => {
  it("shows the price in dollars and the plan's cedi amount", async () => {
    const r = await page("/membership");
    expect(r.status).toBe(200);
    expect(r.html).toContain("$<!-- -->8");
    expect(r.html).toContain("GHS 123.45");
  });

  it("asks visitors to sign in before joining", async () => {
    const r = await act("startMembership", [], { at: "/membership", ip: visitor() });
    expect(r.result).toMatchObject({ ok: false, signIn: true });
  });

  it("starts a Paystack checkout for the plan, with the visitor's email", async () => {
    const r = await act("startMembership", [], { at: "/membership", cookie, ip: visitor() });
    expect(r.result).toMatchObject({ ok: true });
    expect(String(r.result?.url)).toMatch(/^https:\/\/checkout\.paystack\.test\//);
    reference = String(r.result?.url).split("/").pop()!;
    const init = (await paystackCalls()).filter((c) => c.path === "/transaction/initialize").pop()!;
    expect(init.body).toMatchObject({ email: EMAIL, plan: PAYSTACK_TEST_PLAN });
    expect(String(init.body.callback_url)).toMatch(/\/membership\/welcome$/);
    expect((await membership(EMAIL))?.status).toBe("pending");
  });

  it("confirms the payment with Paystack on the way back, and welcomes the member", async () => {
    const r = await page(`/membership/welcome?reference=${reference}`, cookie);
    expect(r.status).toBe(200);
    expect(r.html).toContain("you&#x27;re a member");
    expect((await membership(EMAIL))?.status).toBe("active");
    const list = await emails((l) => l.some((e) => e.subject === "Welcome to the concierge membership") && l.some((e) => e.subject.startsWith("New concierge member")));
    expect(list.find((e) => e.subject === "Welcome to the concierge membership")?.to).toContain(EMAIL);
  });

  it("doesn't trust a reference that belongs to someone else", async () => {
    const other = await signInVisitor(OTHER);
    const r = await page(`/membership/welcome?reference=${reference}`, other);
    expect(r.html).toContain("haven&#x27;t received the payment");
    expect((await membership(OTHER))?.status ?? null).not.toBe("active");
  });

  it("won't start a second subscription for a member", async () => {
    const r = await act("startMembership", [], { at: "/membership", cookie, ip: visitor() });
    expect(r.result).toMatchObject({ ok: false });
    expect(String(r.result?.error)).toMatch(/already a member/);
  });
});

describe("Paystack's webhook", () => {
  it("refuses events that aren't signed with the secret key", async () => {
    const r = await webhook("subscription.disable", { customer: { email: EMAIL }, subscription_code: "SUB_x" }, false);
    expect(r.status).toBe(401);
    expect((await membership(EMAIL))?.status).toBe("active");
  });

  it("records the subscription and its renewal date", async () => {
    const r = await webhook("subscription.create", {
      subscription_code: `SUB_${tag}`,
      email_token: `tok_${tag}`,
      next_payment_date: later(30),
      status: "active",
      plan: { plan_code: PAYSTACK_TEST_PLAN },
      customer: { email: EMAIL.toUpperCase(), customer_code: "CUS_e2e" },
    });
    expect(r.body.outcome).toBe("active");
    const m = await membership(EMAIL);
    expect(m).toMatchObject({ status: "active", subscriptionCode: `SUB_${tag}`, emailToken: `tok_${tag}` });
    expect(m?.currentPeriodEnd).toBeTruthy();
  });

  it("marks a failed renewal, then recovers when the invoice is paid", async () => {
    expect((await webhook("invoice.payment_failed", { customer: { email: EMAIL }, subscription: { subscription_code: `SUB_${tag}` } })).body.outcome).toBe("past_due");
    expect((await membership(EMAIL))?.status).toBe("past_due");
    expect((await page("/account", cookie)).html).toContain("didn&#x27;t go through");
    const paid = await webhook("invoice.update", { paid: true, customer: { email: EMAIL }, subscription: { subscription_code: `SUB_${tag}`, next_payment_date: later(30) } });
    expect(paid.body.outcome).toBe("active");
  });

  it("ignores other plans and unknown customers", async () => {
    expect((await webhook("subscription.disable", { customer: { email: EMAIL }, plan: { plan_code: "PLN_other" } })).body.outcome).toMatch(/another plan/);
    expect((await webhook("subscription.disable", { customer: { email: "nobody@example.test" } })).body.outcome).toMatch(/no account/);
    expect((await membership(EMAIL))?.status).toBe("active");
  });
});

describe("being a member", () => {
  it("puts members' concierge requests first and marks them for the team", async () => {
    const r = await act(
      "submitConcierge",
      [form({ name: `E2E Member ${tag}`, phone: "0240000003", city: "Accra", category: "rentals", details: "A flat for my family", when: "This month", serviceMode: "remote" })],
      { cookie, ip: visitor() },
    );
    const ref = String(r.result?.ref);
    expect((await db.conciergeRequest.findUnique({ where: { ref } }))?.fromMember).toBe(true);
    const list = await emails((l) => l.some((e) => e.subject.includes(ref)));
    expect(list.find((e) => e.subject.includes(ref))?.subject).toMatch(/^Member · /);
    const { email, password } = adminCredentials();
    const owner = (await signIn(email, password, visitor())).cookie;
    const inbox = await page("/admin/concierge?status=new", owner);
    expect(inbox.html.indexOf(ref)).toBeGreaterThan(-1);
    expect((await page("/admin/members", owner)).html).toContain(EMAIL);
  });

  it("opens Paystack's page to change the card", async () => {
    const r = await act("cardLink", [], { at: "/account", cookie, ip: visitor() });
    expect(r.result).toMatchObject({ ok: true, url: "https://paystack.test/manage/e2e" });
  });

  it("cancels with Paystack and keeps the benefits until the month ends", async () => {
    const r = await act("cancelMembership", [], { at: "/account", cookie, ip: visitor() });
    expect(r.result).toMatchObject({ ok: true });
    const disable = (await paystackCalls()).filter((c) => c.path === "/subscription/disable").pop();
    expect(disable?.body).toMatchObject({ code: `SUB_${tag}`, token: `tok_${tag}` });
    expect((await membership(EMAIL))?.status).toBe("cancelled");
    expect((await page("/account", cookie)).html).toContain("Your benefits last until");
  });

  it("cancels a running membership with Paystack before deleting the account", async () => {
    const other = await signInVisitor(OTHER);
    await webhook("subscription.create", {
      subscription_code: `SUB_other_${tag}`,
      email_token: `tok_other_${tag}`,
      next_payment_date: later(30),
      plan: { plan_code: PAYSTACK_TEST_PLAN },
      customer: { email: OTHER },
    });
    expect((await membership(OTHER))?.status).toBe("active");
    const r = await act("deleteAccount", [form({ confirm: "DELETE" }, { human: false })], { cookie: other, ip: visitor() });
    expect(r.redirect).toContain("/?account=deleted");
    const disable = (await paystackCalls()).filter((c) => c.path === "/subscription/disable").pop();
    expect(disable?.body).toMatchObject({ code: `SUB_other_${tag}`, token: `tok_other_${tag}` });
    expect(await db.user.findUnique({ where: { email: OTHER } })).toBeNull();
  });
});
