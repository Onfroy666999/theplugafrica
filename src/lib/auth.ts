import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";
import { can, type Permission } from "./roles";
import { SESSION_COOKIE, SESSION_DAYS, signSession, verifySession } from "./session";

export async function startSession(admin: { id: string; name: string }) {
  const token = await signSession({ sub: admin.id, name: admin.name });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/**
 * The signed-in team member, re-checked against the database on every request: a removed account or a changed
 * role takes effect immediately, and sessions signed before a password change stop working. Cached per request.
 */
export const getAdmin = cache(async () => {
  const s = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!s) return null;
  const a = await db.admin.findUnique({ where: { id: s.sub }, select: { id: true, name: true, email: true, role: true, sessionsSince: true } });
  // One second of slack: the JWT time is in whole seconds.
  if (!a || s.iat * 1000 < a.sessionsSince.getTime() - 1000) return null;
  return { id: a.id, name: a.name, email: a.email, role: a.role };
});

export type AdminUser = NonNullable<Awaited<ReturnType<typeof getAdmin>>>;

/**
 * Call at the top of every admin page and admin server action. With a permission, team members whose role
 * doesn't allow it are sent back to the dashboard (the screens hide those controls, so only crafted requests get here).
 */
export async function requireAdmin(permission?: Permission) {
  const a = await getAdmin();
  if (!a) redirect("/admin/login");
  if (permission && !can(a.role, permission)) redirect("/admin?denied=1");
  return a;
}
