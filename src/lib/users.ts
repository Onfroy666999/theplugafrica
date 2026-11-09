import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";
import { layout, sendEmail } from "./email";
import { CODE_MINUTES, CODE_TRIES, hashCode, makeCode } from "./signin-code";

// Visitor accounts (issue #82): sign in with a code sent by email, no passwords. Kept apart from team accounts:
// a different cookie and a different signing key, so a visitor's session can never open the admin, or the reverse.

export const USER_COOKIE = "plug_user";
/**
 * Not secret and holds nothing personal: it only tells the browser someone is signed in, so the header can say
 * "Account" and the hearts can load without asking the server on every page for every visitor.
 */
export const SIGNED_IN_HINT = "plug_signed_in";
const SESSION_DAYS = 30;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET is missing or too short.");
  return s;
}
const key = () => new TextEncoder().encode(`${secret()}:visitor-session`);

export async function startUserSession(userId: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setAudience("visitor")
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(key());
  const jar = await cookies();
  const base = { secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: SESSION_DAYS * 86_400 };
  jar.set(USER_COOKIE, token, { ...base, httpOnly: true });
  jar.set(SIGNED_IN_HINT, "1", { ...base, httpOnly: false });
}

export async function endUserSession() {
  const jar = await cookies();
  jar.delete(USER_COOKIE);
  jar.delete(SIGNED_IN_HINT);
}

/** The signed-in visitor, checked against the database (a deleted account signs out at once). Cached per request. */
export const getUser = cache(async () => {
  const token = (await cookies()).get(USER_COOKIE)?.value;
  if (!token) return null;
  let sub: string, iat: number;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"], audience: "visitor" });
    if (!payload.sub) return null;
    sub = payload.sub;
    iat = payload.iat ?? 0;
  } catch {
    return null;
  }
  const u = await db.user.findUnique({ where: { id: sub }, select: { id: true, email: true, name: true, phone: true, createdAt: true, sessionsSince: true } });
  // One second of slack: the token's time is in whole seconds.
  if (!u || iat * 1000 < u.sessionsSince.getTime() - 1000) return null;
  return { id: u.id, email: u.email, name: u.name, phone: u.phone, createdAt: u.createdAt };
});

export type Visitor = NonNullable<Awaited<ReturnType<typeof getUser>>>;

/** For account pages: not signed in → the sign-in page, which comes back here afterwards. */
export async function requireUser(next = "/account") {
  const u = await getUser();
  if (!u) redirect(`/account/sign-in?next=${encodeURIComponent(next)}`);
  return u;
}

/** Makes a new code for this email. Any earlier unused code stops working, so only the newest email counts. */
export async function issueCode(email: string) {
  const code = makeCode();
  const now = Date.now();
  await db.signInCode.updateMany({ where: { email, usedAt: null }, data: { usedAt: new Date(now) } });
  await db.signInCode.create({ data: { email, codeHash: await hashCode(secret(), email, code), expiresAt: new Date(now + CODE_MINUTES * 60_000) } });
  // Now and then, clear codes older than a day.
  if (Math.random() < 0.05) await db.signInCode.deleteMany({ where: { createdAt: { lt: new Date(now - 86_400_000) } } });
  return code;
}

export type CodeCheck = { ok: true } | { ok: false; reason: "expired" } | { ok: false; reason: "locked" } | { ok: false; reason: "wrong"; left: number };

/** Checks a code against the newest one for this email. Each try counts, right or wrong, before the comparison. */
export async function checkCode(email: string, code: string): Promise<CodeCheck> {
  const row = await db.signInCode.findFirst({ where: { email, usedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } });
  if (!row) return { ok: false, reason: "expired" };
  // Counted with a condition, so parallel guesses can't slip past the limit.
  const counted = await db.signInCode.updateMany({ where: { id: row.id, attempts: { lt: CODE_TRIES } }, data: { attempts: { increment: 1 } } });
  if (counted.count === 0) return { ok: false, reason: "locked" };
  if ((await hashCode(secret(), email, code)) !== row.codeHash) return { ok: false, reason: "wrong", left: CODE_TRIES - row.attempts - 1 };
  await db.signInCode.update({ where: { id: row.id }, data: { usedAt: new Date() } });
  return { ok: true };
}

export function sendCodeEmail(email: string, code: string) {
  return sendEmail({
    to: email,
    subject: `${code} is your The Plug Africa sign-in code`,
    ...layout({
      heading: "Your sign-in code",
      intro: `Enter this code to sign in to The Plug Africa. It works for ${CODE_MINUTES} minutes.`,
      rows: [["Code", code]],
      footer: "If you didn't ask to sign in, you can ignore this email: nobody can sign in without the code.",
    }),
  });
}
