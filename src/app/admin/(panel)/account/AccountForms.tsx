"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Field, Input, Spinner } from "@/components/market/Form";
import { Button } from "@/components/ui/Button";
import { call } from "@/lib/call";
import { changeMyPassword, updateMyName } from "../../account-actions";

function Message({ result }: { result: { ok: boolean; error?: string } | null }) {
  if (!result) return null;
  return result.ok ? (
    <p role="status" className="rounded-field bg-ok-soft px-4 py-3 text-[14px] font-medium text-ok">Saved</p>
  ) : (
    <p role="alert" className="rounded-field bg-ember-soft px-4 py-3 text-[14px] font-medium text-ember">{result.error}</p>
  );
}

export function NameForm({ name }: { name: string }) {
  const router = useRouter();
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setResult(null);
        start(async () => {
          const r = await call(updateMyName(fd));
          setResult(r);
          if (r.ok) router.refresh();
        });
      }}
      className="space-y-4"
    >
      <Field label="Name"><Input label="Name" name="name" defaultValue={name} required maxLength={120} autoComplete="name" /></Field>
      <Message result={result} />
      <Button type="submit" disabled={pending}>{pending && <Spinner />}Save name</Button>
    </form>
  );
}

export function PasswordForm({ email }: { email: string }) {
  const form = useRef<HTMLFormElement>(null);
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      ref={form}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setResult(null);
        start(async () => {
          const r = await call(changeMyPassword(fd));
          setResult(r);
          if (r.ok) form.current?.reset();
        });
      }}
      className="space-y-4"
    >
      {/* Lets password managers update the saved password for this account. */}
      <input type="email" name="username" value={email} readOnly autoComplete="username" hidden />
      <Field label="Current password"><Input label="Current password" name="current" type="password" required autoComplete="current-password" /></Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="New password" hint="at least 12 characters"><Input label="New password" name="password" type="password" required minLength={12} autoComplete="new-password" /></Field>
        <Field label="Repeat the new password"><Input label="Repeat the new password" name="confirm" type="password" required minLength={12} autoComplete="new-password" /></Field>
      </div>
      <Message result={result} />
      <Button type="submit" disabled={pending}>{pending && <Spinner />}Change password</Button>
    </form>
  );
}
