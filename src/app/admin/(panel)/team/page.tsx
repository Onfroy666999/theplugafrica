import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { emailEnabled } from "@/lib/email";
import { INVITE_DAYS } from "@/lib/invites";
import { PageHeader, fmtDate } from "../ui";
import { TeamManager } from "./TeamManager";

export default async function Team() {
  const me = await requireAdmin("team");
  const [members, invites] = await Promise.all([
    db.admin.findMany({ orderBy: [{ createdAt: "asc" }], select: { id: true, name: true, email: true, role: true, lastSignInAt: true } }),
    db.invite.findMany({ where: { usedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <>
      <PageHeader title="Team" sub="Who can use the admin, and what each person can do." />
      <TeamManager
        meId={me.id}
        emailOn={emailEnabled()}
        inviteDays={INVITE_DAYS}
        members={members.map((m) => ({ ...m, lastSignIn: m.lastSignInAt ? fmtDate(m.lastSignInAt) : null, lastSignInAt: undefined }))}
        invites={invites.map((i) => ({ id: i.id, name: i.name, email: i.email, role: i.role, purpose: i.purpose, expires: fmtDate(i.expiresAt) }))}
      />
    </>
  );
}
