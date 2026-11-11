// Admin end to end: sign-in, adding a business, the Verified rule, publishing and deleting, and the activity log.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { act, clearEmails, emails, adminCredentials, db, form, page, signIn, visitor } from "./helpers";

const ip = visitor();
const SLUG = "e2e-admin-bakery";
let cookie: string | null = null;
let id = "";
const started = new Date();

const fields = (over: Record<string, string> = {}) => ({
  name: "E2E Admin Bakery", slug: SLUG, category: "entertainment", kind: "Bakery and café", city: "Accra", area: "Labone",
  blurb: "Fresh bread and pastries every morning", about: "A small bakery and café with seating for twenty people.",
  price: "From GH₵ 20", responds: "Usually replies within a day", languages: "English", phone: "", whatsapp: "", email: "",
  status: "draft", images: "[]", services: "[]",
  credentials: JSON.stringify([{ label: "Business registration", state: "pending" }]),
  ...over,
});

let servicesJson = "[]";

beforeAll(async () => {
  // A category with services needs at least one chosen.
  const svc = await db.service.findFirst({ where: { category: "entertainment" }, select: { id: true } });
  servicesJson = JSON.stringify(svc ? [svc.id] : []);
});

afterAll(async () => {
  await db.business.deleteMany({ where: { slug: SLUG } });
  await db.auditLog.deleteMany({ where: { createdAt: { gte: started } } });
  await db.rateLimit.deleteMany({ where: { key: { startsWith: "login" } } });
  await db.$disconnect();
});

describe("sign-in", () => {
  it("rejects a wrong password without saying which part was wrong", async () => {
    const r = await signIn(adminCredentials().email, "definitely-not-the-password", ip);
    expect(r.result).toMatchObject({ error: "That email and password don't match." });
    expect(r.cookie).toBeNull();
  });

  it("signs the owner in", async () => {
    const r = await signIn(adminCredentials().email, adminCredentials().password, ip);
    expect(r.result).toEqual({ ok: true });
    expect(r.cookie).not.toBeNull();
    cookie = r.cookie;
    expect((await page("/admin", cookie)).status).toBe(200);
  });

  it("blocks sign-in after 5 wrong passwords for the same email and visitor", async () => {
    const other = visitor();
    const email = "nobody@example.test";
    for (let i = 0; i < 5; i++) await signIn(email, "wrong-password", other);
    const r = await signIn(email, "wrong-password", other);
    expect(r.result).toMatchObject({ error: expect.stringContaining("Too many attempts") });
  });

  it("counts attempts sent all at once, so parallel guesses can't get past the limit", async () => {
    const other = visitor();
    const results = await Promise.all(Array.from({ length: 20 }, () => signIn("parallel@example.test", "wrong-password", other)));
    const checked = results.filter((r) => String(r.result?.error).includes("don't match")).length;
    expect(checked).toBeLessThanOrEqual(5);
    expect(results.filter((r) => String(r.result?.error).includes("Too many attempts")).length).toBeGreaterThanOrEqual(15);
  });

  it("limits one account to 20 attempts an hour from anywhere, and tells the team", async () => {
    const bcrypt = await import("bcryptjs");
    const email = `e2e-lockout-${Math.random().toString(36).slice(2, 7)}@example.test`;
    await db.admin.create({ data: { email, name: "E2E Lockout", role: "viewer", passwordHash: await bcrypt.hash("the-right-password-123", 4) } });
    await clearEmails();
    // 20 wrong guesses, each from a different address: the per-visitor limit never trips.
    for (let i = 0; i < 20; i++) await signIn(email, "wrong-password", `203.0.113.${i + 1}`);
    const blocked = await signIn(email, "the-right-password-123", "203.0.113.200");
    expect(blocked.result).toMatchObject({ error: expect.stringContaining("Too many attempts") });
    const list = await emails((l) => l.some((e) => e.subject.startsWith("Admin sign-in paused")));
    expect(list.find((e) => e.subject.startsWith("Admin sign-in paused"))?.text).toContain(email);
    await db.admin.delete({ where: { email } });
    await db.rateLimit.deleteMany({ where: { key: { contains: email } } });
  });

  it("still lets the right password in after a few wrong ones", async () => {
    const { email, password } = adminCredentials();
    const other = visitor();
    for (let i = 0; i < 3; i++) await signIn(email, "wrong-password", other);
    const r = await signIn(email, password, other);
    expect(r.result).toMatchObject({ ok: true });
  });
});

describe("renamed businesses (issue #94)", () => {
  it("redirects the old web address to the new one", async () => {
    const b = await db.business.findFirstOrThrow({ where: { status: "verified" }, orderBy: { slug: "desc" }, include: { credentials: true, services: { select: { id: true } } } });
    const renamed = `${b.slug}-renamed-e2e`;
    const fields = {
      id: b.id, name: b.name, slug: renamed, category: b.category, kind: b.kind, city: b.city, area: b.area, blurb: b.blurb, about: b.about,
      price: b.price, responds: b.responds, languages: b.languages, phone: b.phone ?? "", whatsapp: b.whatsapp ?? "", email: b.email ?? "", status: b.status,
      images: b.images, credentials: JSON.stringify(b.credentials.map((c) => ({ label: c.label, state: c.state }))), services: JSON.stringify(b.services.map((s) => s.id)),
    };
    const r = await act("saveBusiness", [form(fields, { human: false })], { cookie, at: `/admin/businesses/${b.id}`, ip });
    expect(r.result).toMatchObject({ ok: true });
    const old = await page(`/listing/${b.slug}`);
    expect(old.status).toBe(308);
    expect(old.location).toContain(`/listing/${renamed}`);
    // Back to the original address: the alias for it is removed, so the page itself loads.
    await act("saveBusiness", [form({ ...fields, slug: b.slug }, { human: false })], { cookie, at: `/admin/businesses/${b.id}`, ip });
    expect((await page(`/listing/${b.slug}`)).status).toBe(200);
    expect((await page(`/listing/${renamed}`)).status).toBe(308);
    await db.slugAlias.deleteMany({ where: { businessId: b.id } });
  });

  it("sends an inbox page past the end to the last page", async () => {
    const r = await page("/admin/messages?page=999", cookie);
    expect([200, 307]).toContain(r.status);
    if (r.status === 307) expect(r.location).toMatch(/\/admin\/messages(\?page=\d+)?$/);
  });
});

describe("adding a business", () => {
  it("creates a draft that isn't on the site yet", async () => {
    const r = await act("saveBusiness", [form(fields({ services: servicesJson }), { human: false })], { cookie, at: "/admin/businesses/new", ip });
    expect(r.result).toMatchObject({ ok: true });
    id = String(r.result?.id);
    expect(await db.business.findUnique({ where: { id } })).toMatchObject({ slug: SLUG, status: "draft" });
    expect((await page(`/listing/${SLUG}`)).status).toBe(404);
  });

  it("explains a missing field", async () => {
    const r = await act("saveBusiness", [form(fields({ name: "", services: servicesJson }), { human: false })], { cookie, at: "/admin/businesses/new", ip });
    expect(r.result).toMatchObject({ ok: false, field: "name", error: "Add the business name" });
  });

  it("won't mark it Verified while a credential is unchecked", async () => {
    const quick = await act("setBusinessStatus", [id, "verified"], { cookie, ip });
    expect(quick.result).toEqual({ ok: false, error: "Check every credential before marking Verified." });
    const full = await act("saveBusiness", [form(fields({ id, status: "verified", services: servicesJson }), { human: false })], { cookie, ip });
    expect(full.result).toMatchObject({ ok: false, field: "status" });
    expect((await db.business.findUnique({ where: { id } }))?.status).toBe("draft");
  });

  it("publishes once every credential is checked", async () => {
    const r = await act("saveBusiness", [form(fields({ id, status: "verified", services: servicesJson, credentials: JSON.stringify([{ label: "Business registration", state: "verified" }]) }), { human: false })], { cookie, ip });
    expect(r.result).toMatchObject({ ok: true });
    expect((await page(`/listing/${SLUG}`)).html).toContain("E2E Admin Bakery");
  });

  it("logs who did what, including which fields changed", async () => {
    const log = await db.auditLog.findMany({ where: { targetId: id }, orderBy: { createdAt: "asc" }, select: { summary: true } });
    expect(log.map((l) => l.summary)).toEqual(["Added E2E Admin Bakery (Draft)", "Edited E2E Admin Bakery: status (Draft → Verified), credentials"]);
  });

  it("lets the owner delete it", async () => {
    const r = await act("deleteBusiness", [id], { cookie, ip });
    expect(r.redirect).toBe("/admin/businesses");
    expect(await db.business.count({ where: { id } })).toBe(0);
    expect((await page(`/listing/${SLUG}`)).status).toBe(404);
  });
});
