"use server";

import { db } from "@/lib/db";
import { notifyBusinessRequest, notifyConcierge, notifyContactMessage, notifyWaitlist } from "@/lib/notify";
import { limitForm, screenForm } from "@/lib/protect";
import { PUBLIC_STATUSES } from "@/lib/status";
import { BusinessRequestSchema, ConciergeSchema, ContactSchema, WaitlistSchema, makeRef, parseDetails } from "@/lib/validation";

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
  const b = await db.business.findFirst({ where: { slug, status: { in: [...PUBLIC_STATUSES] } } });
  if (!b) return { ok: false, error: "This business is no longer listed." };
  if (await limitForm("reveal", 20)) return { ok: false, error: "You've asked for several businesses' details in a short time. Please wait a while." };
  const ref = makeRef("PLG");
  await db.enquiry.create({ data: { ref, businessId: b.id } });
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
  const business = d.listing ? await db.business.findUnique({ where: { slug: d.listing }, select: { id: true } }) : null;
  // Store the service name (not the slug) so the request still reads correctly if the service is renamed later.
  const service = d.service ? await db.service.findFirst({ where: { category: d.category, slug: d.service }, select: { name: true } }) : null;
  const over = await limit("concierge");
  if (over) return over;
  const ref = makeRef("CNC");
  await db.conciergeRequest.create({
    data: { ref, name: d.name, phone: d.phone, email: d.email, city: d.city, category: d.category, service: service?.name, details: d.details, timing: d.when, businessId: business?.id, ...where.data },
  });
  notifyConcierge({ ref, name: d.name, phone: d.phone, email: d.email, category: d.category, service: service?.name, details: d.details, timing: d.when, city: d.city, ...where.data });
  return { ok: true, ref };
}

/** "Send a request through The Plug" on a listing (issue #50): stored as an enquiry with the visitor's details. */
export async function sendBusinessRequest(slug: string, fd: FormData): Promise<FormResult> {
  const blocked = await screen(fd, "PLG");
  if (blocked) return blocked;
  const b = await db.business.findFirst({ where: { slug, status: { in: [...PUBLIC_STATUSES] } }, select: { id: true, name: true, email: true } });
  if (!b) return { ok: false, error: "This business is no longer listed." };
  const parsed = BusinessRequestSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, error: "Please add your name, phone number and a sentence about what you need." };
  const where = parseDetails(Object.fromEntries(fd));
  if (!where.ok) return { ok: false, error: where.error };
  const d = parsed.data;
  const over = await limit("request");
  if (over) return over;
  const ref = makeRef("PLG");
  await db.enquiry.create({
    data: { ref, businessId: b.id, kind: "request", name: d.name, phone: d.phone, email: d.email, city: d.city, message: d.message, ...where.data },
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
