// The public site end to end: pages, search, the contact sheet's reference code, every form, the emails they
// send, and spam protection.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { REF, act, clearEmails, db, emails, form, page, visitor } from "./helpers";

const SLUG = "e2e-harbour-tutors";
const NAME = "E2E Harbour Tutors";
const who = { name: "E2E Visitor", phone: "0240000000", email: "visitor@example.test" };
let businessId = "";

beforeAll(async () => {
  await clearEmails();
  const b = await db.business.create({
    data: {
      slug: SLUG, name: NAME, category: "education", kind: "Maths tutoring", city: "Accra", area: "Osu",
      blurb: "One-to-one harbourside maths tutoring", about: "Tutoring for secondary school students, at home or online.",
      status: "verified", email: "business@example.test", phone: "+233 24 000 0000", images: "[]",
    },
  });
  businessId = b.id;
});

afterAll(async () => {
  await db.enquiry.deleteMany({ where: { businessId } });
  await db.conciergeRequest.deleteMany({ where: { name: { startsWith: "E2E" } } });
  await db.waitlistEntry.deleteMany({ where: { name: { startsWith: "E2E" } } });
  await db.contactMessage.deleteMany({ where: { name: { startsWith: "E2E" } } });
  await db.business.deleteMany({ where: { slug: SLUG } });
  await db.$disconnect();
});

describe("pages", () => {
  it.each(["/", "/explore", "/explore/education", "/concierge", "/contact", "/businesses", "/emergency", "/about", "/sitemap.xml", "/robots.txt"])("%s loads", async (path) => {
    expect((await page(path)).status).toBe(200);
  });

  it("shows a public business, and 404s for an unknown one", async () => {
    expect((await page(`/listing/${SLUG}`)).html).toContain(NAME);
    expect((await page("/listing/e2e-no-such-business")).status).toBe(404);
  });

  it("keeps the admin behind sign-in", async () => {
    const r = await page("/admin/businesses");
    expect(r.status).toBeGreaterThanOrEqual(300);
    expect(r.location).toContain("/admin/login");
  });
});

describe("search", () => {
  // The count is rendered on the server, so it shows what the search matched ("1 result", not "N results").
  const count = (html: string) => Number(html.match(/>(\d+)(?:<!-- -->)? (?:<!-- -->)?results?</)?.[1]);

  it("finds a business by a word from its description and leaves out the rest", async () => {
    const all = count((await page("/explore")).html);
    const { html } = await page("/explore?q=harbourside");
    expect(html).toContain(NAME);
    expect(count(html)).toBe(1);
    expect(all).toBeGreaterThan(1);
  });

  it("shows no results for a word nothing matches", async () => {
    expect(count((await page("/explore?q=zzqxwv")).html)).toBe(0);
  });
});

describe("contact sheet", () => {
  it("records an introduction with a reference code and reveals the contact details", async () => {
    const r = await act("createEnquiry", [SLUG], { ip: visitor() });
    expect(r.result).toMatchObject({ ok: true, ref: expect.stringMatching(REF("PLG")), contact: { email: "business@example.test" } });
    const saved = await db.enquiry.findUnique({ where: { ref: String(r.result?.ref) } });
    expect(saved?.businessId).toBe(businessId);
  });

  it("refuses a business that isn't public", async () => {
    const r = await act("createEnquiry", ["e2e-no-such-business"], { ip: visitor() });
    expect(r.result).toEqual({ ok: false, error: "This business is no longer listed." });
  });
});

describe("concierge form", () => {
  it("saves the request with where and when, and emails the team and the visitor", async () => {
    const ip = visitor();
    const r = await act("submitConcierge", [form({ ...who, city: "Accra", category: "special-services", details: "A driver for the week", when: "This week", serviceMode: "elsewhere", meetingPlace: "Kotoka Airport", area: "Airport Residential", timeOfDay: "Morning" })], { ip });
    expect(r.result).toMatchObject({ ok: true, ref: expect.stringMatching(REF("CNC")) });
    const ref = String(r.result?.ref);
    const saved = await db.conciergeRequest.findUnique({ where: { ref } });
    expect(saved).toMatchObject({ serviceMode: "elsewhere", meetingPlace: "Kotoka Airport", area: "Airport Residential", timeOfDay: "Morning", status: "new" });

    const sent = await emails((e) => e.filter((m) => m.subject.includes(ref)).length >= 2);
    const mine = sent.filter((m) => m.subject.includes(ref));
    expect(mine.find((m) => m.to.includes("team@example.test"))?.reply_to).toBe(who.email);
    expect(mine.find((m) => m.to.includes(who.email))?.subject).toBe(`We've got your request (${ref})`);
  });

  it("explains what's missing", async () => {
    const r = await act("submitConcierge", [form({ ...who, city: "Accra", category: "special-services", details: "x", when: "Soon", serviceMode: "elsewhere" })], { ip: visitor() });
    expect(r.result).toEqual({ ok: false, error: "Tell us where to meet." });
    const r2 = await act("submitConcierge", [form({ phone: "024", city: "Accra", category: "x", details: "x", when: "x" })], { ip: visitor() });
    expect(r2.result).toEqual({ ok: false, error: "Please fill in your name, phone and what you need." });
  });
});

describe("request to a business", () => {
  it("saves it as an enquiry and emails the team, the business and the visitor", async () => {
    const r = await act("sendBusinessRequest", [SLUG, form({ ...who, city: "Accra", message: "Can you start lessons next week?", serviceMode: "my_place", area: "Osu" })], { ip: visitor() });
    expect(r.result).toMatchObject({ ok: true, ref: expect.stringMatching(REF("PLG")) });
    const ref = String(r.result?.ref);
    expect(await db.enquiry.findUnique({ where: { ref } })).toMatchObject({ kind: "request", businessId, area: "Osu" });
    const mine = (await emails((e) => e.filter((m) => m.subject.includes(ref)).length >= 3)).filter((m) => m.subject.includes(ref));
    expect(mine.map((m) => m.to[0]).sort()).toEqual(["business@example.test", "team@example.test", "visitor@example.test"]);
    expect(mine.find((m) => m.to.includes("business@example.test"))?.reply_to).toBe(who.email);
  });
});

describe("waitlist and contact page", () => {
  it("adds a business to the waitlist", async () => {
    const r = await act("joinWaitlist", [form({ ...who, business: "E2E Kente Studio", category: "entertainment", city: "Accra" })], { ip: visitor() });
    expect(r.result).toMatchObject({ ok: true, ref: expect.stringMatching(REF("BIZ")) });
    expect(await db.waitlistEntry.findUnique({ where: { ref: String(r.result?.ref) } })).toMatchObject({ businessName: "E2E Kente Studio" });
  });

  it("sends a message, and needs a way to reply", async () => {
    const ok = await act("sendContactMessage", [form({ name: "E2E Visitor", phone: "0240000000", topic: "A general question", message: "Do you cover Takoradi yet?" })], { ip: visitor() });
    expect(ok.result).toMatchObject({ ok: true, ref: expect.stringMatching(REF("MSG")) });
    const bad = await act("sendContactMessage", [form({ name: "E2E Visitor", topic: "A general question", message: "No way to reply to me." })], { ip: visitor() });
    expect(bad.result).toEqual({ ok: false, error: "Add an email or a phone number so we can reply." });
  });
});

describe("spam protection", () => {
  const entry = (n: number) => form({ ...who, business: `E2E Spam ${n}`, category: "education", city: "Accra" });

  it("refuses a form sent faster than a person could fill it", async () => {
    const fd = entry(0);
    fd.set("_e", "500");
    const r = await act("joinWaitlist", [fd], { ip: visitor() });
    expect(r.result).toEqual({ ok: false, error: "Please take a moment to check your details, then send again." });
  });

  it("pretends to accept a bot that fills the hidden field, but saves nothing", async () => {
    const fd = entry(0);
    fd.set("website", "https://spam.example");
    const r = await act("joinWaitlist", [fd], { ip: visitor() });
    expect(r.result).toMatchObject({ ok: true });
    expect(await db.waitlistEntry.count({ where: { businessName: "E2E Spam 0" } })).toBe(0);
  });

  it("allows 6 submissions per visitor per hour, then refuses", async () => {
    const ip = visitor();
    for (let n = 1; n <= 6; n++) expect((await act("joinWaitlist", [entry(n)], { ip })).result).toMatchObject({ ok: true });
    expect((await act("joinWaitlist", [entry(7)], { ip })).result).toMatchObject({ ok: false, error: expect.stringContaining("several requests") });
    expect(await db.waitlistEntry.count({ where: { businessName: "E2E Spam 7" } })).toBe(0);
    // Another visitor isn't affected.
    expect((await act("joinWaitlist", [entry(8)], { ip: visitor() })).result).toMatchObject({ ok: true });
  });
});
