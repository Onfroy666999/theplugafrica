"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { endSession, requireAdmin, startSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { onWorkers } from "@/lib/runtime";
import { isAllowedPhoto, storageEnabled, uploadToStorage } from "@/lib/storage";
import { CATS } from "@/lib/directory";
import { BUSINESS_STATUS, CONCIERGE_STATUS, CREDENTIAL_STATE, ENQUIRY_STATUS, WAITLIST_STATUS, CONTACT_STATUS, values } from "@/lib/status";

/* ---------------- Sign in / out ---------------- */

// Simple in-memory throttle: 5 failed attempts per email+IP per 15 minutes.
const attempts = new Map<string, { n: number; until: number }>();
const WINDOW = 15 * 60 * 1000;
// Compared against when an email is unknown, so timing doesn't reveal which emails exist.
// Created on first use (hashing is deliberately slow; doing it at import slowed every admin page load).
let dummyHash: string | undefined;
const getDummyHash = async () => (dummyHash ??= await bcrypt.hash(randomBytes(16).toString("hex"), 12));

export async function login(_: unknown, fd: FormData): Promise<{ error: string; email: string } | undefined> {
  const email = String(fd.get("email") ?? "").toLowerCase().trim();
  const password = String(fd.get("password") ?? "");
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = `${email}|${ip}`;
  const now = Date.now();
  const a = attempts.get(key);
  if (a && a.n >= 5 && a.until > now) return { error: "Too many attempts. Wait 15 minutes and try again.", email };

  const admin = email ? await db.admin.findUnique({ where: { email } }) : null;
  const ok = await bcrypt.compare(password, admin?.passwordHash ?? (await getDummyHash()));
  if (!admin || !ok) {
    attempts.set(key, { n: (a && a.until > now ? a.n : 0) + 1, until: now + WINDOW });
    return { error: "That email and password don't match.", email };
  }
  attempts.delete(key);
  await startSession(admin);
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

/* ---------------- Businesses ---------------- */

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

const opt = (max: number) => z.string().trim().max(max).optional().transform((v) => v || null);

const BusinessSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Add the business name").max(160),
  slug: z.string().trim().max(80).optional(),
  // Concierge-only categories (New Business, #36) take no business listings.
  category: z.enum(CATS.filter((c) => !c.concierge).map((c) => c.key) as [string, ...string[]]),
  kind: z.string().trim().min(2, "Add what kind of business it is").max(80),
  city: z.string().trim().min(2, "Add the city").max(60),
  area: z.string().trim().min(2, "Add the area or neighbourhood").max(80),
  blurb: z.string().trim().min(10, "Add a one-line summary").max(200),
  about: z.string().trim().min(20, "Add a fuller description").max(4000),
  price: z.string().trim().max(80).default("Price on request"),
  responds: z.string().trim().max(80).default("Usually replies within a day"),
  languages: z.string().trim().max(120).default("English"),
  phone: opt(40),
  whatsapp: opt(40),
  email: z.union([z.literal(""), z.email("Check the email address")]).optional().transform((v) => v || null),
  status: z.enum(values(BUSINESS_STATUS)),
  images: z.string().transform((s, ctx) => {
    try {
      const v = JSON.parse(s);
      if (Array.isArray(v) && v.every((x) => typeof x === "string" && isAllowedPhoto(x))) return v as string[];
    } catch {}
    ctx.addIssue({ code: "custom", message: "Images are invalid" });
    return z.NEVER;
  }),
  services: z
    .string()
    .default("[]")
    .transform((s, ctx) => {
      try {
        return z.array(z.string().min(1).max(40)).max(30).parse(JSON.parse(s));
      } catch {}
      ctx.addIssue({ code: "custom", message: "Services are invalid" });
      return z.NEVER;
    }),
  credentials: z.string().transform((s, ctx) => {
    try {
      const v = z.array(z.object({ label: z.string().trim().min(1).max(160), state: z.enum(values(CREDENTIAL_STATE)) })).parse(JSON.parse(s));
      return v;
    } catch {}
    ctx.addIssue({ code: "custom", message: "Credentials are invalid" });
    return z.NEVER;
  }),
});

export type SaveResult = { ok: true; id: string } | { ok: false; error: string; field?: string };

export async function saveBusiness(fd: FormData): Promise<SaveResult> {
  await requireAdmin();
  const parsed = BusinessSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue.message, field: String(issue.path[0] ?? "") };
  }
  const { id, credentials, images, services: serviceIds, slug: rawSlug, ...d } = parsed.data;
  const slug = slugify(rawSlug || d.name);
  if (!slug) return { ok: false, error: "Add a web address (slug)", field: "slug" };
  const clash = await db.business.findUnique({ where: { slug }, select: { id: true } });
  if (clash && clash.id !== id) return { ok: false, error: `Another business already uses the address /listing/${slug}`, field: "slug" };
  if (d.status === "verified" && credentials.some((c) => c.state !== "verified"))
    return { ok: false, error: "Every credential must be Checked before a business can be marked Verified.", field: "status" };

  // Services must belong to the business's category; at least one is required when the category has services.
  const valid = await db.service.findMany({ where: { id: { in: serviceIds }, category: d.category }, select: { id: true } });
  if (valid.length !== serviceIds.length) return { ok: false, error: "Some chosen services belong to another category. Re-check the services.", field: "services" };
  if (!valid.length && (await db.service.count({ where: { category: d.category } })) > 0)
    return { ok: false, error: "Choose at least one service so visitors can find this business.", field: "services" };

  const data = { ...d, slug, images: JSON.stringify(images), services: { set: valid } };
  const saved = id
    ? await db.business.update({ where: { id }, data })
    : await db.business.create({ data: { ...d, slug, images: JSON.stringify(images), services: { connect: valid } } });
  await db.credential.deleteMany({ where: { businessId: saved.id } });
  if (credentials.length) await db.credential.createMany({ data: credentials.map((c, i) => ({ ...c, businessId: saved.id, position: i })) });

  revalidatePath("/admin/businesses");
  return { ok: true, id: saved.id };
}

export async function setBusinessStatus(id: string, status: string) {
  await requireAdmin();
  z.enum(values(BUSINESS_STATUS)).parse(status);
  if (status === "verified") {
    const pending = await db.credential.count({ where: { businessId: id, state: { not: "verified" } } });
    if (pending) return { ok: false as const, error: "Check every credential before marking Verified." };
  }
  await db.business.update({ where: { id }, data: { status } });
  revalidatePath("/admin/businesses");
  return { ok: true as const };
}

export async function deleteBusiness(id: string) {
  await requireAdmin();
  await db.business.delete({ where: { id } });
  revalidatePath("/admin/businesses");
  redirect("/admin/businesses");
}

/* ---------------- Image upload ---------------- */
// Saved under public/uploads for local use. Hosting needs cloud storage instead (see CLAUDE.md).

const MAX_BYTES = 6 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** True when the file's first bytes match its declared type, so a renamed non-image is rejected. */
function looksLike(ext: string, b: Uint8Array) {
  if (ext === "jpg") return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (ext === "png") return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  if (ext === "webp") return String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP";
  return false;
}

/** Admin photo uploads (issue #3): Supabase Storage when configured, otherwise public/uploads on a local server. */
export async function uploadImages(fd: FormData): Promise<{ ok: true; paths: string[] } | { ok: false; error: string }> {
  await requireAdmin();
  const files = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { ok: false, error: "Choose at least one photo." };
  if (!storageEnabled() && onWorkers) return { ok: false, error: "Photo storage isn't set up on this site yet. Choose photos from the library for now." };

  // Check every file before saving any.
  const ready: { name: string; bytes: ArrayBuffer; type: string }[] = [];
  for (const f of files) {
    const ext = TYPES[f.type];
    if (!ext) return { ok: false, error: `${f.name}: use JPG, PNG or WebP.` };
    if (f.size > MAX_BYTES) return { ok: false, error: `${f.name} is over 6 MB.` };
    const bytes = await f.arrayBuffer();
    if (!looksLike(ext, new Uint8Array(bytes.slice(0, 12)))) return { ok: false, error: `${f.name} isn't a valid ${ext.toUpperCase()} image.` };
    ready.push({ name: `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.${ext}`, bytes, type: f.type });
  }

  try {
    if (storageEnabled()) return { ok: true, paths: await Promise.all(ready.map((r) => uploadToStorage(r.name, r.bytes, r.type))) };
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    for (const r of ready) await writeFile(path.join(dir, r.name), Buffer.from(r.bytes));
    return { ok: true, paths: ready.map((r) => `/uploads/${r.name}`) };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "The upload didn't go through. Try again in a moment." };
  }
}

/* ---------------- Inboxes ---------------- */

const INBOX = {
  enquiry: { statuses: ENQUIRY_STATUS, path: "/admin/enquiries" },
  concierge: { statuses: CONCIERGE_STATUS, path: "/admin/concierge" },
  waitlist: { statuses: WAITLIST_STATUS, path: "/admin/waitlist" },
  contact: { statuses: CONTACT_STATUS, path: "/admin/messages" },
} as const;
export type InboxKind = keyof typeof INBOX;

export async function updateInbox(kind: InboxKind, id: string, patch: { status?: string; notes?: string }) {
  await requireAdmin();
  const cfg = INBOX[kind];
  const data: { status?: string; notes?: string | null } = {};
  if (patch.status !== undefined) data.status = z.enum(values(cfg.statuses)).parse(patch.status);
  if (patch.notes !== undefined) data.notes = patch.notes.trim().slice(0, 4000) || null;
  if (kind === "enquiry") await db.enquiry.update({ where: { id }, data });
  if (kind === "concierge") await db.conciergeRequest.update({ where: { id }, data });
  if (kind === "waitlist") await db.waitlistEntry.update({ where: { id }, data });
  if (kind === "contact") await db.contactMessage.update({ where: { id }, data });
  revalidatePath(cfg.path);
  revalidatePath("/admin");
}

/* ---------------- Services (sub-categories, issue #26) ---------------- */

const CAT_KEYS = CATS.filter((c) => c.key !== "emergency").map((c) => c.key) as [string, ...string[]];

const ServiceSchema = z.object({
  id: z.string().optional(),
  category: z.enum(CAT_KEYS),
  name: z.string().trim().min(2, "Add a service name").max(80),
  slug: z.string().trim().max(60).optional(),
  description: z.string().trim().max(240).default(""),
  image: z.string().trim().max(300).refine((v) => v === "" || isAllowedPhoto(v), "Choose a photo from the library").default(""),
  visible: z.enum(["true", "false"]).default("true"),
});

export async function saveService(fd: FormData): Promise<SaveResult> {
  await requireAdmin();
  const parsed = ServiceSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue.message, field: String(issue.path[0] ?? "") };
  }
  const { id, slug: rawSlug, visible, ...d } = parsed.data;
  const slug = slugify(rawSlug || d.name);
  if (!slug) return { ok: false, error: "Add a web address", field: "slug" };
  const clash = await db.service.findUnique({ where: { category_slug: { category: d.category, slug } }, select: { id: true } });
  if (clash && clash.id !== id) return { ok: false, error: `This category already has a service at /${slug}`, field: "slug" };

  if (id) {
    const before = await db.service.findUnique({ where: { id }, select: { category: true } });
    if (before && before.category !== d.category) return { ok: false, error: "A service can't move to another category. Create it there instead.", field: "category" };
    await db.service.update({ where: { id }, data: { ...d, slug, visible: visible === "true" } });
    revalidatePath("/admin/services");
    return { ok: true, id };
  }
  const last = await db.service.findFirst({ where: { category: d.category }, orderBy: { position: "desc" }, select: { position: true } });
  const created = await db.service.create({ data: { ...d, slug, visible: visible === "true", position: (last?.position ?? -1) + 1 } });
  revalidatePath("/admin/services");
  return { ok: true, id: created.id };
}

export async function setServiceVisible(id: string, visible: boolean) {
  await requireAdmin();
  await db.service.update({ where: { id }, data: { visible } });
  revalidatePath("/admin/services");
}

/** Swap a service with its neighbour above (-1) or below (+1) within its category. */
export async function moveService(id: string, dir: -1 | 1) {
  await requireAdmin();
  const svc = await db.service.findUnique({ where: { id } });
  if (!svc) return;
  const list = await db.service.findMany({ where: { category: svc.category }, orderBy: [{ position: "asc" }, { name: "asc" }], select: { id: true } });
  const i = list.findIndex((s) => s.id === id);
  const j = i + dir;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await db.$transaction(list.map((s, pos) => db.service.update({ where: { id: s.id }, data: { position: pos } })));
  revalidatePath("/admin/services");
}

export async function deleteService(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  const n = await db.business.count({ where: { services: { some: { id } } } });
  if (n > 0) return { ok: false, error: `${n} ${n === 1 ? "business uses" : "businesses use"} this service. Move them to another service or hide it instead.` };
  await db.service.delete({ where: { id } });
  revalidatePath("/admin/services");
  return { ok: true };
}
