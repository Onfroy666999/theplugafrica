"use server";

import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { endSession, requireAdmin, startSession } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { clear, hit, peek, visitorId } from "@/lib/protect";
import { onWorkers } from "@/lib/runtime";
import { isAllowedPhoto, storageEnabled, uploadToStorage } from "@/lib/storage";
import { CATS, getCat } from "@/lib/directory";
import { BUSINESS_STATUS, CONCIERGE_STATUS, CREDENTIAL_STATE, ENQUIRY_STATUS, WAITLIST_STATUS, CONTACT_STATUS, canBeVerified, find, values } from "@/lib/status";

/* ---------------- Sign in / out ---------------- */

// Sign-in throttle: 5 failed attempts per email + visitor per 15 minutes, counted in the database so every
// Cloudflare isolate shares it (issue #7; an in-memory Map reset per isolate).
const LOGIN_WINDOW_S = 15 * 60;
// Compared against when an email is unknown, so timing doesn't reveal which emails exist. A fixed hash of a random,
// discarded string: hashing one at runtime cost a second slow bcrypt run in every new Worker instance (issue #65).
const DUMMY_HASH = "$2b$12$maf4o8ehDUChsltPClrNCOw/UF/hbJTA.ucl2JXvmNRl7J5APlC4u";

/** Signs in. Returns { ok: true } and the browser then opens the admin, or an error to show (issue #65). */
export async function login(_: unknown, fd: FormData): Promise<{ ok: true } | { ok?: false; error: string; email: string }> {
  const email = String(fd.get("email") ?? "").toLowerCase().trim();
  const password = String(fd.get("password") ?? "");
  const key = `login:${email}:${await visitorId()}`;
  if ((await peek(key)) >= 5) return { error: "Too many attempts. Wait 15 minutes and try again.", email };

  const admin = email ? await db.admin.findUnique({ where: { email } }) : null;
  const ok = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
  if (!admin || !ok) {
    await hit(key, LOGIN_WINDOW_S);
    return { error: "That email and password don't match.", email };
  }
  await clear(key);
  await db.admin.update({ where: { id: admin.id }, data: { lastSignInAt: new Date() } });
  await audit(admin, "auth.sign_in", "Signed in");
  await startSession(admin);
  return { ok: true };
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
  /** Waitlist entry this business was created from (issue #67); marked Listed once the business exists. */
  fromWaitlist: z.string().max(40).optional(),
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

/** Readable names for the fields the activity log reports as changed. */
const BUSINESS_FIELDS: Record<string, string> = {
  name: "name", slug: "web address", category: "category", kind: "kind", city: "city", area: "area", blurb: "summary", about: "description",
  price: "price", responds: "response time", languages: "languages", phone: "phone", whatsapp: "WhatsApp", email: "email", status: "status",
};
const statusLabel = (v: string) => find(BUSINESS_STATUS, v).label;

export async function saveBusiness(fd: FormData): Promise<SaveResult> {
  const admin = await requireAdmin("edit");
  const parsed = BusinessSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue.message, field: String(issue.path[0] ?? "") };
  }
  const { id, credentials, images, services: serviceIds, slug: rawSlug, fromWaitlist, ...d } = parsed.data;
  const slug = slugify(rawSlug || d.name);
  if (!slug) return { ok: false, error: "Add a web address (slug)", field: "slug" };
  const clash = await db.business.findUnique({ where: { slug }, select: { id: true } });
  if (clash && clash.id !== id) return { ok: false, error: `Another business already uses the address /listing/${slug}`, field: "slug" };
  if (d.status === "verified" && !canBeVerified(credentials))
    return { ok: false, error: "Every credential must be Checked before a business can be marked Verified.", field: "status" };

  // Services must belong to the business's category; at least one is required when the category has services.
  const valid = await db.service.findMany({ where: { id: { in: serviceIds }, category: d.category }, select: { id: true } });
  if (valid.length !== serviceIds.length) return { ok: false, error: "Some chosen services belong to another category. Re-check the services.", field: "services" };
  if (!valid.length && (await db.service.count({ where: { category: d.category } })) > 0)
    return { ok: false, error: "Choose at least one service so visitors can find this business.", field: "services" };

  const before = id
    ? await db.business.findUnique({ where: { id }, include: { credentials: { orderBy: { position: "asc" } }, services: { select: { id: true } } } })
    : null;
  const data = { ...d, slug, images: JSON.stringify(images), services: { set: valid } };
  const saved = id
    ? await db.business.update({ where: { id }, data })
    : await db.business.create({ data: { ...d, slug, images: JSON.stringify(images), services: { connect: valid } } });
  await db.credential.deleteMany({ where: { businessId: saved.id } });
  if (credentials.length) await db.credential.createMany({ data: credentials.map((c, i) => ({ ...c, businessId: saved.id, position: i })) });

  const target = { type: "business", id: saved.id };
  if (!before) {
    await audit(admin, "business.create", `Added ${saved.name} (${statusLabel(saved.status)})${fromWaitlist ? " from the waitlist" : ""}`, target);
    if (fromWaitlist) {
      const w = await db.waitlistEntry.updateMany({ where: { id: fromWaitlist, status: { not: "onboarded" } }, data: { status: "onboarded" } });
      if (w.count) await audit(admin, "inbox.status", `Waitlist: ${saved.name} marked Listed`, { type: "waitlist", id: fromWaitlist });
      revalidatePath("/admin/waitlist");
    }
  }
  else {
    const after: Record<string, unknown> = { ...d, slug };
    const changed = Object.entries(BUSINESS_FIELDS)
      .filter(([k]) => String((before as Record<string, unknown>)[k] ?? "") !== String(after[k] ?? ""))
      .map(([k, label]) => (k === "status" ? `status (${statusLabel(before.status)} → ${statusLabel(d.status)})` : label));
    if (before.images !== JSON.stringify(images)) changed.push("photos");
    if (JSON.stringify(before.credentials.map((c) => [c.label, c.state])) !== JSON.stringify(credentials.map((c) => [c.label, c.state]))) changed.push("credentials");
    if (before.services.map((x) => x.id).sort().join() !== valid.map((x) => x.id).sort().join()) changed.push("services");
    if (changed.length) await audit(admin, "business.update", `Edited ${saved.name}: ${changed.join(", ")}`, target);
  }

  revalidatePath("/admin/businesses");
  return { ok: true, id: saved.id };
}

export async function setBusinessStatus(id: string, status: string) {
  const admin = await requireAdmin("edit");
  if (!z.enum(values(BUSINESS_STATUS)).safeParse(status).success) return { ok: false as const, error: "Unknown status." };
  if (status === "verified") {
    const creds = await db.credential.findMany({ where: { businessId: id }, select: { state: true } });
    if (!canBeVerified(creds)) return { ok: false as const, error: "Check every credential before marking Verified." };
  }
  const before = await db.business.findUnique({ where: { id }, select: { name: true, status: true } });
  if (!before) return { ok: false as const, error: "This business no longer exists." };
  await db.business.update({ where: { id }, data: { status } });
  if (before && before.status !== status)
    await audit(admin, "business.status", `Changed ${before.name} from ${statusLabel(before.status)} to ${statusLabel(status)}`, { type: "business", id });
  revalidatePath("/admin/businesses");
  return { ok: true as const };
}

export async function deleteBusiness(id: string) {
  const admin = await requireAdmin("delete");
  const b = await db.business.delete({ where: { id }, select: { name: true } });
  await audit(admin, "business.delete", `Deleted ${b.name}`, { type: "business", id });
  revalidatePath("/admin/businesses");
  redirect("/admin/businesses");
}

/* ---------------- Image upload ---------------- */

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
  const admin = await requireAdmin("edit");
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
    let paths: string[];
    if (storageEnabled()) paths = await Promise.all(ready.map((r) => uploadToStorage(r.name, r.bytes, r.type)));
    else {
      const dir = path.join(process.cwd(), "public", "uploads");
      await mkdir(dir, { recursive: true });
      for (const r of ready) await writeFile(path.join(dir, r.name), Buffer.from(r.bytes));
      paths = ready.map((r) => `/uploads/${r.name}`);
    }
    await audit(admin, "photos.upload", `Uploaded ${paths.length} ${paths.length === 1 ? "photo" : "photos"}`);
    return { ok: true, paths };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "The upload didn't go through. Try again in a moment." };
  }
}

/* ---------------- Inboxes ---------------- */

const INBOX = {
  enquiry: { statuses: ENQUIRY_STATUS, path: "/admin/enquiries", label: "Enquiry" },
  concierge: { statuses: CONCIERGE_STATUS, path: "/admin/concierge", label: "Concierge request" },
  waitlist: { statuses: WAITLIST_STATUS, path: "/admin/waitlist", label: "Waitlist entry" },
  contact: { statuses: CONTACT_STATUS, path: "/admin/messages", label: "Message" },
} as const;
export type InboxKind = keyof typeof INBOX;

/** Reference and status of an inbox record, for the activity log. */
function inboxRecord(kind: InboxKind, id: string) {
  const q = { where: { id }, select: { ref: true, status: true } };
  if (kind === "enquiry") return db.enquiry.findUnique(q);
  if (kind === "concierge") return db.conciergeRequest.findUnique(q);
  if (kind === "waitlist") return db.waitlistEntry.findUnique(q);
  return db.contactMessage.findUnique(q);
}

export async function updateInbox(kind: InboxKind, id: string, patch: { status?: string; notes?: string }) {
  const admin = await requireAdmin("edit");
  if (!Object.hasOwn(INBOX, kind)) return { ok: false as const, error: "Unknown inbox." };
  const cfg = INBOX[kind];
  const before = await inboxRecord(kind, id);
  if (!before) return { ok: false as const, error: "This entry was deleted." };
  const data: { status?: string; notes?: string | null } = {};
  if (patch.status !== undefined) {
    const s = z.enum(values(cfg.statuses)).safeParse(patch.status);
    if (!s.success) return { ok: false as const, error: "Unknown status." };
    data.status = s.data;
  }
  if (patch.notes !== undefined) data.notes = patch.notes.trim().slice(0, 4000) || null;
  if (kind === "enquiry") await db.enquiry.update({ where: { id }, data });
  if (kind === "concierge") await db.conciergeRequest.update({ where: { id }, data });
  if (kind === "waitlist") await db.waitlistEntry.update({ where: { id }, data });
  if (kind === "contact") await db.contactMessage.update({ where: { id }, data });
  const label = (v: string) => cfg.statuses.find((x) => x.value === v)?.label ?? v;
  const target = { type: kind, id };
  if (before && data.status && data.status !== before.status)
    await audit(admin, "inbox.status", `${cfg.label} ${before.ref}: ${label(before.status)} → ${label(data.status)}`, target);
  if (before && patch.notes !== undefined) await audit(admin, "inbox.notes", `Edited notes on ${cfg.label.toLowerCase()} ${before.ref}`, target);
  revalidatePath(cfg.path);
  revalidatePath("/admin");
}

/** Owners can delete an inbox entry, for spam and tests (issue #67). */
export async function deleteInboxItem(kind: InboxKind, id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireAdmin("delete");
  if (!Object.hasOwn(INBOX, kind)) return { ok: false, error: "Unknown inbox." };
  const cfg = INBOX[kind];
  const before = await inboxRecord(kind, id);
  if (!before) return { ok: true };
  if (kind === "enquiry") await db.enquiry.delete({ where: { id } });
  if (kind === "concierge") {
    // A recorded deal is the record of fees owed or paid (#84): it keeps its request.
    if (await db.conciergeDeal.count({ where: { requestId: id } })) return { ok: false, error: "This request has a recorded deal with fees, so it can't be deleted." };
    await db.conciergeRequest.delete({ where: { id } });
  }
  if (kind === "waitlist") await db.waitlistEntry.delete({ where: { id } });
  if (kind === "contact") await db.contactMessage.delete({ where: { id } });
  await audit(admin, "inbox.delete", `Deleted ${cfg.label.toLowerCase()} ${before.ref}`, { type: kind, id });
  revalidatePath(cfg.path);
  revalidatePath("/admin");
  return { ok: true };
}

/** Assigns a concierge request to a team member, or clears it with an empty id (issue #67). */
export async function assignConcierge(id: string, adminId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireAdmin("edit");
  const to = adminId ? await db.admin.findUnique({ where: { id: adminId }, select: { id: true, name: true } }) : null;
  if (adminId && !to) return { ok: false, error: "That team member no longer exists." };
  if (!(await db.conciergeRequest.findUnique({ where: { id }, select: { id: true } }))) return { ok: false, error: "This request was deleted." };
  const r = await db.conciergeRequest.update({ where: { id }, data: { assignedToId: to?.id ?? null }, select: { ref: true } });
  await audit(admin, "inbox.assign", to ? `Assigned concierge request ${r.ref} to ${to.name}` : `Unassigned concierge request ${r.ref}`, { type: "concierge", id });
  revalidatePath("/admin/concierge");
  return { ok: true };
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

const catName = (k: string) => getCat(k)?.name ?? k;

export async function saveService(fd: FormData): Promise<SaveResult> {
  const admin = await requireAdmin("edit");
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
    await audit(admin, "service.update", `Edited service ${d.name} in ${catName(d.category)}`, { type: "service", id });
    revalidatePath("/admin/services");
    return { ok: true, id };
  }
  const last = await db.service.findFirst({ where: { category: d.category }, orderBy: { position: "desc" }, select: { position: true } });
  const created = await db.service.create({ data: { ...d, slug, visible: visible === "true", position: (last?.position ?? -1) + 1 } });
  await audit(admin, "service.create", `Added service ${d.name} in ${catName(d.category)}`, { type: "service", id: created.id });
  revalidatePath("/admin/services");
  return { ok: true, id: created.id };
}

export async function setServiceVisible(id: string, visible: boolean) {
  const admin = await requireAdmin("edit");
  const s = await db.service.update({ where: { id }, data: { visible }, select: { name: true, category: true } });
  await audit(admin, "service.visible", `${visible ? "Showed" : "Hid"} service ${s.name} in ${catName(s.category)}`, { type: "service", id });
  revalidatePath("/admin/services");
}

/** Swap a service with its neighbour above (-1) or below (+1) within its category. */
export async function moveService(id: string, dir: -1 | 1) {
  const admin = await requireAdmin("edit");
  const svc = await db.service.findUnique({ where: { id } });
  if (!svc) return;
  const list = await db.service.findMany({ where: { category: svc.category }, orderBy: [{ position: "asc" }, { name: "asc" }], select: { id: true } });
  const i = list.findIndex((s) => s.id === id);
  const j = i + dir;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await db.$transaction(list.map((s, pos) => db.service.update({ where: { id: s.id }, data: { position: pos } })));
  await audit(admin, "service.move", `Moved service ${svc.name} ${dir < 0 ? "up" : "down"} in ${catName(svc.category)}`, { type: "service", id });
  revalidatePath("/admin/services");
}

export async function deleteService(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireAdmin("delete");
  const n = await db.business.count({ where: { services: { some: { id } } } });
  if (n > 0) return { ok: false, error: `${n} ${n === 1 ? "business uses" : "businesses use"} this service. Move them to another service or hide it instead.` };
  const s = await db.service.delete({ where: { id }, select: { name: true, category: true } });
  await audit(admin, "service.delete", `Deleted service ${s.name} from ${catName(s.category)}`, { type: "service", id });
  revalidatePath("/admin/services");
  return { ok: true };
}
