// Emergency numbers end to end (issue #11): only verified numbers are public, national numbers show in every city,
// and roles apply. Uses made-up numbers marked "E2E"; real numbers come from the team's verification.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { act, adminCredentials, db, form, page, signIn, visitor } from "./helpers";

const ip = visitor();
const started = new Date();
let owner: string | null = null;
let viewer: string | null = null;

const entry = (over: Record<string, string> = {}) =>
  form({ city: "Accra", service: "hospital", name: "E2E Ridge Test Hospital", phone: "+233 30 000 0001", verified: "false", ...over }, { human: false });

beforeAll(async () => {
  const { email, password } = adminCredentials();
  owner = (await signIn(email, password, ip)).cookie;
  const pw = `e2e-${Math.random().toString(36).slice(2)}-password`;
  const inv = await act("inviteMember", [form({ name: "E2E Emergency Viewer", email: "emergency-viewer@example.test", role: "viewer" }, { human: false })], { cookie: owner, at: "/admin/team", ip });
  const t = String(inv.result?.url).split("/").pop()!;
  viewer = (await act("acceptInvite", [t, undefined, form({ name: "E2E Emergency Viewer", password: pw, confirm: pw }, { human: false })], { at: `/admin/invite/${t}`, ip })).cookie;
});

afterAll(async () => {
  await db.emergencyContact.deleteMany({ where: { name: { startsWith: "E2E" } } });
  await db.invite.deleteMany({ where: { email: { endsWith: "@example.test" } } });
  await db.admin.deleteMany({ where: { email: { endsWith: "@example.test" } } });
  await db.auditLog.deleteMany({ where: { createdAt: { gte: started } } });
  await db.rateLimit.deleteMany({ where: { key: { startsWith: "login" } } });
  await db.$disconnect();
});

describe("emergency numbers", () => {
  let id = "";

  it("keeps an unverified number off the public page", async () => {
    const r = await act("saveEmergency", [entry()], { cookie: owner, at: "/admin/emergency", ip });
    expect(r.result).toMatchObject({ ok: true });
    id = String(r.result?.id);
    expect((await page("/emergency")).html).not.toContain("E2E Ridge Test Hospital");
    expect((await page("/admin/emergency", owner)).html).toContain("Not verified");
  });

  it("refuses 'verified' without a source", async () => {
    const r = await act("saveEmergency", [entry({ id, verified: "true" })], { cookie: owner, at: "/admin/emergency", ip });
    expect(r.result).toMatchObject({ ok: false, field: "source" });
  });

  it("shows a verified number with its source and date", async () => {
    const r = await act("saveEmergency", [entry({ id, verified: "true", source: "E2E called on 8 Nov", sourceUrl: "https://example.com/e2e" })], { cookie: owner, at: "/admin/emergency", ip });
    expect(r.result).toMatchObject({ ok: true });
    const html = (await page("/emergency")).html;
    expect(html).toContain("E2E Ridge Test Hospital");
    expect(html).toContain('href="tel:+233300000001"');
    expect(html).toContain("E2E called on 8 Nov");
  });

  it("resets the verified date when the number changes", async () => {
    const before = (await db.emergencyContact.findUniqueOrThrow({ where: { id } })).verifiedAt!;
    await db.emergencyContact.update({ where: { id }, data: { verifiedAt: new Date("2026-01-01T00:00:00Z") } });
    await act("saveEmergency", [entry({ id, verified: "true", source: "E2E called on 8 Nov", notes: "24 hours" })], { cookie: owner, at: "/admin/emergency", ip });
    expect((await db.emergencyContact.findUniqueOrThrow({ where: { id } })).verifiedAt).toEqual(new Date("2026-01-01T00:00:00Z"));
    await act("saveEmergency", [entry({ id, verified: "true", source: "E2E called on 8 Nov", phone: "+233 30 000 0002" })], { cookie: owner, at: "/admin/emergency", ip });
    expect((await db.emergencyContact.findUniqueOrThrow({ where: { id } })).verifiedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it("shows a nationwide number in the page data for every city", async () => {
    const r = await act("saveEmergency", [entry({ city: "", service: "police", name: "E2E National Police Line", phone: "999", verified: "true", source: "E2E official site" })], { cookie: owner, at: "/admin/emergency", ip });
    expect(r.result).toMatchObject({ ok: true });
    expect((await page("/emergency")).html).toContain("E2E National Police Line");
  });

  it("lets a viewer look but not change anything", async () => {
    expect((await page("/admin/emergency", viewer)).status).toBe(200);
    const r = await act("saveEmergency", [entry({ name: "E2E Viewer Attempt" })], { cookie: viewer, at: "/admin/emergency", ip });
    expect(r.redirect).toBe("/admin?denied=1");
    expect(await db.emergencyContact.count({ where: { name: "E2E Viewer Attempt" } })).toBe(0);
  });

  it("lets the owner delete a number, and logs it", async () => {
    expect((await act("deleteEmergency", [id], { cookie: owner, at: "/admin/emergency", ip })).result).toEqual({ ok: true });
    expect((await page("/emergency")).html).not.toContain("E2E Ridge Test Hospital");
    expect(await db.auditLog.count({ where: { action: "emergency.delete", createdAt: { gte: started } } })).toBe(1);
  });
});
