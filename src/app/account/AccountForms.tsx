"use client";

import { useState } from "react";
import { Field, Input, Spinner } from "@/components/market/Form";
import { Button } from "@/components/ui/Button";
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
