"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Field, Input, Spinner } from "@/components/market/Form";
import { Button } from "@/components/ui/Button";
import { cancelMembership, cardLink } from "@/app/membership/actions";
import { deleteAccount, updateProfile } from "./actions";

const FAILED = "Something went wrong. Please check your connection and try again.";

/** Name and phone: used to pre-fill requests and so the team knows who they're talking to. */
export function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setMsg(null);
        const r = await updateProfile(new FormData(e.currentTarget)).catch(() => ({ ok: false as const, error: FAILED }));
        setBusy(false);
        setMsg(r.ok ? { ok: true, text: "Saved." } : { ok: false, text: r.error });
      }}
      className="space-y-4 rounded-panel border border-navy/10 p-6"
    >
      <h2 className="font-heading text-[18px] font-bold">Your details</h2>
      <Field label="Your name"><Input label="Your name" name="name" defaultValue={name} autoComplete="name" maxLength={80} /></Field>
      <Field label="Phone or WhatsApp"><Input label="Phone or WhatsApp" name="phone" type="tel" defaultValue={phone} autoComplete="tel" maxLength={40} /></Field>
      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={`rounded-field px-4 py-3 text-[14px] font-medium ${msg.ok ? "bg-cream text-navy" : "bg-ember-soft text-ember"}`}>
          {msg.text}
        </p>
      )}
      <Button type="submit" disabled={busy}>
        {busy && <Spinner />}
        {busy ? "Saving" : "Save details"}
      </Button>
    </form>
  );
}

/** Two steps, and the word DELETE typed, so nobody deletes an account by a stray tap. */
export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="rounded-panel border border-navy/10 p-6">
      <h2 className="font-heading text-[18px] font-bold">Delete your account</h2>
      <p className="mt-2 text-[14.5px] leading-relaxed text-navy/65">
        Removes your account and saved businesses. Requests you&apos;ve already sent stay with the team so they can finish them.
      </p>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="press mt-4 text-[14px] font-semibold text-ember underline-offset-4 hover:underline">
          Delete my account
        </button>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            // On success the server redirects away; a returned value means it didn't go through.
            const r = await deleteAccount(new FormData(e.currentTarget)).catch(() => ({ ok: false as const, error: FAILED }));
            setBusy(false);
            if (r && !r.ok) setError(r.error);
          }}
          className="mt-4 space-y-4"
        >
          <Field label="Type DELETE to confirm"><Input label="Type DELETE to confirm" name="confirm" autoComplete="off" required /></Field>
          {error && <p role="alert" className="rounded-field bg-ember-soft px-4 py-3 text-[14px] font-medium text-ember">{error}</p>}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="secondary" disabled={busy} className="text-ember">
              {busy && <Spinner />}
              Delete account
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Keep it</Button>
          </div>
        </form>
      )}
    </div>
  );
}

/**
 * The membership line, plus change card or cancel. Cancelling keeps the benefits until the paid month ends; the line
 * switches to `cancelledLine` straight away rather than waiting for the page to reload (issue #116).
 */
export function MembershipControls({ status: initial, line, cancelledLine }: { status: string; line: string; cancelledLine: string }) {
  const [status, setStatus] = useState(initial);
  const router = useRouter();
  const [busy, setBusy] = useState<"card" | "cancel" | null>(null);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    const back = (e: PageTransitionEvent) => e.persisted && setBusy(null);
    window.addEventListener("pageshow", back);
    return () => window.removeEventListener("pageshow", back);
  }, []);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const running = status === "active" || status === "past_due";
  const link = "press text-[14px] font-semibold text-white underline-offset-4 hover:underline disabled:opacity-60";
  return (
    <>
      <p className="mt-2 text-[14.5px] leading-relaxed text-white/75">{status === "cancelled" ? cancelledLine : line}</p>
      <div className="mt-4 space-y-3">
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <button
          type="button"
          className={link}
          disabled={busy !== null}
          onClick={async () => {
            setBusy("card");
            setMsg(null);
            const r = await cardLink().catch(() => ({ ok: false as const, error: FAILED }));
            if (r.ok) return window.location.assign(r.url);
            setBusy(null);
            setMsg({ ok: false, text: r.error });
          }}
        >
          {busy === "card" ? "Opening Paystack" : "Change card"}
        </button>
        {running && !confirm && (
          <button type="button" className={link} onClick={() => setConfirm(true)}>
            Cancel membership
          </button>
        )}
      </div>
      {running && confirm && (
        <div className="rounded-field bg-white/10 p-4">
          <p className="text-[14px] text-white/85">You won&apos;t be charged again, and you keep the benefits until the end of the month you&apos;ve paid for.</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Button
              size="sm"
              variant="light"
              disabled={busy !== null}
              onClick={async () => {
                setBusy("cancel");
                setMsg(null);
                const r = await cancelMembership().catch(() => ({ ok: false as const, error: FAILED }));
                setBusy(null);
                setConfirm(false);
                setMsg(r.ok ? { ok: true, text: "Cancelled. You won't be charged again." } : { ok: false, text: r.error });
                if (r.ok) {
                  setStatus("cancelled");
                  router.refresh();
                }
              }}
            >
              {busy === "cancel" && <Spinner />}
              Cancel membership
            </Button>
            <Button size="sm" variant="outlineLight" type="button" onClick={() => setConfirm(false)}>Keep it</Button>
          </div>
        </div>
      )}
      {msg && <p role={msg.ok ? "status" : "alert"} className="text-[14px] font-medium text-white">{msg.text}</p>}
      </div>
    </>
  );
}
