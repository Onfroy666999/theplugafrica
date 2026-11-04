"use server";

import { z } from "zod";
import { db } from "@/lib/db";
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
