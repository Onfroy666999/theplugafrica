"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/market/Form";
import { Button } from "@/components/ui/Button";
import { startMembership } from "./actions";

/** Sends a signed-in visitor to Paystack's checkout; asks others to sign in first (issue #83). */
export function JoinButton({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Coming back from Paystack with the Back button restores this page as it was left: make the button usable again.
  useEffect(() => {
    const back = (e: PageTransitionEvent) => e.persisted && setBusy(false);
    window.addEventListener("pageshow", back);
    return () => window.removeEventListener("pageshow", back);
  }, []);
  const signIn = () => router.push("/account/sign-in?next=%2Fmembership");
  return (
    <div className="space-y-3">
      <Button
        size="lg"
        full
        disabled={busy}
        onClick={async () => {
          if (!signedIn) return signIn();
          setBusy(true);
          setError(null);
          const r = await startMembership().catch(() => ({ ok: false as const, error: "Something went wrong. Please check your connection and try again." }));
          if (r.ok) return window.location.assign(r.url); // Paystack's checkout page
          setBusy(false);
          if ("signIn" in r && r.signIn) return signIn();
          setError(r.error);
        }}
      >
        {busy && <Spinner />}
        {busy ? "Opening checkout" : signedIn ? "Join the membership" : "Sign in to join"}
      </Button>
      {error && <p role="alert" className="rounded-field bg-ember-soft px-4 py-3 text-[14px] font-medium text-ember">{error}</p>}
      <p className="text-[13px] leading-relaxed text-navy/65">You&apos;ll pay on Paystack&apos;s secure page, then come straight back here.</p>
    </div>
  );
}
