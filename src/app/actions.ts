"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { CONTACT_TOPICS } from "@/lib/contact";
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

/** Hidden "website" field: people never fill it, simple bots do. */
const isBot = (fd: FormData) => String(fd.get("website") ?? "").length > 0;

export async function createEnquiry(slug: string): Promise<
  { ok: true; ref: string; contact: { phone?: string; whatsapp?: string; email?: string } } | { ok: false; error: string }
> {
  const b = await db.business.findFirst({ where: { slug, status: { in: [...PUBLIC_STATUSES] } } });
  if (!b) return { ok: false, error: "This business is no longer listed." };
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
});

export async function submitConcierge(fd: FormData): Promise<FormResult> {
  if (isBot(fd)) return { ok: true, ref: makeRef("CNC") };
  const parsed = ConciergeSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, error: "Please fill in your name, phone and what you need." };
  const d = parsed.data;
  const business = d.listing ? await db.business.findUnique({ where: { slug: d.listing }, select: { id: true } }) : null;
  const ref = makeRef("CNC");
  await db.conciergeRequest.create({
    data: { ref, name: d.name, phone: d.phone, email: d.email, city: d.city, category: d.category, details: d.details, timing: d.when, businessId: business?.id },
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
  if (isBot(fd)) return { ok: true, ref: makeRef("BIZ") };
  const parsed = WaitlistSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, error: "Please fill in your business name, your name and a phone number." };
  const d = parsed.data;
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
  if (isBot(fd)) return { ok: true, ref: makeRef("MSG") };
  const parsed = ContactSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    const custom = parsed.error.issues.find((i) => i.code === "custom");
    return { ok: false, error: custom?.message ?? "Please add your name, a way to reply, and a message of at least a sentence." };
  }
  const d = parsed.data;
  const ref = makeRef("MSG");
  await db.contactMessage.create({ data: { ref, name: d.name, email: d.email, phone: d.phone, topic: d.topic, message: d.message } });
  return { ok: true, ref };
}
