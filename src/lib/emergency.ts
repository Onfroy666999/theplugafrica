// Emergency numbers (issue #11): services, validation and the "verified" rules. Pure, so the admin, the public page
// and the unit tests share one copy. Numbers are only public once someone on the team has checked them.
import { z } from "zod";

export const EMERGENCY_SERVICES = [
  { value: "ambulance", label: "Ambulance", hint: "National Ambulance Service" },
  { value: "police", label: "Police", hint: "Ghana Police Service" },
  { value: "fire", label: "Fire", hint: "Ghana National Fire Service" },
  { value: "hospital", label: "Hospitals", hint: "Hospitals with an emergency unit" },
  { value: "embassy", label: "Embassies", hint: "Consular help for foreign nationals" },
  { value: "pharmacy", label: "Pharmacies", hint: "Late-night and 24-hour pharmacies" },
  { value: "other", label: "Other", hint: "Other emergency help" },
] as const;
export type EmergencyService = (typeof EMERGENCY_SERVICES)[number]["value"];

/** Cities on the Emergency page; "" means the whole country. */
export const EMERGENCY_CITIES = ["Accra", "Kumasi", "Takoradi", "Tamale"] as const;
export const NATIONWIDE = "";

/** Numbers checked longer ago than this are flagged in the admin to check again. */
export const RECHECK_DAYS = 180;
export const needsRecheck = (verifiedAt: Date | null, now = new Date()) => !!verifiedAt && now.getTime() - verifiedAt.getTime() > RECHECK_DAYS * 86_400_000;

const opt = (max: number) => z.string().trim().max(max).optional().transform((v) => v || null);
const phone = z.string().trim().regex(/^\+?[\d\s()-]{3,25}$/, "Use digits only, for example 112 or +233 30 277 3906");

export const EmergencySchema = z
  .object({
    id: z.string().optional(),
    city: z.union([z.literal(NATIONWIDE), z.enum(EMERGENCY_CITIES)]),
    service: z.enum(EMERGENCY_SERVICES.map((s) => s.value) as [EmergencyService, ...EmergencyService[]]),
    name: z.string().trim().min(2, "Add the name, for example National Ambulance Service").max(120),
    phone,
    altPhone: z.union([z.literal(""), phone]).optional().transform((v) => v || null),
    address: opt(200),
    notes: opt(200),
    source: opt(200),
    sourceUrl: z.union([z.literal(""), z.url({ protocol: /^https?$/, message: "Use a full web address starting with https://" })]).optional().transform((v) => v || null),
    verified: z.enum(["true", "false"]).default("false"),
  })
  // A number can only be public once we've written down where it was confirmed.
  .refine((d) => d.verified === "false" || d.source, { message: "Say where you confirmed the number before marking it verified.", path: ["source"] });

/** A tel: link that works from any phone. */
export const telHref = (n: string) => `tel:${n.replace(/[^\d+]/g, "")}`;
