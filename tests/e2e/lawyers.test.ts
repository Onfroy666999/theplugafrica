// Lawyers, reached only through the concierge (issue #132): the listing never gives out contact details, the server
// refuses direct contact, and a request about the lawyer alerts the concierge with their name and availability.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { REF, act, clearEmails, db, emails, form, page, visitor } from "./helpers";

const tag = Math.random().toString(36).slice(2, 7);
const SLUG = `e2e-lawyer-${tag}`;
const NAME = `E2E Mensah Chambers ${tag}`;
const PHONE = "+233 24 999 1320";
const EMAIL = `chambers-${tag}@example.test`;
let businessId = "";

beforeAll(async () => {
  await clearEmails();
  const lawyers = await db.service.findUniqueOrThrow({ where: { category_slug: { category: "new-business", slug: "lawyers" } } });
  businessId = (
    await db.business.create({
      data: {
        slug: SLUG, name: NAME, category: "new-business", kind: "Corporate and property lawyer", city: "Accra", area: "Ridge",
        blurb: "Contracts, leases and company work", about: "An independent lawyer for small businesses and property matters.",
        status: "verified", images: "[]", phone: PHONE, whatsapp: PHONE, email: EMAIL, mediated: true, availability: "limited",
        services: { connect: { id: lawyers.id } },
      },
    })
  ).id;
});

afterAll(async () => {
  await db.conciergeRequest.deleteMany({ where: { businessId } });
  await db.enquiry.deleteMany({ where: { businessId } });
  await db.business.deleteMany({ where: { id: businessId } });
  await db.$disconnect();
});

const who = { name: "E2E Lawyer Client", phone: "0244000132", email: `client-${tag}@example.test` };

describe("lawyers through the concierge", () => {
  it("lists the lawyer under Business › Lawyers & law firms", async () => {
    const r = await page("/explore/new-business/lawyers");
    expect(r.status).toBe(200);
    expect(r.html).toContain(NAME);
    expect((await page("/explore/new-business")).html).toContain("Lawyers &amp; law firms");
  });

  it("never shows the contact details, and offers only a request through The Plug", async () => {
    const r = await page(`/listing/${SLUG}`);
    expect(r.status).toBe(200);
    const html = r.html.replace(/<!-- -->/g, "");
    for (const secret of [EMAIL, PHONE, PHONE.replace(/\s/g, "")]) expect(html).not.toContain(secret);
    expect(html).toContain("Request through The Plug");
    expect(html).toContain("Limited availability");
    expect(html).not.toContain("Contact this business");
    expect(html).toContain(`/concierge?listing=${SLUG}`);
  });

  it("refuses to give out the contact details or forward a direct request", async () => {
    const reveal = await act("createEnquiry", [SLUG], { ip: visitor() });
    expect(reveal.result).toMatchObject({ ok: false });
    expect(JSON.stringify(reveal.result)).not.toContain(EMAIL);
    const direct = await act("sendBusinessRequest", [SLUG, form({ ...who, city: "Accra", message: "Can you review my lease?", serviceMode: "remote" })], { ip: visitor() });
    expect(direct.result).toMatchObject({ ok: false });
    expect(await db.enquiry.count({ where: { businessId } })).toBe(0);
  });

  it("names the lawyer on the concierge form", async () => {
    const r = await page(`/concierge?listing=${SLUG}`);
    expect(r.html.replace(/<!-- -->/g, "")).toContain(NAME);
  });

  it("alerts the concierge with the lawyer's name and availability, and never emails the lawyer", async () => {
    const r = await act("submitConcierge", [form({ ...who, listing: SLUG, city: "Accra", category: "new-business", details: "Please review a shop lease before I sign.", when: "This week", serviceMode: "remote" })], { ip: visitor() });
    expect(r.result).toMatchObject({ ok: true, ref: expect.stringMatching(REF("CNC")) });
    const ref = String(r.result?.ref);
    expect(await db.conciergeRequest.findUnique({ where: { ref } })).toMatchObject({ businessId });

    const sent = await emails((e) => e.filter((m) => m.subject.includes(ref)).length >= 2);
    const team = sent.find((m) => m.subject.includes(ref) && m.to.includes("team@example.test"));
    expect(team?.subject).toContain(NAME);
    expect(team?.text).toContain("Limited availability");
    expect(sent.some((m) => m.to.includes(EMAIL))).toBe(false);
  });
});
