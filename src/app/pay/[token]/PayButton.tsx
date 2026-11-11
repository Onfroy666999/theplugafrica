"use client";

import { useEffect, useState } from "react";
import { Field, Input, Spinner } from "@/components/market/Form";
import { Button } from "@/components/ui/Button";
import { payFee } from "../actions";

/** Opens Paystack's checkout for this fee (issue #84). Asks for an email only if the fee has none. */
export function PayButton({ token, amount, needsEmail }: { token: string; amount: string; needsEmail: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Coming back from Paystack with the Back button restores this page as it was left: make the button usable again.
  useEffect(() => {
    const back = (e: PageTransitionEvent) => e.persisted && setBusy(false);
    window.addEventListener("pageshow", back);
    return () => window.removeEventListener("pageshow", back);
  }, []);
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const email = needsEmail ? String(new FormData(e.currentTarget).get("email") ?? "") : undefined;
        const r = await payFee(token, email).catch(() => ({ ok: false as const, error: "Something went wrong. Please check your connection and try again." }));
        if (r.ok) return window.location.assign(r.url);
        setBusy(false);
        setError(r.error);
      }}
    >
      {needsEmail && (
        <Field label="Your email" hint="for the receipt">
          <Input label="Your email" name="email" type="email" autoComplete="email" required />
        </Field>
      )}
      {error && <p role="alert" className="rounded-field bg-ember-soft px-4 py-3 text-[14px] font-medium text-ember">{error}</p>}
      <Button type="submit" size="lg" full disabled={busy}>
        {busy && <Spinner />}
        {busy ? "Opening Paystack" : `Pay ${amount}`}
      </Button>
      <p className="text-center text-[13px] text-navy/65">Card or mobile money, on Paystack&apos;s secure page.</p>
    </form>
  );
}
