// Error alerts end to end (issue #8): a server error emails the team once, then is throttled.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { act, adminCredentials, clearEmails, db, emails, signIn, visitor } from "./helpers";

const ip = visitor();
const started = new Date();
let owner: string | null = null;
let messageId = "";

beforeAll(async () => {
  await clearEmails();
  await db.rateLimit.deleteMany({ where: { key: { startsWith: "alert:" } } });
  const { email, password } = adminCredentials();
  owner = (await signIn(email, password, ip)).cookie;
  messageId = (await db.contactMessage.create({ data: { ref: "MSG-E2EA-LERT", name: "E2E Alert", email: "alert@example.test", topic: "A general question", message: "Used to trigger an error." } })).id;
});

afterAll(async () => {
  await db.contactMessage.deleteMany({ where: { ref: "MSG-E2EA-LERT" } });
  await db.rateLimit.deleteMany({ where: { OR: [{ key: { startsWith: "alert:" } }, { key: { startsWith: "login:" } }] } });
  await db.auditLog.deleteMany({ where: { createdAt: { gte: started } } });
  await db.$disconnect();
});

const alerts = (list: { subject: string }[]) => list.filter((m) => m.subject.startsWith("Site error"));

describe("error alerts", () => {
  it("emails the team when the server hits an error, without visitors' details", async () => {
    // Notes sent as a number (only a hand-crafted request can do this) make the action throw: a real server error.
    // (An invalid status no longer does: since the debug session, issue #94, it's refused with a message.)
    const r = await act("updateInbox", ["contact", messageId, { notes: 12345 }], { cookie: owner, at: "/admin/messages?q=0240000000", ip });
    expect(r.status).toBe(500);
    const sent = alerts(await emails((e) => alerts(e).length >= 1));
    expect(sent).toHaveLength(1);
    const m = sent[0] as { subject: string; to: string[]; text: string };
    expect(m.to).toEqual(["team@example.test"]);
    expect(m.subject).toMatch(/^Site error \((local|staging|live site)\): /);
    expect(m.text).toContain("Error ID");
    expect(m.text).not.toContain("0240000000"); // the query string is left out
  });

  it("doesn't email the same error again within the hour", async () => {
    await act("updateInbox", ["contact", messageId, { notes: 12345 }], { cookie: owner, at: "/admin/messages", ip });
    await new Promise((r) => setTimeout(r, 2500));
    expect(alerts(await emails())).toHaveLength(1);
  });
});
