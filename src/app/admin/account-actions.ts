"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, startSession } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";

// My account (issue #67): every team member can change their own name and password.

type Result = { ok: true } | { ok: false; error: string };

export async function updateMyName(fd: FormData): Promise<Result> {
  const me = await requireAdmin();
  const p = z.string().trim().min(2, "Add your name").max(120).safeParse(fd.get("name"));
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  if (p.data === me.name) return { ok: true };
  await db.admin.update({ where: { id: me.id }, data: { name: p.data } });
  await audit({ id: me.id, name: p.data }, "account.name", `Changed their name from ${me.name} to ${p.data}`, { type: "admin", id: me.id });
  revalidatePath("/admin", "layout");
  return { ok: true };
}

const PasswordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password."),
    password: z.string().min(12, "Use at least 12 characters for your new password.").max(200),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "The two new passwords don't match." })
  .refine((d) => d.password !== d.current, { message: "Choose a password you haven't used here before." });

/** Changes your password after checking the current one. Every other session is signed out; this one stays. */
export async function changeMyPassword(fd: FormData): Promise<Result> {
  const me = await requireAdmin();
  const p = PasswordSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const row = await db.admin.findUnique({ where: { id: me.id }, select: { passwordHash: true } });
  if (!row || !(await bcrypt.compare(p.data.current, row.passwordHash))) return { ok: false, error: "Your current password isn't right." };
  await db.admin.update({ where: { id: me.id }, data: { passwordHash: await bcrypt.hash(p.data.password, 12), sessionsSince: new Date() } });
  await startSession(me);
  await audit(me, "account.password", "Changed their password", { type: "admin", id: me.id });
  return { ok: true };
}
