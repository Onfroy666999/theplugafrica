import "server-only";
import { db } from "./db";

// The admin activity log (issue #18): who changed what, shown to owners at /admin/activity.
// Visitors' own submissions aren't logged here; they're already in the inboxes with timestamps.

export type AuditAction =
  | "auth.sign_in"
  | "business.create"
  | "business.update"
  | "business.status"
  | "business.delete"
  | "photos.upload"
  | "inbox.status"
  | "inbox.notes"
  | "inbox.assign"
  | "inbox.delete"
  | "inbox.export"
  | "service.create"
  | "service.update"
  | "service.visible"
  | "service.move"
  | "service.delete"
  | "team.invite"
  | "team.invite_cancel"
  | "team.reset_link"
  | "team.role"
  | "team.remove"
  | "team.join"
  | "account.password"
  | "account.name"
  | "emergency.create"
  | "emergency.update"
  | "emergency.verify"
  | "emergency.delete";

/** Records one entry. Never throws: a logging hiccup must not undo the change it describes. */
export async function audit(actor: { id: string; name: string }, action: AuditAction, summary: string, target?: { type: string; id: string }) {
  try {
    await db.auditLog.create({
      data: { adminId: actor.id, actorName: actor.name, action, summary: summary.slice(0, 500), targetType: target?.type, targetId: target?.id },
    });
  } catch (e) {
    console.error("Activity log entry not saved", e instanceof Error ? e.message : "");
  }
}
