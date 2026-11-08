"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { summariseRatings } from "@/lib/validation";

// Review moderation (issue #14). Editors and owners approve, reject and respond; only owners delete.

type Result = { ok: true } | { ok: false; error: string };

/** Recalculates a business's rating and count from its approved reviews. */
async function refreshRating(businessId: string) {
  const approved = await db.review.findMany({ where: { businessId, status: "approved" }, select: { rating: true } });
  const b = await db.business.update({ where: { id: businessId }, data: summariseRatings(approved.map((r) => r.rating)), select: { slug: true } });
  revalidatePath(`/listing/${b.slug}`);
  revalidatePath("/admin/reviews");
}

export async function moderateReview(id: string, status: "approved" | "rejected"): Promise<Result> {
  const admin = await requireAdmin("edit");
  if (status !== "approved" && status !== "rejected") return { ok: false, error: "Choose approve or reject." };
  const r = await db.review.findUnique({ where: { id }, include: { business: { select: { name: true } } } });
  if (!r) return { ok: false, error: "This review was deleted." };
  await db.review.update({ where: { id }, data: { status, moderatedAt: new Date() } });
  await refreshRating(r.businessId);
  await audit(admin, status === "approved" ? "review.approve" : "review.reject", `${status === "approved" ? "Approved" : "Rejected"} ${r.name}'s ${r.rating}-star review of ${r.business.name}`, { type: "review", id });
  return { ok: true };
}

/** A public reply from The Plug under the review; an empty reply removes it. */
export async function respondToReview(id: string, text: string): Promise<Result> {
  const admin = await requireAdmin("edit");
  const p = z.string().trim().max(1000, "Keep the reply under 1,000 characters.").safeParse(text);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const r = await db.review.findUnique({ where: { id }, include: { business: { select: { name: true, slug: true } } } });
  if (!r) return { ok: false, error: "This review was deleted." };
  await db.review.update({ where: { id }, data: { response: p.data || null, respondedAt: p.data ? new Date() : null } });
  await audit(admin, "review.respond", `${p.data ? "Replied to" : "Removed the reply to"} ${r.name}'s review of ${r.business.name}`, { type: "review", id });
  revalidatePath(`/listing/${r.business.slug}`);
  revalidatePath("/admin/reviews");
  return { ok: true };
}

export async function deleteReview(id: string): Promise<Result> {
  const admin = await requireAdmin("delete");
  const r = await db.review.findUnique({ where: { id }, include: { business: { select: { name: true } } } });
  if (!r) return { ok: true };
  await db.review.delete({ where: { id } });
  await refreshRating(r.businessId);
  await audit(admin, "review.delete", `Deleted ${r.name}'s ${r.rating}-star review of ${r.business.name}`, { type: "review", id });
  return { ok: true };
}
