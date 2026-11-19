"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSlot } from "@/lib/site-images";
import { isAllowedPhoto } from "@/lib/storage";

// Admin › Site photos (issue #112): change or reset the photos on the home hero, category headers and page headers.

const Schema = z.object({
  key: z.string().max(60),
  url: z.string().trim().min(1, "Choose a photo").max(300).refine(isAllowedPhoto, "Choose a photo from the library or upload one"),
  alt: z.string().trim().max(200).default(""),
  caption: z.string().trim().max(80).default(""),
});

type Result = { ok: true } | { ok: false; error: string };

export async function saveSiteImage(fd: FormData): Promise<Result> {
  const admin = await requireAdmin("edit");
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { key, url, alt, caption } = parsed.data;
  const s = getSlot(key);
  if (!s) return { ok: false, error: "That photo isn't one of the site's photos." };
  const data = { url, alt, caption: s.hasCaption ? caption : "" };
  await db.siteImage.upsert({ where: { key }, create: { key, ...data }, update: data });
  await audit(admin, "site_photo.update", `Changed the site photo “${groupLabel(s.group)}: ${s.label}”`, { type: "site_photo", id: key });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function resetSiteImage(key: string): Promise<Result> {
  const admin = await requireAdmin("edit");
  const s = getSlot(key);
  if (!s) return { ok: false, error: "That photo isn't one of the site's photos." };
  await db.siteImage.deleteMany({ where: { key } });
  await audit(admin, "site_photo.reset", `Put back the original site photo “${groupLabel(s.group)}: ${s.label}”`, { type: "site_photo", id: key });
  revalidatePath("/", "layout");
  return { ok: true };
}

const groupLabel = (g: string) => ({ hero: "Hero", category: "Category header", page: "Page header", home: "Home", emergency: "Emergency tile" })[g] ?? g;
