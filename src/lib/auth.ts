import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
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

/** The signed-in admin, re-checked against the database (a deleted account loses access immediately). */
export async function getAdmin() {
  const s = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!s) return null;
  return db.admin.findUnique({ where: { id: s.sub }, select: { id: true, name: true, email: true } });
}

/** Call at the top of every admin page and admin server action. */
export async function requireAdmin() {
  const a = await getAdmin();
  if (!a) redirect("/admin/login");
  return a;
}
