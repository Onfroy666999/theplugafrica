// Admin essentials end to end (issue #67): inbox filters and pages, delete, assignment, spreadsheet export,
// My account, and creating a business from the waitlist.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { BASE, act, adminCredentials, db, form, page, signIn, visitor } from "./helpers";

const ip = visitor();
const started = new Date();
let owner: string | null = null;
let editor: string | null = null;
let ownerId = "";
let editorId = "";
const editorPassword = `e2e-${Math.random().toString(36).slice(2)}-password`;

/** Invites and accepts an editor, returning their session cookie. */
async function makeEditor() {
  const inv = await act("inviteMember", [form({ name: "E2E Tools Editor", email: "tools-editor@example.test", role: "editor" }, { human: false })], { cookie: owner, at: "/admin/team", ip });
  const t = String(inv.result?.url).split("/").pop()!;
  const acc = await act("acceptInvite", [t, undefined, form({ name: "E2E Tools Editor", password: editorPassword, confirm: editorPassword }, { human: false })], { at: `/admin/invite/${t}`, ip });
  return acc.cookie;
}

beforeAll(async () => {
  const { email, password } = adminCredentials();
  owner = (await signIn(email, password, ip)).cookie;
  ownerId = (await db.admin.findUniqueOrThrow({ where: { email } })).id;
  editor = await makeEditor();
  editorId = (await db.admin.findUniqueOrThrow({ where: { email: "tools-editor@example.test" } })).id;
  // 55 messages so the inbox has two pages; three are "replied"; one is from October.
  await db.contactMessage.createMany({
    data: Array.from({ length: 55 }, (_, i) => ({
      ref: `MSG-E2E${String(i).padStart(2, "0")}-TOOL`, name: `E2E Sender ${i}`, email: `sender${i}@example.test`, topic: "A general question",
      message: i === 7 ? "Needle in a haystack: kente weaving" : "Just a test message.", status: i < 3 ? "replied" : "new",
      createdAt: i === 10 ? new Date("2026-10-15T10:00:00Z") : new Date(Date.now() - i * 60_000),
    })),
  });
  await db.conciergeRequest.create({ data: { ref: "CNC-E2E0-TOOL", name: "E2E Concierge", phone: "0240000000", city: "Accra", category: "special-services", details: "Test", timing: "This week" } });
  await db.waitlistEntry.create({ data: { ref: "BIZ-E2E0-TOOL", businessName: "E2E Waitlist Bakery", category: "entertainment", city: "Kumasi", name: "E2E Owner", phone: "0270000000", email: "bakery@example.test" } });
});

afterAll(async () => {
  await db.contactMessage.deleteMany({ where: { ref: { endsWith: "-TOOL" } } });
  await db.conciergeRequest.deleteMany({ where: { ref: { endsWith: "-TOOL" } } });
  await db.waitlistEntry.deleteMany({ where: { ref: { endsWith: "-TOOL" } } });
  await db.business.deleteMany({ where: { slug: "e2e-waitlist-bakery" } });
  await db.invite.deleteMany({ where: { email: { endsWith: "@example.test" } } });
  await db.admin.deleteMany({ where: { email: { endsWith: "@example.test" } } });
  await db.auditLog.deleteMany({ where: { createdAt: { gte: started } } });
  await db.rateLimit.deleteMany({ where: { key: { startsWith: "login:" } } });
  await db.$disconnect();
});

const refsIn = (html: string) => [...new Set(html.match(/MSG-E2E\d\d-TOOL/g) ?? [])];

describe("inbox filters and pages", () => {
  it("shows 50 per page with a link to older ones", async () => {
    const first = await page("/admin/messages", owner);
    expect(refsIn(first.html).length).toBe(50);
    expect(first.html).toContain("Older");
    const second = await page("/admin/messages?page=2", owner);
    expect(refsIn(second.html).length).toBeGreaterThanOrEqual(5);
    expect(second.html).toContain("Newer");
  });

  it("filters by status, month and search", async () => {
    expect(refsIn((await page("/admin/messages?status=replied", owner)).html).sort()).toEqual(["MSG-E2E00-TOOL", "MSG-E2E01-TOOL", "MSG-E2E02-TOOL"]);
    expect(refsIn((await page("/admin/messages?month=2026-10", owner)).html)).toEqual(["MSG-E2E10-TOOL"]);
    expect(refsIn((await page("/admin/messages?q=kente%20weaving", owner)).html)).toEqual(["MSG-E2E07-TOOL"]);
    expect(refsIn((await page("/admin/messages?q=MSG-E2E42", owner)).html)).toEqual(["MSG-E2E42-TOOL"]);
    expect((await page("/admin/messages?q=zzqxwv", owner)).html).toContain("Nothing matches");
  });
});

describe("delete", () => {
  it("is for owners only, and is logged", async () => {
    const m = await db.contactMessage.findUniqueOrThrow({ where: { ref: "MSG-E2E54-TOOL" } });
    const denied = await act("deleteInboxItem", ["contact", m.id], { cookie: editor, at: "/admin/messages", ip });
    expect(denied.redirect).toBe("/admin?denied=1");
    expect(await db.contactMessage.count({ where: { id: m.id } })).toBe(1);
    const ok = await act("deleteInboxItem", ["contact", m.id], { cookie: owner, at: "/admin/messages", ip });
    expect(ok.result).toEqual({ ok: true });
    expect(await db.contactMessage.count({ where: { id: m.id } })).toBe(0);
    expect(await db.auditLog.count({ where: { action: "inbox.delete", summary: "Deleted message MSG-E2E54-TOOL" } })).toBe(1);
  });
});

describe("concierge assignment", () => {
  it("assigns a request, filters by 'assigned to me', and unassigns", async () => {
    const r = await db.conciergeRequest.findUniqueOrThrow({ where: { ref: "CNC-E2E0-TOOL" } });
    expect((await act("assignConcierge", [r.id, editorId], { cookie: owner, at: "/admin/concierge", ip })).result).toEqual({ ok: true });
    expect((await db.conciergeRequest.findUniqueOrThrow({ where: { id: r.id } })).assignedToId).toBe(editorId);
    expect((await page("/admin/concierge?assigned=me", editor)).html).toContain("CNC-E2E0-TOOL");
    expect((await page("/admin/concierge?assigned=me", owner)).html).not.toContain("CNC-E2E0-TOOL");
    expect((await page("/admin/concierge?assigned=none", owner)).html).not.toContain("CNC-E2E0-TOOL");
    await act("assignConcierge", [r.id, ""], { cookie: editor, at: "/admin/concierge", ip });
    expect((await db.conciergeRequest.findUniqueOrThrow({ where: { id: r.id } })).assignedToId).toBeNull();
    expect((await act("assignConcierge", [r.id, "no-such-admin"], { cookie: owner, at: "/admin/concierge", ip })).result).toMatchObject({ ok: false });
  });
});

describe("spreadsheet export", () => {
  it("gives owners a CSV with the current filters, and refuses editors", async () => {
    const res = await fetch(`${BASE}/admin/export/contact?status=replied`, { headers: { Cookie: owner! } });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    expect(res.headers.get("content-disposition")).toContain("attachment");
    // Reading as text drops the byte-order mark, so check the raw bytes for it (Excel needs it for accents).
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const csv = new TextDecoder().decode(bytes);
    expect(csv.split("\r\n")[0]).toBe("Reference,Date,Status,Topic,Name,Email,Phone,Message,Notes");
    expect(csv.match(/MSG-E2E\d\d-TOOL/g)?.sort()).toEqual(["MSG-E2E00-TOOL", "MSG-E2E01-TOOL", "MSG-E2E02-TOOL"]);
    expect((await fetch(`${BASE}/admin/export/contact`, { headers: { Cookie: editor! } })).status).toBe(403);
    expect((await fetch(`${BASE}/admin/export/nonsense`, { headers: { Cookie: owner! } })).status).toBe(404);
  });
});

describe("waitlist to business", () => {
  it("pre-fills the form and marks the entry Listed once the business exists", async () => {
    const w = await db.waitlistEntry.findUniqueOrThrow({ where: { ref: "BIZ-E2E0-TOOL" } });
    const html = (await page(`/admin/businesses/new?waitlist=${w.id}`, owner)).html;
    expect(html).toContain("Add E2E Waitlist Bakery");
    expect(html).toContain('value="Kumasi"');
    const svc = await db.service.findFirst({ where: { category: "entertainment" }, select: { id: true } });
    const r = await act("saveBusiness", [form({
      name: "E2E Waitlist Bakery", slug: "e2e-waitlist-bakery", category: "entertainment", kind: "Bakery", city: "Kumasi", area: "Adum",
      blurb: "Fresh bread every morning", about: "A small bakery in the heart of Kumasi, open early.", price: "", responds: "", languages: "English",
      phone: "0270000000", whatsapp: "", email: "bakery@example.test", status: "draft", images: "[]", services: JSON.stringify(svc ? [svc.id] : []),
      credentials: "[]", fromWaitlist: w.id,
    }, { human: false })], { cookie: owner, at: "/admin/businesses/new", ip });
    expect(r.result).toMatchObject({ ok: true });
    expect((await db.waitlistEntry.findUniqueOrThrow({ where: { id: w.id } })).status).toBe("onboarded");
  });
});

describe("my account", () => {
  it("changes your name", async () => {
    expect((await act("updateMyName", [form({ name: "E2E Renamed Editor" }, { human: false })], { cookie: editor, at: "/admin/account", ip })).result).toEqual({ ok: true });
    expect((await db.admin.findUniqueOrThrow({ where: { id: editorId } })).name).toBe("E2E Renamed Editor");
  });

  it("changes your password after checking the current one, and signs out your other sessions", async () => {
    const other = (await signIn("tools-editor@example.test", editorPassword, visitor())).cookie;
    expect((await page("/admin", other)).status).toBe(200);
    const wrong = await act("changeMyPassword", [form({ current: "not-my-password", password: "brand-new-password-1", confirm: "brand-new-password-1" }, { human: false })], { cookie: editor, at: "/admin/account", ip });
    expect(wrong.result).toEqual({ ok: false, error: "Your current password isn't right." });
    await new Promise((r) => setTimeout(r, 1500)); // session times are in whole seconds
    const ok = await act("changeMyPassword", [form({ current: editorPassword, password: "brand-new-password-1", confirm: "brand-new-password-1" }, { human: false })], { cookie: editor, at: "/admin/account", ip });
    expect(ok.result).toEqual({ ok: true });
    expect(ok.cookie).not.toBeNull(); // this session gets a fresh cookie and stays signed in
    expect((await page("/admin", ok.cookie)).status).toBe(200);
    expect((await page("/admin", other)).location).toContain("/admin/login");
    expect((await signIn("tools-editor@example.test", "brand-new-password-1", visitor())).cookie).not.toBeNull();
  });

  it("is in everyone's menu", async () => {
    expect((await page("/admin", owner)).html).toContain('href="/admin/account"');
    void ownerId;
  });
});
