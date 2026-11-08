"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { EMERGENCY_SERVICES, EmergencySchema } from "@/lib/emergency";

// Emergency numbers (issue #11). Editors and owners add and check them; only owners delete.

type Result = { ok: true; id: string } | { ok: false; error: string; field?: string };

const where = (city: string | null) => city ?? "all of Ghana";
const serviceLabel = (v: string) => EMERGENCY_SERVICES.find((s) => s.value === v)?.label ?? v;
const refresh = () => {
  revalidatePath("/emergency");
  revalidatePath("/admin/emergency");
};

export async function saveEmergency(fd: FormData): Promise<Result> {
  const admin = await requireAdmin("edit");
  const p = EmergencySchema.safeParse(Object.fromEntries(fd));
  if (!p.success) {
    const issue = p.error.issues[0];
    return { ok: false, error: issue.message, field: String(issue.path[0] ?? "") };
  }
  const { id, verified, city, ...d } = p.data;
  const before = id ? await db.emergencyContact.findUnique({ where: { id } }) : null;
  if (id && !before) return { ok: false, error: "This number was deleted. Add it again." };
  // Keep the verification date unless the number itself changed; a changed number needs checking again.
  const numberChanged = !before || before.phone !== d.phone || before.altPhone !== d.altPhone;
  const verifiedAt = verified === "true" ? (before?.verifiedAt && !numberChanged ? before.verifiedAt : new Date()) : null;
  const data = { ...d, city: city || null, verifiedAt };
  const saved = before ? await db.emergencyContact.update({ where: { id: before.id }, data }) : await db.emergencyContact.create({ data });
  const label = `${serviceLabel(saved.service)}: ${saved.name} (${where(saved.city)})`;
  await audit(admin, before ? "emergency.update" : "emergency.create", `${before ? "Edited" : "Added"} ${label}${verifiedAt ? ", verified" : ", not verified yet"}`, { type: "emergency", id: saved.id });
  refresh();
  return { ok: true, id: saved.id };
}

/** Records that someone checked a number again today. */
export async function confirmEmergency(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireAdmin("edit");
  const c = await db.emergencyContact.findUnique({ where: { id } });
  if (!c) return { ok: false, error: "This number was deleted." };
  if (!c.source) return { ok: false, error: "Add where you confirmed the number (Edit), then mark it verified." };
  await db.emergencyContact.update({ where: { id }, data: { verifiedAt: new Date() } });
  await audit(admin, "emergency.verify", `Checked ${serviceLabel(c.service)}: ${c.name} (${where(c.city)}) again`, { type: "emergency", id });
  refresh();
  return { ok: true };
}

export async function deleteEmergency(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireAdmin("delete");
  const c = await db.emergencyContact.findUnique({ where: { id } });
  if (!c) return { ok: true };
  await db.emergencyContact.delete({ where: { id } });
  await audit(admin, "emergency.delete", `Deleted ${serviceLabel(c.service)}: ${c.name} (${where(c.city)})`, { type: "emergency", id });
  refresh();
  return { ok: true };
}
