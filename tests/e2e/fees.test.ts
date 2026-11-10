// Concierge fees end to end (issue #84), against the stand-in Paystack in setup.ts: recording a deal, the emailed pay
// links, paying through Paystack (return and webhook), marking paid, waiving, roles, deletion and the spreadsheet.
import { createHmac } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { BASE, act, adminCredentials, clearEmails, db, emails, form, page, signIn, visitor } from "./helpers";
import { PAYSTACK_PORT, PAYSTACK_TEST_KEY } from "./setup";

const tag = Math.random().toString(36).slice(2, 8);
const CUSTOMER = `e2e-fee-customer-${tag}@example.test`;
const BUSINESS = `e2e-fee-business-${tag}@example.test`;
let owner: string | null = null;
let requestId = "";
let businessId = "";
let customerToken = "";
let businessToken = "";

const paystackCalls = async () => (await (await fetch(`http://localhost:${PAYSTACK_PORT}/__paystack`)).json()) as { path: string; body: Record<string, unknown> }[];
const fee = (token: string) => db.conciergeFee.findUniqueOrThrow({ where: { token } });

function deal(over: Record<string, string> = {}) {
  return form(
    { requestId, businessId, description: "12-month lease, 2-bed in Osu", value: "36,000", chargeCustomer: "on", chargeBusiness: "on", customerEmail: CUSTOMER, businessEmail: BUSINESS, send: "on", ...over },
    { human: false },
  );
}

beforeAll(async () => {
  await clearEmails();
  const { email, password } = adminCredentials();
  owner = (await signIn(email, password, visitor())).cookie;
  businessId = (
    await db.business.create({
      data: { slug: `e2e-fee-business-${tag}`, name: "E2E Fee Lettings", category: "rentals", kind: "Letting agent", city: "Accra", area: "Osu", blurb: "x", about: "x", status: "verified", images: "[]" },
    })
  ).id;
  requestId = (await db.conciergeRequest.create({ data: { ref: `CNC-FEE${tag.slice(0, 1).toUpperCase()}-E2E${tag.slice(1, 2).toUpperCase()}`, name: "E2E Fee Customer", phone: "0240000004", city: "Accra", category: "rentals", details: "A flat in Osu", timing: "This month" } })).id;
});

afterAll(async () => {
  await db.conciergeDeal.deleteMany({ where: { requestId } });
  await db.conciergeRequest.deleteMany({ where: { id: requestId } });
  await db.business.deleteMany({ where: { id: businessId } });
});

describe("recording a deal", () => {
  it("is for editors and owners only", async () => {
    const r = await act("recordDeal", [deal()], { at: "/admin/fees/new", ip: visitor() });
    expect(r.result).toBeNull(); // not signed in: redirected to sign-in, nothing saved
    expect(await db.conciergeDeal.count({ where: { requestId } })).toBe(0);
  });

  it("refuses a nonsense price", async () => {
    const r = await act("recordDeal", [deal({ value: "a lot" })], { at: "/admin/fees/new", cookie: owner, ip: visitor() });
    expect(r.result).toMatchObject({ ok: false });
  });

  it("charges 10% to each side and emails each a pay link", async () => {
    const r = await act("recordDeal", [deal()], { at: "/admin/fees/new", cookie: owner, ip: visitor() });
    expect(r.result).toMatchObject({ ok: true });
    const fees = (r.result?.fees ?? []) as { party: string; amount: string; url: string; emailed: boolean }[];
    expect(fees.map((f) => [f.party, f.amount, f.emailed])).toEqual([
      ["customer", "GHS 3,600", true],
      ["business", "GHS 3,600", true],
    ]);
    customerToken = fees[0].url.split("/pay/")[1];
    businessToken = fees[1].url.split("/pay/")[1];
    expect(customerToken).toMatch(/^[0-9a-f]{32}$/);
    const list = await emails((l) => l.filter((e) => /concierge fee|Introduction fee/.test(e.subject)).length >= 2);
    const toCustomer = list.find((e) => e.to.includes(CUSTOMER));
    expect(toCustomer?.subject).toMatch(/^Your concierge fee: 12-month lease/);
    expect(toCustomer?.text).toContain(`/pay/${customerToken}`);
    expect(list.find((e) => e.to.includes(BUSINESS))?.subject).toMatch(/^Introduction fee from The Plug/);
  });

  it("shows on the concierge request and won't let it be deleted", async () => {
    expect((await page("/admin/concierge", owner)).html).toContain("12-month lease, 2-bed in Osu");
    const r = await act("deleteInboxItem", ["concierge", requestId], { at: "/admin/concierge", cookie: owner, ip: visitor() });
    expect(r.result).toMatchObject({ ok: false });
    expect(await db.conciergeRequest.count({ where: { id: requestId } })).toBe(1);
  });
});

describe("paying", () => {
  it("shows the fee on its pay page, without needing an account", async () => {
    const r = await page(`/pay/${customerToken}`);
    expect(r.status).toBe(200);
    expect(r.html).toContain("GHS 3,600");
    expect(r.html).toContain("E2E Fee Lettings");
    expect((await page("/pay/0123456789abcdef0123456789abcdef")).status).toBe(404);
  });

  it("opens a Paystack checkout for exactly the fee, in cedis", async () => {
    const r = await act("payFee", [customerToken], { at: `/pay/${customerToken}`, ip: visitor() });
    expect(r.result).toMatchObject({ ok: true });
    const init = (await paystackCalls()).filter((c) => c.path === "/transaction/initialize").pop()!;
    expect(init.body).toMatchObject({ email: CUSTOMER, amount: 360_000, currency: "GHS", metadata: { purpose: "concierge_fee" } });
    expect(String(init.body.callback_url)).toContain(`/pay/${customerToken}/done`);
    // Coming back from checkout: the payment is checked with Paystack, then the fee is paid.
    const back = await fetch(`${BASE}/pay/${customerToken}/done?reference=${encodeURIComponent(String(init.body.reference))}`, { redirect: "manual" });
    expect(back.status).toBe(307);
    expect((await fee(customerToken)).status).toBe("paid");
    expect((await fee(customerToken)).paidVia).toBe("paystack");
    expect((await page(`/pay/${customerToken}`)).html).toContain("Paid. Thank you.");
    const list = await emails((l) => l.some((e) => e.subject.startsWith("Fee paid: GHS 3,600")));
    expect(list.some((e) => e.subject.startsWith("Fee paid"))).toBe(true);
  });

  it("won't take a second payment for a paid fee", async () => {
    const r = await act("payFee", [customerToken], { at: `/pay/${customerToken}`, ip: visitor() });
    expect(r.result).toMatchObject({ ok: false });
    expect(String(r.result?.error)).toMatch(/already been paid/);
  });

  it("marks a fee paid from Paystack's signed webhook, and only for the full amount", async () => {
    const f = await fee(businessToken);
    const send = async (amount: number, sign = true) => {
      const body = JSON.stringify({ event: "charge.success", data: { status: "success", reference: `${f.ref}-X${amount}`, amount, currency: "GHS", customer: { email: BUSINESS }, metadata: { purpose: "concierge_fee", feeId: f.id } } });
      const sig = sign ? createHmac("sha512", PAYSTACK_TEST_KEY).update(body).digest("hex") : "0".repeat(128);
      return fetch(`${BASE}/api/paystack/webhook`, { method: "POST", headers: { "x-paystack-signature": sig }, body });
    };
    expect((await send(360_000, false)).status).toBe(401);
    await send(100); // underpaid: ignored
    expect((await fee(businessToken)).status).toBe("due");
    const ok = (await (await send(360_000)).json()) as { outcome: string };
    expect(ok.outcome).toBe("fee paid");
    expect((await fee(businessToken)).status).toBe("paid");
  });
});

describe("managing fees", () => {
  let token = "";
  it("records a deal for one side only, and marks it paid outside Paystack", async () => {
    const r = await act("recordDeal", [deal({ chargeBusiness: "", description: "Driver for a week", value: "2500", send: "" })], { at: "/admin/fees/new", cookie: owner, ip: visitor() });
    const fees = (r.result?.fees ?? []) as { party: string; amount: string; url: string; emailed: boolean }[];
    expect(fees).toHaveLength(1);
    expect(fees[0]).toMatchObject({ party: "customer", amount: "GHS 250", emailed: false });
    token = fees[0].url.split("/pay/")[1];
    const f = await fee(token);
    const paid = await act("updateFee", [f.id, "paid", "Paid by MoMo"], { at: "/admin/fees", cookie: owner, ip: visitor() });
    expect(paid.result).toMatchObject({ ok: true });
    expect(await fee(token)).toMatchObject({ status: "paid", paidVia: "offline", note: "Paid by MoMo" });
  });

  it("lets an owner waive a fee, but not a viewer", async () => {
    const r = await act("recordDeal", [deal({ chargeBusiness: "", description: "Viewing trip", value: "1000", send: "" })], { at: "/admin/fees/new", cookie: owner, ip: visitor() });
    const f = await fee(String((r.result?.fees as { url: string }[])[0].url.split("/pay/")[1]));
    const pw = `e2e-${Math.random().toString(36).slice(2)}-password`;
    const viewerEmail = `e2e-fee-viewer-${tag}@example.test`;
    const bcrypt = await import("bcryptjs");
    await db.admin.create({ data: { email: viewerEmail, name: "E2E Fee Viewer", role: "viewer", passwordHash: await bcrypt.hash(pw, 4) } });
    const viewer = (await signIn(viewerEmail, pw, visitor())).cookie;
    await act("updateFee", [f.id, "waive"], { at: "/admin/fees", cookie: viewer, ip: visitor() });
    expect((await db.conciergeFee.findUniqueOrThrow({ where: { id: f.id } })).status).toBe("due");
    await db.admin.delete({ where: { email: viewerEmail } });
    const waived = await act("updateFee", [f.id, "waive", "Goodwill"], { at: "/admin/fees", cookie: owner, ip: visitor() });
    expect(waived.result).toMatchObject({ ok: true });
    expect((await db.conciergeFee.findUniqueOrThrow({ where: { id: f.id } })).status).toBe("waived");
    expect((await page(`/pay/${f.token}`)).html).toContain("Nothing to pay");
  });

  it("lists fees and downloads them as a spreadsheet for owners", async () => {
    const list = await page("/admin/fees", owner);
    expect(list.status).toBe(200);
    expect(list.html).toContain("Driver for a week");
    const res = await fetch(`${BASE}/admin/export/fees`, { headers: { Cookie: owner ?? "" } });
    expect(res.status).toBe(200);
    const csv = await res.text();
    expect(csv).toContain("Fee reference");
    expect(csv).toContain("12-month lease, 2-bed in Osu");
    expect(csv).toContain("3600.00");
  });
});
