"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, startSession } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { emailEnabled } from "@/lib/email";
import { createInvite, emailInvite, findInvite } from "@/lib/invites";
import { aRole, isRole, roleLabel, type Role } from "@/lib/roles";

// Team accounts (issue #18): owners invite people, change roles, send password links and remove accounts.

export type LinkResult = { ok: true; url: string; emailed: boolean } | { ok: false; error: string };
type Result = { ok: true } | { ok: false; error: string };

const InviteSchema = z.object({
  name: z.string().trim().min(2, "Add their name").max(120),
  email: z.string().trim().toLowerCase().max(160).pipe(z.email("Check the email address")),
  role: z.enum(["owner", "editor", "viewer"]),
});

export async function inviteMember(fd: FormData): Promise<LinkResult> {
  const me = await requireAdmin("team");
  const p = InviteSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const { name, email, role } = p.data;
  if (await db.admin.findUnique({ where: { email }, select: { id: true } }))
    return { ok: false, error: "That email already has an account. Use “Password link” on their row if they can't sign in." };
  const url = await createInvite({ purpose: "invite", email, name, role, invitedById: me.id });
  const emailed = emailEnabled() && (await emailInvite({ purpose: "invite", email, name, role, url, from: me.name }));
  await audit(me, "team.invite", `Invited ${name} (${email}) as ${aRole(role)}`);
  revalidatePath("/admin/team");
  return { ok: true, url, emailed };
}

export async function cancelInvite(id: string): Promise<Result> {
  const me = await requireAdmin("team");
  const inv = await db.invite.findUnique({ where: { id } });
  if (!inv || inv.usedAt) return { ok: false, error: "This invitation was already used or cancelled." };
  await db.invite.delete({ where: { id } });
  await audit(me, "team.invite_cancel", `Cancelled the ${inv.purpose === "reset" ? "password link" : "invitation"} for ${inv.name} (${inv.email})`);
  revalidatePath("/admin/team");
  return { ok: true };
}

/** A link for an existing member to set a new password (there's no self-service reset, on purpose). */
export async function passwordLink(adminId: string): Promise<LinkResult> {
  const me = await requireAdmin("team");
  const a = await db.admin.findUnique({ where: { id: adminId } });
  if (!a) return { ok: false, error: "That account no longer exists." };
  const url = await createInvite({ purpose: "reset", email: a.email, name: a.name, role: a.role, invitedById: me.id });
  const emailed = emailEnabled() && (await emailInvite({ purpose: "reset", email: a.email, name: a.name, role: a.role, url, from: me.name }));
  await audit(me, "team.reset_link", `Created a password link for ${a.name}`, { type: "admin", id: a.id });
  revalidatePath("/admin/team");
  return { ok: true, url, emailed };
}

/** True when someone other than `adminId` is an owner, so the team is never left without one. */
const otherOwnerExists = async (adminId: string) => (await db.admin.count({ where: { role: "owner", id: { not: adminId } } })) > 0;

export async function changeRole(adminId: string, role: string): Promise<Result> {
  const me = await requireAdmin("team");
  if (!isRole(role)) return { ok: false, error: "Choose a role." };
  if (adminId === me.id) return { ok: false, error: "You can't change your own role. Ask another owner." };
  const a = await db.admin.findUnique({ where: { id: adminId } });
  if (!a) return { ok: false, error: "That account no longer exists." };
  if (a.role === role) return { ok: true };
  if (a.role === "owner" && !(await otherOwnerExists(a.id))) return { ok: false, error: "The team needs at least one owner." };
  await db.admin.update({ where: { id: a.id }, data: { role } });
  await audit(me, "team.role", `Changed ${a.name} from ${roleLabel(a.role).toLowerCase()} to ${roleLabel(role).toLowerCase()}`, { type: "admin", id: a.id });
  revalidatePath("/admin/team");
  return { ok: true };
}

export async function removeMember(adminId: string): Promise<Result> {
  const me = await requireAdmin("team");
  if (adminId === me.id) return { ok: false, error: "You can't remove your own account. Ask another owner." };
  const a = await db.admin.findUnique({ where: { id: adminId } });
  if (!a) return { ok: true };
  if (a.role === "owner" && !(await otherOwnerExists(a.id))) return { ok: false, error: "The team needs at least one owner." };
  await db.$transaction([db.invite.deleteMany({ where: { email: a.email, usedAt: null } }), db.admin.delete({ where: { id: a.id } })]);
  await audit(me, "team.remove", `Removed ${a.name} (${a.email}, ${roleLabel(a.role).toLowerCase()})`, { type: "admin", id: a.id });
  revalidatePath("/admin/team");
  return { ok: true };
}

/* ---------------- Accepting a link (no session yet) ---------------- */

const AcceptSchema = z
  .object({
    name: z.string().trim().min(2, "Add your name").max(120).optional(),
    password: z.string().min(12, "Use at least 12 characters for your password.").max(200),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "The two passwords don't match." });

export async function acceptInvite(token: string, _: unknown, fd: FormData): Promise<{ error: string } | undefined> {
  const inv = await findInvite(token);
  if (!inv) return { error: "This link has expired or was already used. Ask an owner for a new one." };
  const p = AcceptSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: p.error.issues[0].message };
  const passwordHash = await bcrypt.hash(p.data.password, 12);

  // Claim the link first, so it can't be used twice even if two requests race.
  const claimed = await db.invite.updateMany({ where: { id: inv.id, usedAt: null }, data: { usedAt: new Date() } });
  if (!claimed.count) return { error: "This link was already used. Ask an owner for a new one." };

  let admin: { id: string; name: string };
  if (inv.purpose === "invite") {
    if (await db.admin.findUnique({ where: { email: inv.email }, select: { id: true } }))
      return { error: "This email already has an account. Sign in, or ask an owner for a password link." };
    admin = await db.admin.create({
      data: { email: inv.email, name: p.data.name || inv.name, role: isRole(inv.role) ? (inv.role as Role) : "viewer", passwordHash },
      select: { id: true, name: true },
    });
    await audit(admin, "team.join", `Joined the team as ${aRole(inv.role)}`, { type: "admin", id: admin.id });
  } else {
    const found = await db.admin.findUnique({ where: { email: inv.email }, select: { id: true, name: true } });
    if (!found) return { error: "That account no longer exists." };
    // A new password signs out every other session.
    await db.admin.update({ where: { id: found.id }, data: { passwordHash, sessionsSince: new Date() } });
    admin = found;
    await audit(admin, "account.password", "Set a new password", { type: "admin", id: admin.id });
  }
  await db.admin.update({ where: { id: admin.id }, data: { lastSignInAt: new Date() } });
  await startSession(admin);
  redirect("/admin");
}
