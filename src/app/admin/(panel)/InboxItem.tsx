"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, useTransition } from "react";
import { Spinner } from "@/components/market/Form";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { DUR, EASE } from "@/lib/motion";
import type { Tone } from "@/lib/status";
import { updateInbox, type InboxKind } from "../actions";

/** One row in any inbox: details, a status dropdown that saves instantly, and private notes. */
export function InboxItem({
  kind,
  id,
  status,
  notes,
  statuses,
  children,
}: {
  kind: InboxKind;
  id: string;
  status: string;
  notes: string;
  statuses: readonly { value: string; label: string; tone: Tone }[];
  children: React.ReactNode;
}) {
  const [value, setValue] = useState(status);
  const [text, setText] = useState(notes);
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  return (
    <li className="px-4 py-4 md:px-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6">
        <div className="min-w-0 flex-1">{children}</div>
        <div className="flex items-center gap-2 md:w-[230px] md:shrink-0">
          <div className="flex-1">
            <Select
              variant="pill"
              label="Status"
              options={statuses.map((s) => ({ value: s.value, label: s.label }))}
              value={value}
              onChange={(v) => {
                setValue(v);
                start(() => updateInbox(kind, id, { status: v }));
              }}
            />
          </div>
          <Button variant="ghost" size="sm" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {notes || text ? "Notes •" : "Notes"}
          </Button>
        </div>
      </div>
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
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setSaved(false);
                }}
                placeholder="Private notes: who you spoke to, what was agreed, commission…"
                className="min-h-[96px] w-full resize-y rounded-field border border-navy/15 bg-white px-4 py-3 text-[14.5px] text-navy outline-none placeholder:text-navy/35 hover:border-navy/30 focus:border-navy/40"
              />
              <div className="mt-2 flex items-center gap-3">
                <Button
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      await updateInbox(kind, id, { notes: text });
                      setSaved(true);
                    })
                  }
                >
                  {pending && <Spinner />}
                  Save notes
                </Button>
                {saved && <span role="status" className="text-[13px] font-medium text-ok">Saved</span>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
