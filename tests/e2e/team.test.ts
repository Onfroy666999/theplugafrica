// Team accounts end to end (issue #18): invitations, roles, password links, removal and the activity log.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { act, adminCredentials, clearEmails, db, emails, form, page, signIn, visitor } from "./helpers";

const ip = visitor();
const started = new Date();
const pw = () => `e2e-${Math.random().toString(36).slice(2)}-password`;
let owner: string | null = null;
let editor: string | null = null;
let viewer: string | null = null;
let ownerId = "";
let bizId = "";
let bizStatus = "";

const token = (url: unknown) => String(url).split("/").pop()!;
/** Invites someone as the owner and accepts the link. Returns their session cookie. */
async function join(name: string, email: string, role: string, password = pw()) {
  const inv = await act("inviteMember", [form({ name, email, role }, { human: false })], { cookie: owner, at: "/admin/team", ip });
  expect(inv.result).toMatchObject({ ok: true, emailed: true });
  const t = token(inv.result?.url);
  const acc = await act("acceptInvite", [t, undefined, form({ name, password, confirm: password }, { human: false })], { at: `/admin/invite/${t}`, ip });
  expect(acc.redirect).toBe("/admin");
  return { cookie: acc.cookie, token: t, password };
}

beforeAll(async () => {
  await clearEmails();
  const { email, password } = adminCredentials();
  owner = (await signIn(email, password, ip)).cookie;
  ownerId = (await db.admin.findUniqueOrThrow({ where: { email } })).id;
  // A Verified business, picked in a fixed order: moving it to In review is always allowed (Verified needs checked credentials).
  const b = await db.business.findFirstOrThrow({ where: { status: "verified" }, orderBy: { slug: "asc" }, select: { id: true, status: true } });
  bizId = b.id;
  bizStatus = b.status;
});

afterAll(async () => {
  await db.business.update({ where: { id: bizId }, data: { status: bizStatus } });
  await db.invite.deleteMany({ where: { email: { endsWith: "@example.test" } } });
  await db.admin.deleteMany({ where: { email: { endsWith: "@example.test" } } });
  await db.auditLog.deleteMany({ where: { createdAt: { gte: started } } });
  await db.rateLimit.deleteMany({ where: { key: { startsWith: "login:" } } });
  await db.$disconnect();
});

describe("invitations", () => {
  it("emails a single-use link that works without signing in", async () => {
    const e = await join("E2E Editor", "Editor@Example.test", "editor");
    editor = e.cookie;
    expect(editor).not.toBeNull();
    const sent = await emails((list) => list.some((m) => m.to.includes("editor@example.test")));
    expect(sent.find((m) => m.to.includes("editor@example.test"))?.text).toContain(`/admin/invite/${e.token}`);
    expect(await db.admin.findUnique({ where: { email: "editor@example.test" }, select: { role: true } })).toEqual({ role: "editor" });
    const again = await act("acceptInvite", [e.token, undefined, form({ password: e.password, confirm: e.password }, { human: false })], { at: `/admin/invite/${e.token}`, ip });
    expect(again.result).toMatchObject({ error: expect.stringContaining("expired or was already used") });
  });

  it("refuses short or mismatched passwords and existing members", async () => {
    const inv = await act("inviteMember", [form({ name: "E2E Short", email: "short@example.test", role: "viewer" }, { human: false })], { cookie: owner, at: "/admin/team", ip });
    const t = token(inv.result?.url);
    const short = await act("acceptInvite", [t, undefined, form({ name: "E2E Short", password: "short", confirm: "short" }, { human: false })], { at: `/admin/invite/${t}`, ip });
    expect(short.result).toMatchObject({ error: expect.stringContaining("at least 12") });
    const mismatch = await act("acceptInvite", [t, undefined, form({ name: "E2E Short", password: "long-enough-one", confirm: "long-enough-two" }, { human: false })], { at: `/admin/invite/${t}`, ip });
    expect(mismatch.result).toMatchObject({ error: "The two passwords don't match." });
    const dup = await act("inviteMember", [form({ name: "Again", email: adminCredentials().email, role: "viewer" }, { human: false })], { cookie: owner, at: "/admin/team", ip });
    expect(dup.result).toMatchObject({ ok: false, error: expect.stringContaining("already has an account") });
  });
});

describe("roles", () => {
  it("lets an editor edit but not delete or manage the team", async () => {
    expect((await act("setBusinessStatus", [bizId, "in_review"], { cookie: editor, ip })).result).toMatchObject({ ok: true });
    await act("setBusinessStatus", [bizId, bizStatus], { cookie: editor, ip });
    const del = await act("deleteBusiness", [bizId], { cookie: editor, ip });
    expect(del.redirect).toBe("/admin?denied=1");
    expect(await db.business.count({ where: { id: bizId } })).toBe(1);
    expect((await page("/admin/team", editor)).location).toContain("/admin?denied=1");
    expect((await page(`/admin/businesses/${bizId}`, editor)).html).not.toContain("Delete business");
  });

  it("lets a viewer look but not change anything", async () => {
    viewer = (await join("E2E Viewer", "viewer@example.test", "viewer")).cookie;
    const r = await act("setBusinessStatus", [bizId, "hidden"], { cookie: viewer, ip });
    expect(r.redirect).toBe("/admin?denied=1");
    expect((await db.business.findUnique({ where: { id: bizId } }))?.status).toBe(bizStatus);
    const html = (await page(`/admin/businesses/${bizId}`, viewer)).html;
    expect(html).toContain("view-only access");
    expect(html).not.toContain("Save changes");
  });

  it("applies role changes straight away, and protects the owner's own account", async () => {
    const ed = await db.admin.findUniqueOrThrow({ where: { email: "editor@example.test" } });
    expect((await act("changeRole", [ed.id, "owner"], { cookie: owner, ip })).result).toEqual({ ok: true });
    expect((await page("/admin/team", editor)).status).toBe(200);
    await act("changeRole", [ed.id, "editor"], { cookie: owner, ip });
    expect((await page("/admin/team", editor)).location).toContain("denied");
    expect((await act("changeRole", [ownerId, "viewer"], { cookie: owner, ip })).result).toMatchObject({ ok: false });
    expect((await act("removeMember", [ownerId], { cookie: owner, ip })).result).toMatchObject({ ok: false });
  });
});

describe("password links and removal", () => {
  it("signs out old sessions when a new password is set", async () => {
    const v = await db.admin.findUniqueOrThrow({ where: { email: "viewer@example.test" } });
    const link = await act("passwordLink", [v.id], { cookie: owner, at: "/admin/team", ip });
    const t = token(link.result?.url);
    await new Promise((r) => setTimeout(r, 1500)); // session times are in whole seconds
    const password = pw();
    const reset = await act("acceptInvite", [t, undefined, form({ password, confirm: password }, { human: false })], { at: `/admin/invite/${t}`, ip });
    expect(reset.cookie).not.toBeNull();
    expect((await page("/admin", viewer)).location).toContain("/admin/login");
    expect((await page("/admin", reset.cookie)).status).toBe(200);
    expect((await signIn("viewer@example.test", password, ip)).cookie).not.toBeNull();
  });

  it("signs a removed member out at once", async () => {
    const ed = await db.admin.findUniqueOrThrow({ where: { email: "editor@example.test" } });
    expect((await act("removeMember", [ed.id], { cookie: owner, ip })).result).toEqual({ ok: true });
    expect((await page("/admin", editor)).location).toContain("/admin/login");
  });

  it("cancels an open link", async () => {
    const inv = await act("inviteMember", [form({ name: "E2E Never", email: "never@example.test", role: "viewer" }, { human: false })], { cookie: owner, at: "/admin/team", ip });
    const open = await db.invite.findFirstOrThrow({ where: { email: "never@example.test", usedAt: null } });
    await act("cancelInvite", [open.id], { cookie: owner, at: "/admin/team", ip });
    expect((await page(`/admin/invite/${token(inv.result?.url)}`)).html).toContain("doesn&#x27;t work any more");
  });
});

describe("activity log", () => {
  it("is for owners and lists team changes", async () => {
    const html = (await page("/admin/activity", owner)).html;
    expect(html).toContain("Joined the team as an editor");
    expect(html).toContain("Removed E2E Editor");
  });
});
