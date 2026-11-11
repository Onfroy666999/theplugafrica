"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { publicWhere } from "@/lib/data";
import { db } from "@/lib/db";
import { emailEnabled } from "@/lib/email";
import { getMembership } from "@/lib/membership";
import { disableSubscription } from "@/lib/paystack";
import { hit, limitForm, screenForm, sha256 } from "@/lib/protect";
import { CODE_LENGTH, cleanCode, safeNext } from "@/lib/signin-code";
import { checkCode, endUserSession, getUser, issueCode, sendCodeEmail, startUserSession } from "@/lib/users";

// Visitor accounts (issue #82): sign in with an emailed code, profile, saved businesses, deleting the account.

const EmailSchema = z.string().trim().toLowerCase().max(160).pipe(z.email());

export type CodeRequest = { ok: true; email: string } | { ok: false; error: string };

/** Step 1: email a sign-in code. The account itself is created when the code is used. */
export async function requestSignInCode(fd: FormData): Promise<CodeRequest> {
  // "Send a new code" reuses the first step's check; Turnstile tokens work once, so it isn't asked again.
  // The per-visitor and per-email limits below still apply.
  const screened = await screenForm(fd, { turnstile: fd.get("resend") !== "1" });
  if (screened === "bot") return { ok: true, email: "" };
  if (screened) return { ok: false, error: screened };
  const parsed = EmailSchema.safeParse(fd.get("email"));
  if (!parsed.success) return { ok: false, error: "Please enter a valid email address." };
  const email = parsed.data;
  // Per visitor and per email address, so nobody can flood an inbox with codes.
  if (await limitForm("signin", 10)) return { ok: false, error: "You've asked for several codes in a short time. Please wait a while, then try again." };
  if ((await hit(`signin-email:${await sha256(email)}`, 60 * 60)) > 5)
    return { ok: false, error: "We've sent several codes to this address in the last hour. Use the newest one, or try again later." };
  const code = await issueCode(email);
  if (!emailEnabled()) {
    // On a developer's computer without email, the code goes to the terminal instead.
    if (process.env.NODE_ENV !== "production") {
      console.log(`[dev] sign-in code for ${email}: ${code}`);
      return { ok: true, email };
    }
    return { ok: false, error: "Signing in isn't available right now. Please try again later." };
  }
  if (!(await sendCodeEmail(email, code))) return { ok: false, error: "We couldn't send the code just now. Please try again in a minute." };
  return { ok: true, email };
}

export type SignInResult = { ok: true; next: string } | { ok: false; error: string };

/** Step 2: check the code, create the account if it's new, and sign in. */
export async function verifySignInCode(fd: FormData): Promise<SignInResult> {
  const email = EmailSchema.safeParse(fd.get("email"));
  const code = cleanCode(fd.get("code"));
  if (!email.success || code.length !== CODE_LENGTH) return { ok: false, error: `Enter the ${CODE_LENGTH}-digit code from the email.` };
  const r = await checkCode(email.data, code);
  if (!r.ok) {
    if (r.reason === "expired") return { ok: false, error: "That code has expired, or a newer one was sent. Ask for a new code." };
    if (r.reason === "locked" || (r.reason === "wrong" && r.left <= 0)) return { ok: false, error: "Too many wrong tries. Ask for a new code." };
    return { ok: false, error: `That code isn't right. ${r.left} ${r.left === 1 ? "try" : "tries"} left.` };
  }
  const now = new Date();
  const user = await db.user.upsert({ where: { email: email.data }, create: { email: email.data, lastSignInAt: now }, update: { lastSignInAt: now } });
  await startUserSession(user.id);
  return { ok: true, next: safeNext(fd.get("next")) };
}

export async function signOut() {
  await endUserSession();
  redirect("/");
}

const ProfileSchema = z.object({
  name: z.string().trim().max(80).optional().transform((v) => v || null),
  phone: z.string().trim().max(40).optional().transform((v) => v || null),
});

export async function updateProfile(fd: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  const u = await getUser();
  if (!u) return { ok: false, error: "Your session has ended. Please sign in again." };
  const parsed = ProfileSchema.safeParse({ name: fd.get("name") ?? undefined, phone: fd.get("phone") ?? undefined });
  if (!parsed.success) return { ok: false, error: "Please keep your name under 80 characters and your phone number under 40." };
  await db.user.update({ where: { id: u.id }, data: parsed.data });
  revalidatePath("/account");
  return { ok: true };
}

/**
 * Deletes the account, its saved businesses and its sign-in codes. Requests already sent stay with the team (they
 * are the record of an introduction), but are no longer linked to an account.
 */
export async function deleteAccount(fd: FormData): Promise<{ ok: false; error: string } | void> {
  const u = await getUser();
  if (!u) return { ok: false, error: "Your session has ended. Please sign in again." };
  if (String(fd.get("confirm") ?? "").trim().toLowerCase() !== "delete") return { ok: false, error: "Type DELETE to confirm." };
  // A running membership is cancelled with Paystack first, so nobody keeps being charged for a deleted account.
  const m = await getMembership(u.id);
  if (m && ["active", "past_due"].includes(m.status) && !m.subscriptionCode)
    return { ok: false, error: "Your membership is still being set up with Paystack, so your account can't be deleted yet. Please try again in a few minutes." };
  if (m && ["active", "past_due", "pending"].includes(m.status) && m.subscriptionCode) {
    if (!m.emailToken || !(await disableSubscription(m.subscriptionCode, m.emailToken)))
      return { ok: false, error: "We couldn't cancel your membership with Paystack just now, so your account wasn't deleted. Please try again in a minute." };
  }
  await db.user.delete({ where: { id: u.id } });
  await db.signInCode.deleteMany({ where: { email: u.email } });
  await endUserSession();
  redirect("/?account=deleted");
}

/** The slugs the visitor has saved, for the hearts. null = not signed in (the browser's hint is then cleared). */
export async function mySavedSlugs(): Promise<string[] | null> {
  const u = await getUser();
  if (!u) {
    await endUserSession();
    return null;
  }
  const rows = await db.savedBusiness.findMany({ where: { userId: u.id, business: publicWhere() }, select: { business: { select: { slug: true } } } });
  return rows.map((r) => r.business.slug);
}

export type SaveResult = { ok: true; saved: boolean } | { ok: false; signIn: true } | { ok: false; error: string };

/** The heart on a listing: saves or unsaves it. */
export async function toggleSaved(slug: string): Promise<SaveResult> {
  const u = await getUser();
  if (!u) return { ok: false, signIn: true };
  const b = await db.business.findFirst({ where: { slug: String(slug), ...publicWhere() }, select: { id: true } });
  if (!b) return { ok: false, error: "This business is no longer listed." };
  const key = { userId_businessId: { userId: u.id, businessId: b.id } };
  if (await db.savedBusiness.findUnique({ where: key })) {
    await db.savedBusiness.delete({ where: key });
    return { ok: true, saved: false };
  }
  await db.savedBusiness.create({ data: { userId: u.id, businessId: b.id } });
  return { ok: true, saved: true };
}
