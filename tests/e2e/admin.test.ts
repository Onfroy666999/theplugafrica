// Admin end to end: sign-in, adding a business, the Verified rule, publishing and deleting, and the activity log.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { act, adminCredentials, db, form, page, signIn, visitor } from "./helpers";

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
  await db.rateLimit.deleteMany({ where: { key: { startsWith: "login:" } } });
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
