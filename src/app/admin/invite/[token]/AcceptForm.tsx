"use client";

import { useActionState } from "react";
import { Field, Input, Spinner } from "@/components/market/Form";
import { Button } from "@/components/ui/Button";
import { NETWORK_ERROR } from "@/lib/call";
import { acceptInvite } from "../../team-actions";

type State = { ok?: boolean; error?: string } | undefined;

export function AcceptForm({ token, join, name, email }: { token: string; join: boolean; name: string; email: string }) {
  // A failed request shows a message instead of breaking the page (issue #65); success opens the admin.
  const [state, action, pending] = useActionState<State, FormData>(async (prev, fd) => {
    try {
      const r = await acceptInvite(token, prev, fd);
      if (r.ok) window.location.assign("/admin");
      return r;
    } catch {
      return { error: NETWORK_ERROR };
    }
  }, undefined);
  const busy = pending || state?.ok;
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
      <Button type="submit" size="lg" full disabled={busy}>
        {busy && <Spinner />}
        {join ? "Create my account" : "Save the new password"}
      </Button>
    </form>
  );
}
