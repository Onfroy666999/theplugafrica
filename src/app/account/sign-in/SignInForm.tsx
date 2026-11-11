"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { requestSignInCode, verifySignInCode } from "@/app/account/actions";
import { Field, Input, Spinner } from "@/components/market/Form";
import { FormGuard } from "@/components/market/FormGuard";
import { Button } from "@/components/ui/Button";
import { CODE_LENGTH, CODE_MINUTES } from "@/lib/signin-code";
import { DUR, EASE } from "@/lib/motion";
import { resetSaved } from "@/components/market/saved";

const FAILED = "Something went wrong. Please check your connection and try again.";
/** Seconds before "Send a new code" works, so a slow email isn't answered with a second one. */
const RESEND_AFTER = 30;

/** Two steps on one card: the email, then the code that was sent to it (issue #82). */
export function SignInForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [wait, setWait] = useState(0);
  // The first step's form data (with its start time), reused when asking for a new code.
  const first = useRef<FormData | null>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function sendCode(fd: FormData) {
    setBusy(true);
    setError(null);
    const r = await requestSignInCode(fd).catch(() => ({ ok: false as const, error: FAILED }));
    setBusy(false);
    if (!r.ok) return setError(r.error);
    first.current = fd;
    setEmail(r.email || String(fd.get("email")));
    setWait(RESEND_AFTER);
    return true;
  }

  return (
    <div className="rounded-hero border border-navy/10 bg-white p-6 shadow-card md:p-9">
      <AnimatePresence mode="wait" initial={false}>
        {!email ? (
          <motion.form
            key="email"
            exit={{ opacity: 0, transition: { duration: DUR.fast } }}
            onSubmit={async (e) => {
              e.preventDefault();
              await sendCode(new FormData(e.currentTarget));
            }}
            className="space-y-5"
          >
            <div>
              <h1 className="font-heading text-[26px] leading-tight font-extrabold tracking-[-0.02em] text-navy md:text-[30px]">Sign in or create an account</h1>
              <p className="mt-2 text-[15px] leading-relaxed text-navy/65">We&apos;ll email you a {CODE_LENGTH}-digit code. There&apos;s no password to remember.</p>
            </div>
            <Field label="Email">
              <Input label="Email" name="email" type="email" autoComplete="email" required autoFocus maxLength={160} />
            </Field>
            <FormGuard />
            {error && <p role="alert" className="rounded-field bg-ember-soft px-4 py-3 text-[14px] font-medium text-ember">{error}</p>}
            <Button type="submit" size="lg" full disabled={busy}>
              {busy && <Spinner />}
              {busy ? "Sending" : "Email me a code"}
            </Button>
            <p className="text-[13px] leading-relaxed text-navy/65">
              Your account keeps your requests and saved businesses in one place. We use your email to sign you in and to reply to your requests, nothing else.
            </p>
          </motion.form>
        ) : (
          <motion.form
            key="code"
            initial={{ opacity: 0, transform: "translateY(8px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            transition={{ duration: DUR.base, ease: EASE.out }}
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError(null);
              setNotice(null);
              const fd = new FormData(e.currentTarget);
              fd.set("email", email);
              fd.set("next", next);
              const r = await verifySignInCode(fd).catch(() => ({ ok: false as const, error: FAILED }));
              if (!r.ok) {
                setBusy(false);
                return setError(r.error);
              }
              resetSaved();
              router.replace(r.next);
              router.refresh();
            }}
            className="space-y-5"
          >
            <div>
              <h1 className="font-heading text-[26px] leading-tight font-extrabold tracking-[-0.02em] text-navy md:text-[30px]">Check your email</h1>
              <p className="mt-2 text-[15px] leading-relaxed text-navy/65">
                We sent a code to <strong className="font-semibold text-navy">{email}</strong>. It works for {CODE_MINUTES} minutes. Check Spam if it isn&apos;t there.
              </p>
            </div>
            <Field label="Code">
              <Input
                label="Code"
                name="code"
                required
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9 \-]*"
                maxLength={9}
                className="tracking-[0.3em]"
              />
            </Field>
            {error && <p role="alert" className="rounded-field bg-ember-soft px-4 py-3 text-[14px] font-medium text-ember">{error}</p>}
            {notice && <p role="status" className="rounded-field bg-cream px-4 py-3 text-[14px] font-medium text-navy">{notice}</p>}
            <Button type="submit" size="lg" full disabled={busy}>
              {busy && <Spinner />}
              {busy ? "Signing in" : "Sign in"}
            </Button>
            <div className="flex flex-wrap items-center justify-between gap-3 text-[14px]">
              <button
                type="button"
                onClick={() => {
                  setEmail(null);
                  setError(null);
                  setNotice(null);
                }}
                className="press font-medium text-navy underline-offset-4 hover:underline"
              >
                Use a different email
              </button>
              <button
                type="button"
                disabled={wait > 0 || busy}
                onClick={async () => {
                  if (!first.current) return;
                  setNotice(null);
                  const again = new FormData();
                  first.current.forEach((v, k) => again.set(k, v));
                  again.set("resend", "1"); // the first step's Turnstile token is spent
                  if (await sendCode(again)) setNotice("We've sent a new code. Only the newest one works.");
                }}
                className="press font-medium text-navy underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-navy/65 disabled:no-underline"
              >
                {wait > 0 ? `Send a new code in ${wait}s` : "Send a new code"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
