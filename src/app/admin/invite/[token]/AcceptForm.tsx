"use client";

import { useActionState } from "react";
import { Field, Input, Spinner } from "@/components/market/Form";
import { Button } from "@/components/ui/Button";
import { acceptInvite } from "../../team-actions";

export function AcceptForm({ token, join, name, email }: { token: string; join: boolean; name: string; email: string }) {
  const [state, action, pending] = useActionState(acceptInvite.bind(null, token), undefined);
  return (
    <form action={action} className="space-y-5">
      {/* Lets password managers save the new password against the right account. */}
      <input type="email" name="username" value={email} readOnly autoComplete="username" hidden />
      {join && (
        <Field label="Your name">
          <Input label="Your name" name="name" required maxLength={120} defaultValue={name} autoComplete="name" />
        </Field>
      )}
      <Field label="Password" hint="at least 12 characters">
        <Input label="Password" name="password" type="password" required minLength={12} autoComplete="new-password" autoFocus={!join} />
      </Field>
      <Field label="Repeat the password">
        <Input label="Repeat the password" name="confirm" type="password" required minLength={12} autoComplete="new-password" />
      </Field>
      {state?.error && <p role="alert" className="rounded-field bg-ember-soft px-4 py-3 text-[14px] font-medium text-ember">{state.error}</p>}
      <Button type="submit" size="lg" full disabled={pending}>
        {pending && <Spinner />}
        {join ? "Create my account" : "Save the new password"}
      </Button>
    </form>
  );
}
