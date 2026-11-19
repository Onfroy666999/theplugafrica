"use client";

import { useState } from "react";
import { call } from "@/lib/call";
import { deleteUnusedPhotos } from "../../actions";

/** Owners: remove uploaded photos no business, service or site photo uses (issue #94). Asks first; only files over a day old. */
export function CleanPhotos() {
  const [step, setStep] = useState<"idle" | "confirm" | "busy">("idle");
  const [msg, setMsg] = useState<string | null>(null);
  const link = "press text-[13.5px] font-semibold text-navy underline-offset-4 hover:underline disabled:opacity-50";
  return (
    <div className="mt-6 text-[13.5px] text-navy/65">
      {step === "confirm" ? (
        <span className="flex flex-wrap items-center gap-3">
          Delete every uploaded photo that no business, service or site photo uses (uploaded more than a day ago)? This can&apos;t be undone.
          <button
            type="button"
            className={link}
            onClick={async () => {
              setStep("busy");
              const r = await call(deleteUnusedPhotos());
              setStep("idle");
              setMsg(r.ok ? (r.removed ? `Deleted ${r.removed} unused ${r.removed === 1 ? "photo" : "photos"}.` : "No unused photos to delete.") : r.error);
            }}
          >
            Delete them
          </button>
          <button type="button" className={link} onClick={() => setStep("idle")}>Keep them</button>
        </span>
      ) : (
        <span className="flex flex-wrap items-center gap-3">
          <button type="button" className={link} disabled={step === "busy"} onClick={() => setStep("confirm")}>
            {step === "busy" ? "Deleting…" : "Delete unused uploaded photos"}
          </button>
          {msg && <span role="status">{msg}</span>}
        </span>
      )}
    </div>
  );
}
