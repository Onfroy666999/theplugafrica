// Validation for the public forms (issues #29, #36, #50). Pure, so the rules are unit-tested (issue #9);
// the server actions in src/app/actions.ts use these schemas.
import { z } from "zod";
import { CONTACT_TOPICS } from "./contact";
import { OTHER_AREA, TIMES_OF_DAY } from "./requests";

const text = (max: number) => z.string().trim().min(1, "Required").max(max);
const optional = (max: number) => z.string().trim().max(max).optional().transform((v) => v || undefined);
/** An optional email that must look like one: it becomes a recipient and a reply-to, and junk would bounce the whole email. */
const optionalEmail = z.string().trim().toLowerCase().max(160).optional().transform((v) => v || undefined).pipe(z.email("Please check the email address.").optional());

/** A reference code such as CNC-7KQ2-M9XA: a prefix and 8 characters that can't be confused (no 0/O, 1/I). */
export function makeRef(prefix: string) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const pick = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${prefix}-${pick(4)}-${pick(4)}`;
}

/** Where and when, shared by the concierge form and requests to a business (issue #50). */
export const DetailsSchema = z
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
export function parseDetails(fields: Record<string, unknown>) {
  const p = DetailsSchema.safeParse(fields);
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

export const ConciergeSchema = z.object({
  name: text(120),
  phone: text(40),
  email: optionalEmail,
  city: text(60),
  category: text(40),
  details: text(4000),
  when: text(60),
  listing: optional(120),
  /** Service slug when sent from a service page (issue #36). */
  service: optional(80),
});

export const BusinessRequestSchema = z.object({
  name: text(120),
  phone: text(40),
  email: optionalEmail,
  city: text(60),
  message: z.string().trim().min(10).max(2000),
});

export const WaitlistSchema = z.object({
  business: text(160),
  category: text(40),
  city: text(60),
  name: text(120),
  phone: text(40),
  email: optionalEmail,
});

export const ContactSchema = z
  .object({
    name: text(120),
    email: optional(160).pipe(z.string().email().optional()),
    phone: optional(40),
    topic: z.enum(CONTACT_TOPICS),
    message: z.string().trim().min(10).max(4000),
  })
  .refine((d) => d.email || d.phone, { message: "Add an email or a phone number so we can reply." });

/** A reference code from contacting a business (PLG-…) or a concierge request about it (CNC-…). */
export const REF_PATTERN = /^(PLG|CNC)-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;

/** Customer reviews (issue #14). */
export const ReviewSchema = z.object({
  ref: z
    .string()
    .trim()
    .toUpperCase()
    .regex(REF_PATTERN, "Enter the reference you were given, like PLG-7KQ2-M9XA."),
  name: z.string().trim().min(2, "Add the name to show with your review.").max(60),
  rating: z.coerce.number().int().min(1, "Choose a rating from 1 to 5 stars.").max(5, "Choose a rating from 1 to 5 stars."),
  body: z.string().trim().min(20, "Write at least a sentence or two about your experience.").max(2000),
});

/** Average of approved ratings to one decimal place, and how many there are. */
export function summariseRatings(ratings: number[]) {
  if (!ratings.length) return { rating: null, reviewCount: 0 };
  return { rating: Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10, reviewCount: ratings.length };
}
