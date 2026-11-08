// Reviews end to end (issue #14): reference codes, moderation, ratings, replies and roles.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { act, adminCredentials, clearEmails, db, emails, form, page, signIn, visitor } from "./helpers";

const ip = visitor();
const started = new Date();
const SLUG = "e2e-review-plumbers";
const OTHER = "e2e-review-other";
let owner: string | null = null;
let editor: string | null = null;
let businessId = "";
let plgRef = "";
let cncRef = "";
let otherRef = "";

const review = (ref: string, over: Record<string, string> = {}) =>
  form({ ref, name: "E2E Ama O.", rating: "4", body: "They came on time and fixed the leak properly.", ...over });

beforeAll(async () => {
  await clearEmails();
  const base = { category: "special-services", kind: "Plumbing", city: "Accra", area: "Osu", blurb: "Plumbing repairs and installs", about: "Licensed plumbers for homes and offices in Accra.", status: "verified", images: "[]" };
  businessId = (await db.business.create({ data: { ...base, slug: SLUG, name: "E2E Review Plumbers" } })).id;
  const other = await db.business.create({ data: { ...base, slug: OTHER, name: "E2E Other Business" } });
  plgRef = String((await act("createEnquiry", [SLUG], { ip: visitor() })).result?.ref);
  otherRef = String((await act("createEnquiry", [OTHER], { ip: visitor() })).result?.ref);
  cncRef = (await db.conciergeRequest.create({ data: { ref: "CNC-E2EA-REVW", name: "E2E Client", phone: "0240000000", city: "Accra", category: "special-services", details: "x", timing: "Soon", businessId } })).ref;
  void other;
  const { email, password } = adminCredentials();
  owner = (await signIn(email, password, ip)).cookie;
  const pw = `e2e-${Math.random().toString(36).slice(2)}-password`;
  const inv = await act("inviteMember", [form({ name: "E2E Review Editor", email: "review-editor@example.test", role: "editor" }, { human: false })], { cookie: owner, at: "/admin/team", ip });
  const t = String(inv.result?.url).split("/").pop()!;
  editor = (await act("acceptInvite", [t, undefined, form({ name: "E2E Review Editor", password: pw, confirm: pw }, { human: false })], { at: `/admin/invite/${t}`, ip })).cookie;
});

afterAll(async () => {
  // Enquiries keep a removed business's history, so delete them first; reviews go with the business.
  await db.enquiry.deleteMany({ where: { business: { slug: { in: [SLUG, OTHER] } } } });
  await db.business.deleteMany({ where: { slug: { in: [SLUG, OTHER] } } });
  await db.conciergeRequest.deleteMany({ where: { ref: "CNC-E2EA-REVW" } });
  await db.invite.deleteMany({ where: { email: { endsWith: "@example.test" } } });
  await db.admin.deleteMany({ where: { email: { endsWith: "@example.test" } } });
  await db.auditLog.deleteMany({ where: { createdAt: { gte: started } } });
  await db.rateLimit.deleteMany({});
  await db.$disconnect();
});

const listing = async () => (await page(`/listing/${SLUG}`)).html;
const biz = () => db.business.findUniqueOrThrow({ where: { id: businessId }, select: { rating: true, reviewCount: true } });

describe("sending a review", () => {
  it("refuses an unknown reference, or one for another business", async () => {
    expect((await act("submitReview", [SLUG, review("PLG-ZZZZ-ZZZZ")], { ip: visitor() })).result).toMatchObject({ ok: false, error: expect.stringContaining("couldn't find that reference") });
    expect((await act("submitReview", [SLUG, review(otherRef)], { ip: visitor() })).result).toMatchObject({ ok: false, error: expect.stringContaining("couldn't find that reference") });
  });

  it("accepts a real reference, keeps the review hidden, and tells the team", async () => {
    const r = await act("submitReview", [SLUG, review(plgRef.toLowerCase())], { ip: visitor() });
    expect(r.result).toEqual({ ok: true, ref: plgRef });
    expect(await db.review.findUnique({ where: { ref: plgRef } })).toMatchObject({ status: "pending", rating: 4 });
    expect(await listing()).not.toContain("They came on time");
    const sent = await emails((e) => e.some((m) => m.subject.startsWith("New review to check")));
    expect(sent.find((m) => m.subject.startsWith("New review to check"))?.to).toEqual(["team@example.test"]);
  });

  it("allows one review per reference", async () => {
    expect((await act("submitReview", [SLUG, review(plgRef)], { ip: visitor() })).result).toMatchObject({ ok: false, error: "A review has already been sent with this reference." });
  });

  it("isn't open on example listings", async () => {
    const ex = await db.business.findFirstOrThrow({ where: { isExample: true, status: "verified" }, orderBy: { slug: "asc" }, select: { slug: true } });
    expect((await act("submitReview", [ex.slug, review(plgRef)], { ip: visitor() })).result).toMatchObject({ ok: false, error: "Reviews aren't open for this listing." });
  });
});

describe("moderation", () => {
  it("shows the review and updates the rating once approved", async () => {
    const r = await db.review.findUniqueOrThrow({ where: { ref: plgRef } });
    expect((await page("/admin/reviews", editor)).html).toContain("They came on time");
    expect((await act("moderateReview", [r.id, "approved"], { cookie: editor, at: "/admin/reviews", ip })).result).toEqual({ ok: true });
    expect(await biz()).toEqual({ rating: 4, reviewCount: 1 });
    const html = await listing();
    expect(html).toContain("They came on time");
    expect(html).toContain('"aggregateRating"');
  });

  it("averages several approved reviews, including from a concierge reference", async () => {
    await act("submitReview", [SLUG, review(cncRef, { rating: "5", name: "E2E Kofi M.", body: "The concierge found them and they did a great job." })], { ip: visitor() });
    const r = await db.review.findUniqueOrThrow({ where: { ref: cncRef } });
    await act("moderateReview", [r.id, "approved"], { cookie: owner, at: "/admin/reviews", ip });
    expect(await biz()).toEqual({ rating: 4.5, reviewCount: 2 });
  });

  it("recalculates when a review is rejected", async () => {
    const r = await db.review.findUniqueOrThrow({ where: { ref: cncRef } });
    await act("moderateReview", [r.id, "rejected"], { cookie: owner, at: "/admin/reviews", ip });
    expect(await biz()).toEqual({ rating: 4, reviewCount: 1 });
    expect(await listing()).not.toContain("The concierge found them");
  });

  it("shows a public reply from The Plug", async () => {
    const r = await db.review.findUniqueOrThrow({ where: { ref: plgRef } });
    expect((await act("respondToReview", [r.id, "Thank you, Ama. We've passed this on."], { cookie: editor, at: "/admin/reviews", ip })).result).toEqual({ ok: true });
    expect(await listing()).toContain("passed this on");
  });

  it("lets only owners delete a review", async () => {
    const r = await db.review.findUniqueOrThrow({ where: { ref: plgRef } });
    expect((await act("deleteReview", [r.id], { cookie: editor, at: "/admin/reviews", ip })).redirect).toBe("/admin?denied=1");
    expect((await act("deleteReview", [r.id], { cookie: owner, at: "/admin/reviews", ip })).result).toEqual({ ok: true });
    expect(await biz()).toEqual({ rating: null, reviewCount: 0 });
    expect(await db.auditLog.count({ where: { action: { in: ["review.approve", "review.reject", "review.respond", "review.delete"] }, createdAt: { gte: started } } })).toBeGreaterThanOrEqual(5);
  });
});
