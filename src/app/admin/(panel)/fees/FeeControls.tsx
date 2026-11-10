"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { call } from "@/lib/call";
import { updateFee } from "../../fee-actions";

/** Actions on a fee that's still due (issue #84): copy or resend the link, mark it paid, or waive or cancel it. */
export function FeeControls({ id, url, hasEmail, canEdit, canWaive }: { id: string; url: string; hasEmail: boolean; canEdit: boolean; canWaive: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirm, setConfirm] = useState<"paid" | "waive" | "cancel" | null>(null);
  const [note, setNote] = useState("");

  async function run(action: "resend" | "paid" | "waive" | "cancel") {
    setBusy(action);
    setMsg(null);
    const r = await call(updateFee(id, action, note));
    setBusy(null);
    setConfirm(null);
    if (!r.ok) return setMsg({ ok: false, text: r.error });
    if (r.message) setMsg({ ok: true, text: r.message });
    router.refresh();
  }

  const btn = "press text-[13.5px] font-semibold text-navy underline-offset-4 hover:underline disabled:opacity-50";
  const words = { paid: "Mark as paid (settled outside Paystack, e.g. mobile money to The Plug)", waive: "Waive this fee", cancel: "Cancel this fee (recorded by mistake)" };
  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <button type="button" className={btn} onClick={() => navigator.clipboard.writeText(url).then(() => setMsg({ ok: true, text: "Pay link copied." }))}>
          Copy pay link
        </button>
        {canEdit && hasEmail && (
          <button type="button" className={btn} disabled={busy !== null} onClick={() => run("resend")}>
            {busy === "resend" ? "Sending" : "Email again"}
          </button>
        )}
        {canEdit && <button type="button" className={btn} onClick={() => setConfirm("paid")}>Mark paid</button>}
        {canWaive && <button type="button" className={btn} onClick={() => setConfirm("waive")}>Waive</button>}
        {canWaive && <button type="button" className={btn} onClick={() => setConfirm("cancel")}>Cancel</button>}
      </div>
      {confirm && (
        <div className="mt-3 rounded-field bg-cream p-3">
          <p className="text-[13.5px] font-medium text-navy">{words[confirm]}?</p>
          <input
            aria-label="Note (optional)"
            placeholder="Note, optional (e.g. paid by MoMo on 12 Nov)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
            className="mt-2 h-10 w-full rounded-full border border-navy/15 bg-white px-4 text-[13.5px] outline-none focus:border-navy/40"
          />
          <div className="mt-2 flex gap-4">
            <button type="button" className={btn} disabled={busy !== null} onClick={() => run(confirm)}>
              {busy ? "Saving" : "Confirm"}
            </button>
            <button type="button" className={btn} onClick={() => setConfirm(null)}>Back</button>
          </div>
        </div>
      )}
      {msg && <p role={msg.ok ? "status" : "alert"} className={`mt-2 text-[13.5px] font-medium ${msg.ok ? "text-ok" : "text-ember"}`}>{msg.text}</p>}
    </div>
  );
}
