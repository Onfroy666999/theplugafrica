import "server-only";
import { db } from "./db";
import { layout, sendEmail } from "./email";
import { aRole } from "./roles";
import { SITE_URL } from "./site";

// Single-use links to join the team or set a new password (issue #18). The link carries a random token;
// only its SHA-256 hash is stored, so a database leak doesn't reveal working links.

export const INVITE_DAYS = 7;

export async function hashToken(token: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Creates a link, replacing any open link for the same email and purpose. Returns the URL to share. */
export async function createInvite(i: { purpose: "invite" | "reset"; email: string; name: string; role: string; invitedById: string }) {
  const token = newToken();
  await db.invite.deleteMany({ where: { email: i.email, purpose: i.purpose, usedAt: null } });
  await db.invite.create({
    data: { ...i, tokenHash: await hashToken(token), expiresAt: new Date(Date.now() + INVITE_DAYS * 86_400_000) },
  });
  return `${SITE_URL}/admin/invite/${token}`;
}

/** The open invite for a token, or null if it's unknown, used or expired. */
export async function findInvite(token: string) {
  if (!token || token.length > 100) return null;
  const inv = await db.invite.findUnique({ where: { tokenHash: await hashToken(token) } });
  return inv && !inv.usedAt && inv.expiresAt > new Date() ? inv : null;
}

/** Emails the link when email is set up (issue #6). Returns whether it was sent. */
export function emailInvite(i: { purpose: "invite" | "reset"; email: string; name: string; role: string; url: string; from: string }) {
  const join = i.purpose === "invite";
  return sendEmail({
    to: i.email,
    subject: join ? "You're invited to The Plug Africa admin" : "Set a new password for The Plug Africa admin",
    ...layout({
      heading: join ? "You're invited to the team" : "Set a new password",
      intro: join
        ? `Hi ${i.name}, ${i.from} has invited you to The Plug Africa admin as ${aRole(i.role)}. Choose your password to get started.`
        : `Hi ${i.name}, ${i.from} has sent you a link to set a new password for The Plug Africa admin.`,
      button: { label: join ? "Set up your account" : "Set a new password", href: i.url },
      footer: `The link works once and expires in ${INVITE_DAYS} days. If you weren't expecting this, ignore this email.`,
    }),
  });
}
