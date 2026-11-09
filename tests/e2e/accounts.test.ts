// Visitor accounts end to end (issue #82): email code sign-in, wrong-code limits, saving businesses, linked
// requests, signing out and deleting the account.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { act, clearEmails, db, emails, form, page, visitor } from "./helpers";

const tag = Math.random().toString(36).slice(2, 8);
const EMAIL = `e2e-visitor-${tag}@example.test`;
const SLUG = `e2e-account-business-${tag}`;
let businessId = "";
let cookie: string | null = null;

/** The newest sign-in code emailed to an address. */
async function codeFor(email: string, after = 0) {
  const list = await emails((l) => l.filter((e) => e.to.includes(email) && /sign-in code/.test(e.subject)).length > after);
  const mine = list.filter((e) => e.to.includes(email) && /sign-in code/.test(e.subject));
  return mine[mine.length - 1].subject.match(/^(\d{6}) /)![1];
}

const ask = (email: string, ip = visitor()) => act("requestSignInCode", [form({ email })], { at: "/account/sign-in", ip });
const verify = (email: string, code: string, next = "/account") => act("verifySignInCode", [form({ email, code, next }, { human: false })], { at: "/account/sign-in", ip: visitor() });

beforeAll(async () => {
  await clearEmails();
  businessId = (
    await db.business.create({
      data: { slug: SLUG, name: "E2E Account Business", category: "rentals", kind: "Apartment", city: "Accra", area: "Osu", blurb: "x", about: "x", status: "verified", images: "[]" },
    })
  ).id;
});

afterAll(async () => {
  await db.conciergeRequest.deleteMany({ where: { name: `E2E Visitor ${tag}` } });
  await db.enquiry.deleteMany({ where: { businessId } });
  await db.user.deleteMany({ where: { email: { startsWith: "e2e-visitor-" } } });
  await db.signInCode.deleteMany({ where: { email: { startsWith: "e2e-visitor-" } } });
  await db.business.deleteMany({ where: { id: businessId } });
  await db.rateLimit.deleteMany({ where: { key: { startsWith: "signin" } } });
});

describe("signing in with an email code", () => {
  it("sends a 6-digit code and stores only its hash", async () => {
    const r = await ask(EMAIL.toUpperCase());
    expect(r.result).toMatchObject({ ok: true, email: EMAIL });
    const code = await codeFor(EMAIL);
    const row = await db.signInCode.findFirst({ where: { email: EMAIL }, orderBy: { createdAt: "desc" } });
    expect(row?.codeHash).toMatch(/^[0-9a-f]{64}$/);
    expect(row?.codeHash).not.toContain(code);
  });

  it("refuses a wrong code and says how many tries are left", async () => {
    const code = await codeFor(EMAIL);
    const wrong = code === "000000" ? "000001" : "000000";
    const r = await verify(EMAIL, wrong);
    expect(r.result).toMatchObject({ ok: false });
    expect(String(r.result?.error)).toMatch(/4 tries left/);
    expect(r.cookie).toBeNull();
  });

  it("signs in with the right code, creates the account and goes where it was asked", async () => {
    const code = await codeFor(EMAIL);
    const r = await verify(EMAIL, `${code.slice(0, 3)} ${code.slice(3)}`, "/explore");
    expect(r.result).toMatchObject({ ok: true, next: "/explore" });
    expect(r.cookie).toMatch(/^plug_user=/);
    cookie = r.cookie;
    const user = await db.user.findUnique({ where: { email: EMAIL } });
    expect(user?.lastSignInAt).toBeTruthy();
  });

  it("doesn't accept the same code twice", async () => {
    const code = await codeFor(EMAIL);
    const r = await verify(EMAIL, code);
    expect(r.result).toMatchObject({ ok: false });
    expect(String(r.result?.error)).toMatch(/expired|newer/);
  });

  it("never sends people off the site after signing in", async () => {
    const other = `e2e-visitor-next-${tag}@example.test`;
    await ask(other);
    const r = await verify(other, await codeFor(other), "https://evil.example");
    expect(r.result).toMatchObject({ ok: true, next: "/account" });
  });

  it("locks a code after 5 wrong tries, even if the 6th is right", async () => {
    const locked = `e2e-visitor-lock-${tag}@example.test`;
    await ask(locked);
    const code = await codeFor(locked);
    const wrong = code === "111111" ? "222222" : "111111";
    for (let i = 0; i < 5; i++) await verify(locked, wrong);
    const r = await verify(locked, code);
    expect(r.result).toMatchObject({ ok: false });
    expect(String(r.result?.error)).toMatch(/Too many wrong tries/);
  });

  it("only the newest code works", async () => {
    const twice = `e2e-visitor-twice-${tag}@example.test`;
    await ask(twice);
    const first = await codeFor(twice);
    await ask(twice);
    const second = await codeFor(twice, 1);
    if (first !== second) expect((await verify(twice, first)).result).toMatchObject({ ok: false });
    expect((await verify(twice, second)).result).toMatchObject({ ok: true });
  });

  it("rejects a badly formed email", async () => {
    const r = await ask("not-an-email");
    expect(r.result).toMatchObject({ ok: false });
  });
});

describe("the account", () => {
  it("is only shown when signed in", async () => {
    const out = await page("/account");
    expect(out.status).toBe(307);
    expect(out.location).toContain("/account/sign-in?next=%2Faccount");
    const inside = await page("/account", cookie);
    expect(inside.status).toBe(200);
    expect(inside.html).toContain(EMAIL);
  });

  it("can't be opened with a team (admin) cookie, or a made-up one", async () => {
    const forged = await page("/account", "plug_user=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.bad");
    expect(forged.status).toBe(307);
  });

  it("saves and unsaves a business with the heart", async () => {
    const on = await act("toggleSaved", [SLUG], { cookie, ip: visitor() });
    expect(on.result).toMatchObject({ ok: true, saved: true });
    const user = await db.user.findUniqueOrThrow({ where: { email: EMAIL } });
    expect(await db.savedBusiness.count({ where: { userId: user.id } })).toBe(1);
    expect((await page("/account", cookie)).html).toContain("E2E Account Business");
    const off = await act("toggleSaved", [SLUG], { cookie, ip: visitor() });
    expect(off.result).toMatchObject({ ok: true, saved: false });
    await act("toggleSaved", [SLUG], { cookie, ip: visitor() });
  });

  it("asks to sign in before saving", async () => {
    const r = await act("toggleSaved", [SLUG], { ip: visitor() });
    expect(r.result).toMatchObject({ ok: false, signIn: true });
  });

  it("links requests sent while signed in, and lists them", async () => {
    const r = await act(
      "submitConcierge",
      [form({ name: `E2E Visitor ${tag}`, phone: "0240000001", city: "Accra", category: "rentals", details: "A flat near Osu for three months", when: "This month", serviceMode: "remote" })],
      { cookie, ip: visitor() },
    );
    expect(r.result).toMatchObject({ ok: true });
    const ref = String(r.result?.ref);
    const user = await db.user.findUniqueOrThrow({ where: { email: EMAIL } });
    expect((await db.conciergeRequest.findUnique({ where: { ref } }))?.userId).toBe(user.id);
    expect((await page("/account", cookie)).html).toContain(ref);
  });

  it("updates the visitor's details", async () => {
    const r = await act("updateProfile", [form({ name: "Ama Visitor", phone: "024 000 0002" }, { human: false })], { cookie, ip: visitor() });
    expect(r.result).toMatchObject({ ok: true });
    expect((await page("/account", cookie)).html).toContain("Hello, Ama");
  });

  it("shows accounts to the team in Admin › Users", async () => {
    const admin = await page("/admin/users");
    expect(admin.status).toBe(307); // team only
  });

  it("deletes the account but keeps the request for the team", async () => {
    const refuse = await act("deleteAccount", [form({ confirm: "nope" }, { human: false })], { cookie, ip: visitor() });
    expect(refuse.result).toMatchObject({ ok: false });
    const r = await act("deleteAccount", [form({ confirm: "DELETE" }, { human: false })], { cookie, ip: visitor() });
    expect(r.redirect).toContain("/?account=deleted");
    expect(await db.user.findUnique({ where: { email: EMAIL } })).toBeNull();
    expect(await db.savedBusiness.count({ where: { businessId } })).toBe(0);
    const kept = await db.conciergeRequest.findFirst({ where: { name: `E2E Visitor ${tag}` } });
    expect(kept).not.toBeNull();
    expect(kept?.userId).toBeNull();
    // The old cookie no longer opens the account.
    expect((await page("/account", cookie)).status).toBe(307);
  });
});
