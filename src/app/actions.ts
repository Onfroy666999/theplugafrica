"use server";

import { db } from "@/lib/db";
import { notifyBusinessRequest, notifyConcierge, notifyContactMessage, notifyReview, notifyWaitlist } from "@/lib/notify";
import { limitForm, screenForm, visitorId } from "@/lib/protect";
import { publicWhere } from "@/lib/data";
import { isMember } from "@/lib/membership";
import { getUser } from "@/lib/users";
import { BusinessRequestSchema, ConciergeSchema, ContactSchema, ReviewSchema, WaitlistSchema, makeRef, parseDetails } from "@/lib/validation";

// Public form handlers. Each one saves to the admin inboxes and returns a reference code.

export type FormResult = { ok: true; ref: string } | { ok: false; error: string };

/** Honeypot, timing and Turnstile (issue #7). "bot" gets a fake success so bots learn nothing. */
async function screen(fd: FormData, prefix: string): Promise<FormResult | null> {
  const r = await screenForm(fd);
  if (r === "bot") return { ok: true, ref: makeRef(prefix) };
  return r ? { ok: false, error: r } : null;
}

/** Counts a valid submission against the visitor's limit (issue #7). */
async function limit(kind: string): Promise<FormResult | null> {
  const r = await limitForm(kind);
  return r ? { ok: false, error: r } : null;
}

export async function createEnquiry(slug: string): Promise<
  { ok: true; ref: string; contact: { phone?: string; whatsapp?: string; email?: string } } | { ok: false; error: string }
> {
  const b = await db.business.findFirst({ where: { slug, ...publicWhere() } });
  if (!b) return { ok: false, error: "This business is no longer listed." };
  if (await limitForm("reveal", 20)) return { ok: false, error: "You've asked for several businesses' details in a short time. Please wait a while." };
  // Asking again for the same business within a day gives the same reference (issue #94), so review codes can't be
  // collected in bulk by revealing a business over and over.
  const visitorHash = await visitorId();
  const user = await getUser();
  const recent = await db.enquiry.findFirst({
    where: { businessId: b.id, kind: "contact", visitorHash, createdAt: { gt: new Date(Date.now() - 86_400_000) } },
    orderBy: { createdAt: "desc" },
    select: { ref: true },
  });
  const ref = recent?.ref ?? makeRef("PLG");
  if (!recent) await db.enquiry.create({ data: { ref, businessId: b.id, userId: user?.id, visitorHash } });
  return { ok: true, ref, contact: { phone: b.phone ?? undefined, whatsapp: b.whatsapp ?? undefined, email: b.email ?? undefined } };
}

export async function submitConcierge(fd: FormData): Promise<FormResult> {
  const blocked = await screen(fd, "CNC");
  if (blocked) return blocked;
  const parsed = ConciergeSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, error: "Please fill in your name, phone and what you need." };
  const where = parseDetails(Object.fromEntries(fd));
  if (!where.ok) return { ok: false, error: where.error };
  const d = parsed.data;
  const business = d.listing ? await db.business.findFirst({ where: { slug: d.listing, ...publicWhere() }, select: { id: true } }) : null;
  // Store the service name (not the slug) so the request still reads correctly if the service is renamed later.
  const service = d.service ? await db.service.findFirst({ where: { category: d.category, slug: d.service }, select: { name: true } }) : null;
  const over = await limit("concierge");
  if (over) return over;
  const ref = makeRef("CNC");
  const user = await getUser();
  const fromMember = user ? await isMember(user.id) : false;
  await db.conciergeRequest.create({
    data: { ref, name: d.name, phone: d.phone, email: d.email, city: d.city, category: d.category, service: service?.name, details: d.details, timing: d.when, businessId: business?.id, userId: user?.id, fromMember, ...where.data },
  });
  notifyConcierge({ ref, name: d.name, phone: d.phone, email: d.email, category: d.category, service: service?.name, details: d.details, timing: d.when, city: d.city, member: fromMember, ...where.data });
  return { ok: true, ref };
}

/** "Send a request through The Plug" on a listing (issue #50): stored as an enquiry with the visitor's details. */
export async function sendBusinessRequest(slug: string, fd: FormData): Promise<FormResult> {
  const blocked = await screen(fd, "PLG");
  if (blocked) return blocked;
  const b = await db.business.findFirst({ where: { slug, ...publicWhere() }, select: { id: true, name: true, email: true } });
  if (!b) return { ok: false, error: "This business is no longer listed." };
  const parsed = BusinessRequestSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, error: "Please add your name, phone number and a sentence about what you need." };
  const where = parseDetails(Object.fromEntries(fd));
  if (!where.ok) return { ok: false, error: where.error };
  const d = parsed.data;
  const over = await limit("request");
  if (over) return over;
  const ref = makeRef("PLG");
  const user = await getUser();
  await db.enquiry.create({
    data: { ref, businessId: b.id, userId: user?.id, kind: "request", name: d.name, phone: d.phone, email: d.email, city: d.city, message: d.message, ...where.data },
  });
  notifyBusinessRequest({ ref, name: d.name, phone: d.phone, email: d.email, message: d.message, city: d.city, business: { name: b.name, email: b.email }, ...where.data });
  return { ok: true, ref };
}

export async function joinWaitlist(fd: FormData): Promise<FormResult> {
  const blocked = await screen(fd, "BIZ");
  if (blocked) return blocked;
  const parsed = WaitlistSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, error: "Please fill in your business name, your name and a phone number." };
  const d = parsed.data;
  const over = await limit("waitlist");
  if (over) return over;
  const ref = makeRef("BIZ");
  await db.waitlistEntry.create({ data: { ref, businessName: d.business, category: d.category, city: d.city, name: d.name, phone: d.phone, email: d.email } });
  notifyWaitlist({ ref, businessName: d.business, category: d.category, city: d.city, name: d.name, phone: d.phone, email: d.email });
  return { ok: true, ref };
}

/** Contact page (issue #29): a general message for The Plug team. */
export async function sendContactMessage(fd: FormData): Promise<FormResult> {
  const blocked = await screen(fd, "MSG");
  if (blocked) return blocked;
  const parsed = ContactSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    const custom = parsed.error.issues.find((i) => i.code === "custom");
    return { ok: false, error: custom?.message ?? "Please add your name, a way to reply, and a message of at least a sentence." };
  }
  const d = parsed.data;
  const over = await limit("contact");
  if (over) return over;
  const ref = makeRef("MSG");
  await db.contactMessage.create({ data: { ref, name: d.name, email: d.email, phone: d.phone, topic: d.topic, message: d.message } });
  notifyContactMessage({ ref, name: d.name, email: d.email, phone: d.phone, topic: d.topic, message: d.message });
  return { ok: true, ref };
}

/**
 * A review of a business (issue #14). It needs a reference code from contacting that business through The Plug (or a
 * concierge request about it), allows one review per code, and stays hidden until the team approves it.
 */
export async function submitReview(slug: string, fd: FormData): Promise<FormResult> {
  const blocked = await screen(fd, "REV");
  if (blocked) return blocked;
  const b = await db.business.findFirst({ where: { slug, ...publicWhere(), isExample: false }, select: { id: true, name: true } });
  if (!b) return { ok: false, error: "Reviews aren't open for this listing." };
  const parsed = ReviewSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;
  // Counted before the reference is checked, so codes can't be guessed at speed.
  const over = await limit("review");
  if (over) return over;
  const [enquiry, concierge] = await Promise.all([
    db.enquiry.findFirst({ where: { ref: d.ref, businessId: b.id }, select: { id: true } }),
    db.conciergeRequest.findFirst({ where: { ref: d.ref, businessId: b.id }, select: { id: true } }),
  ]);
  if (!enquiry && !concierge)
    return { ok: false, error: `We couldn't find that reference for ${b.name}. It's the code you were shown when you contacted them through The Plug.` };
  if (await db.review.findUnique({ where: { ref: d.ref }, select: { id: true } })) return { ok: false, error: "A review has already been sent with this reference." };
  await db.review.create({ data: { businessId: b.id, ref: d.ref, name: d.name, rating: d.rating, body: d.body } });
  notifyReview({ business: b.name, name: d.name, rating: d.rating, body: d.body, ref: d.ref });
  return { ok: true, ref: d.ref };
}
