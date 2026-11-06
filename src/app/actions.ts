"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { CONTACT_TOPICS } from "@/lib/contact";
import { OTHER_AREA, TIMES_OF_DAY } from "@/lib/requests";
import { limitForm, screenForm } from "@/lib/protect";
import { PUBLIC_STATUSES } from "@/lib/status";

// Public form handlers. Each one saves to the admin inboxes and returns a reference code.

function makeRef(prefix: string) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const pick = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${prefix}-${pick(4)}-${pick(4)}`;
}

export type FormResult = { ok: true; ref: string } | { ok: false; error: string };

const text = (max: number) => z.string().trim().min(1, "Required").max(max);
const optional = (max: number) => z.string().trim().max(max).optional().transform((v) => v || undefined);

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

/** Where and when, shared by the concierge form and requests to a business (issue #50). */
const DetailsSchema = z
  .object({
    serviceMode: z.enum(["my_place", "their_place", "elsewhere", "remote"]).optional(),
    area: optional(80),
    areaOther: optional(80),
    landmark: optional(160),
    meetingPlace: optional(160),
    preferredDate: optional(10).pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
    timeOfDay: z.enum(TIMES_OF_DAY).optional(),
  })
  .refine((d) => d.serviceMode !== "elsewhere" || d.meetingPlace, { message: "Tell us where to meet." });

/** Validated details as database columns; an "Other" area takes the typed name. */
function details(fd: FormData) {
  const p = DetailsSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { ok: false as const, error: p.error.issues.find((i) => i.code === "custom")?.message ?? "Check the location and date." };
  const d = p.data;
  const area = d.area === OTHER_AREA || !d.area ? d.areaOther : d.area;
  return {
    ok: true as const,
    data: {
      serviceMode: d.serviceMode,
      area,
      landmark: d.landmark,
      meetingPlace: d.serviceMode === "elsewhere" ? d.meetingPlace : undefined,
      preferredDate: d.preferredDate,
      timeOfDay: d.timeOfDay,
    },
  };
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

const ConciergeSchema = z.object({
  name: text(120),
  phone: text(40),
  email: optional(160),
  city: text(60),
  category: text(40),
  details: text(4000),
  when: text(60),
  listing: optional(120),
  /** Service slug when sent from a service page (issue #36). */
  service: optional(80),
});

export async function submitConcierge(fd: FormData): Promise<FormResult> {
  const blocked = await screen(fd, "CNC");
  if (blocked) return blocked;
  const parsed = ConciergeSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, error: "Please fill in your name, phone and what you need." };
  const where = details(fd);
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
  return { ok: true, ref };
}

const BusinessRequestSchema = z.object({
  name: text(120),
  phone: text(40),
  email: optional(160),
  city: text(60),
  message: z.string().trim().min(10).max(2000),
});

/** "Send a request through The Plug" on a listing (issue #50): stored as an enquiry with the visitor's details. */
export async function sendBusinessRequest(slug: string, fd: FormData): Promise<FormResult> {
  const blocked = await screen(fd, "PLG");
  if (blocked) return blocked;
  const b = await db.business.findFirst({ where: { slug, status: { in: [...PUBLIC_STATUSES] } }, select: { id: true } });
  if (!b) return { ok: false, error: "This business is no longer listed." };
  const parsed = BusinessRequestSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, error: "Please add your name, phone number and a sentence about what you need." };
  const where = details(fd);
  if (!where.ok) return { ok: false, error: where.error };
  const d = parsed.data;
  const over = await limit("request");
  if (over) return over;
  const ref = makeRef("PLG");
  await db.enquiry.create({
    data: { ref, businessId: b.id, kind: "request", name: d.name, phone: d.phone, email: d.email, city: d.city, message: d.message, ...where.data },
  });
  return { ok: true, ref };
}

const WaitlistSchema = z.object({
  business: text(160),
  category: text(40),
  city: text(60),
  name: text(120),
  phone: text(40),
  email: optional(160),
});

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
  return { ok: true, ref };
}


const ContactSchema = z
  .object({
    name: text(120),
    email: optional(160).pipe(z.string().email().optional()),
    phone: optional(40),
    topic: z.enum(CONTACT_TOPICS),
    message: z.string().trim().min(10).max(4000),
  })
  .refine((d) => d.email || d.phone, { message: "Add an email or a phone number so we can reply." });

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
  return { ok: true, ref };
}
