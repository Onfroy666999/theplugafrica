"use client";

import { useActionState } from "react";
import { Field, Input, Spinner } from "@/components/market/Form";
import { Button } from "@/components/ui/Button";
import { login } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-5">
      <Field label="Email">
        {/* key remounts the field so it keeps the typed email after a failed attempt (React resets forms on submit) */}
        <Input key={state?.email ?? ""} label="Email" name="email" type="email" autoComplete="username" required autoFocus={!state?.email} defaultValue={state?.email} />
      </Field>
      <Field label="Password">
        <Input key={state ? `pw-${state.error}` : "pw"} label="Password" name="password" type="password" autoComplete="current-password" required autoFocus={!!state?.email} />
      </Field>
      {state?.error && (
        <p role="alert" className="rounded-field bg-ember-soft px-4 py-3 text-[14px] font-medium text-ember">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" full disabled={pending}>
        {pending && <Spinner />}
        {pending ? "Signing in" : "Sign in"}
      </Button>
    </form>
  );
}
