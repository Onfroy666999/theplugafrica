"use client";

import { useActionState } from "react";
import { Field, Input, Spinner } from "@/components/market/Form";
import { Button } from "@/components/ui/Button";
import { NETWORK_ERROR } from "@/lib/call";
import { login } from "../actions";

type State = { ok?: boolean; error?: string; email?: string } | undefined;

export function LoginForm() {
  // A failed request shows a message instead of breaking the page (issue #65); success opens the admin.
  const [state, action, pending] = useActionState<State, FormData>(async (prev, fd) => {
    try {
      const r = await login(prev, fd);
      if (r.ok) window.location.assign("/admin");
      return r;
    } catch {
      return { error: NETWORK_ERROR, email: String(fd.get("email") ?? "") };
    }
  }, undefined);
  const busy = pending || state?.ok;
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
      <Button type="submit" size="lg" full disabled={busy}>
        {busy && <Spinner />}
        {busy ? "Signing in" : "Sign in"}
      </Button>
    </form>
  );
}
