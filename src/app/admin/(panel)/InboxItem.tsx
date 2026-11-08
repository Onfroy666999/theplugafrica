"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, useTransition } from "react";
import { Spinner } from "@/components/market/Form";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Sheet, SheetTitle } from "@/components/ui/Sheet";
import { DUR, EASE } from "@/lib/motion";
import type { Tone } from "@/lib/status";
import { assignConcierge, deleteInboxItem, updateInbox, type InboxKind } from "../actions";
import { call } from "@/lib/call";
import { useCan } from "./AdminContext";

/**
 * One row in any inbox: details, a status dropdown that saves instantly, and private notes. Concierge rows can be
 * assigned to a team member; owners can delete a row (issue #67).
 */
export function InboxItem({
  kind,
  id,
  status,
  notes,
  statuses,
  refCode,
  assign,
  children,
}: {
  kind: InboxKind;
  id: string;
  status: string;
  notes: string;
  statuses: readonly { value: string; label: string; tone: Tone }[];
  refCode: string;
  assign?: { options: { value: string; label: string }[]; value: string };
  children: React.ReactNode;
}) {
  const [value, setValue] = useState(status);
  const [text, setText] = useState(notes);
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const canEdit = useCan("edit");
  const canDelete = useCan("delete");
  const [assignee, setAssignee] = useState(assign?.value ?? "");
  const [confirming, setConfirming] = useState(false);
  const [deleted, setDeleted] = useState(false);

  if (deleted) return null;

  return (
    <li className="px-4 py-4 md:px-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6">
        <div className="min-w-0 flex-1">{children}</div>
        <div className="flex items-center gap-2 md:shrink-0">
          <div className="min-w-0 flex-1 md:w-[180px] md:flex-none" inert={!canEdit}>
            <Select
              variant="pill"
              label="Status"
              options={statuses.map((s) => ({ value: s.value, label: s.label }))}
              value={value}
              onChange={(v) => {
                setValue(v);
                const prev = value;
                setFailed(null);
                start(async () => {
                  const r = await call(updateInbox(kind, id, { status: v }));
                  if (r) {
                    setValue(prev);
                    setFailed(r.error);
                  }
                });
              }}
            />
          </div>
          {canDelete && (
            <Button variant="ghost" size="sm" aria-label={`Delete ${refCode}`} onClick={() => { setFailed(null); setConfirming(true); }}>
              Delete
            </Button>
          )}
          <Button variant="ghost" size="sm" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {notes || text ? "Notes •" : "Notes"}
          </Button>
        </div>
      </div>
      {assign && (
        <div className="mt-3 flex items-center gap-2 md:justify-end">
          <span className="text-[13px] text-navy/55">Handled by</span>
          <div className="w-[200px]" inert={!canEdit}>
            <Select
              variant="pill"
              label="Assigned to"
              options={[{ value: "", label: "Nobody yet" }, ...assign.options]}
              value={assignee}
              onChange={(v) => {
                const prev = assignee;
                setAssignee(v);
                setFailed(null);
                start(async () => {
                  const r = await call(assignConcierge(id, v));
                  if (!r.ok) {
                    setAssignee(prev);
                    setFailed(r.error);
                  }
                });
              }}
            />
          </div>
        </div>
      )}
      {failed && <p role="alert" className="mt-2 text-[13px] font-medium text-ember">{failed}</p>}
      <Sheet open={confirming} onOpenChange={setConfirming} title="Delete entry">
        <SheetTitle className="pr-10 font-heading text-[22px] font-bold text-navy">Delete {refCode}?</SheetTitle>
        <p className="mt-2 text-[14.5px] text-navy/65">It&apos;s removed for good, with its notes. Use this for spam and tests; for real requests, set the status to Closed instead.</p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setConfirming(false)}>Keep it</Button>
          <Button
            variant="danger"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await call(deleteInboxItem(kind, id));
                setConfirming(false);
                if (r.ok) setDeleted(true);
                else setFailed(r.error);
              })
            }
          >
            {pending && <Spinner />}
            Delete
          </Button>
        </div>
      </Sheet>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0, transition: { duration: DUR.fast * 0.8 } }}
            transition={{ duration: DUR.base, ease: EASE.out }}
            className="overflow-hidden"
          >
            <div className="pt-3">
              <textarea
                aria-label="Private notes"
                readOnly={!canEdit}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setSaved(false);
                }}
                placeholder="Private notes: who you spoke to, what was agreed, commission…"
                className="min-h-[96px] w-full resize-y rounded-field border border-navy/15 bg-white px-4 py-3 text-[14.5px] text-navy outline-none placeholder:text-navy/35 hover:border-navy/30 focus:border-navy/40"
              />
              {canEdit && (
              <div className="mt-2 flex items-center gap-3">
                <Button
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      setFailed(null);
                      const r = await call(updateInbox(kind, id, { notes: text }));
                      if (r) setFailed(r.error);
                      else setSaved(true);
                    })
                  }
                >
                  {pending && <Spinner />}
                  Save notes
                </Button>
                {saved && <span role="status" className="text-[13px] font-medium text-ok">Saved</span>}
              </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
