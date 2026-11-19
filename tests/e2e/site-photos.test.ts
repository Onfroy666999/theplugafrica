// Admin › Site photos end to end (issue #112): change the home hero, a category header and a page header, then reset.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { act, adminCredentials, db, form, page, signIn, visitor } from "./helpers";

const ip = visitor();
const started = new Date();
let owner: string | null = null;

beforeAll(async () => {
  const { email, password } = adminCredentials();
  owner = (await signIn(email, password, ip)).cookie;
  await db.siteImage.deleteMany();
});

afterAll(async () => {
  await db.siteImage.deleteMany();
  await db.auditLog.deleteMany({ where: { createdAt: { gte: started }, action: { startsWith: "site_photo" } } });
  await db.rateLimit.deleteMany({ where: { key: { startsWith: "login" } } });
  await db.$disconnect();
});

const save = (fields: Record<string, string>, cookie = owner) => act("saveSiteImage", [form(fields, { human: false })], { cookie, at: "/admin/photos", ip });

describe("site photos", () => {
  it("lists every changeable photo for the admin", async () => {
    const r = await page("/admin/photos", owner);
    expect(r.status).toBe(200);
    expect(r.html).toContain("Home: hero slideshow");
    expect(r.html).toContain("Category headers");
    expect(r.html).toContain("Page headers");
  });

  it("changes a hero slide, with its caption, on the home page", async () => {
    const r = await save({ key: "hero.1", url: "/images/family.jpg", alt: "A family at home", caption: "E2E caption, Accra" });
    expect(r.result).toEqual({ ok: true });
    const home = (await page("/")).html;
    expect(home).toContain("family.jpg");
    expect(home).toContain("E2E caption, Accra");
  });

  it("changes a category header and a page header", async () => {
    expect((await save({ key: "category.education", url: "/images/market.jpg", alt: "E2E education header" })).result).toEqual({ ok: true });
    expect((await save({ key: "page.emergency", url: "/images/invest-2.jpg", alt: "E2E emergency header" })).result).toEqual({ ok: true });
    expect((await page("/explore/education")).html).toContain("E2E education header");
    expect((await page("/emergency")).html).toContain("E2E emergency header");
    expect(await db.auditLog.count({ where: { action: "site_photo.update", createdAt: { gte: started } } })).toBeGreaterThanOrEqual(3);
  });

  it("refuses photos from other websites and unknown slots", async () => {
    expect((await save({ key: "hero.2", url: "https://example.com/x.jpg" })).result).toMatchObject({ ok: false });
    expect((await save({ key: "nope.1", url: "/images/family.jpg" })).result).toMatchObject({ ok: false });
    expect(await db.siteImage.count({ where: { key: { in: ["hero.2", "nope.1"] } } })).toBe(0);
  });

  it("needs an admin who can edit", async () => {
    const r = await save({ key: "hero.3", url: "/images/family.jpg" }, null);
    expect(r.result?.ok).not.toBe(true);
    expect(await db.siteImage.count({ where: { key: "hero.3" } })).toBe(0);
  });

  it("puts the original back", async () => {
    const r = await act("resetSiteImage", ["category.education"], { cookie: owner, at: "/admin/photos", ip });
    expect(r.result).toEqual({ ok: true });
    const html = (await page("/explore/education")).html;
    expect(html).not.toContain("E2E education header");
    expect(html).toContain("A pupil reading to her classmates");
  });
});
