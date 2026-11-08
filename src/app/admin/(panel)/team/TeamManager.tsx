"use client";

import { useState, useTransition } from "react";
import { Field, Input, Spinner } from "@/components/market/Form";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Sheet, SheetTitle } from "@/components/ui/Sheet";
import { ROLES, roleLabel } from "@/lib/roles";
import { cancelInvite, changeRole, inviteMember, passwordLink, removeMember, type LinkResult } from "../../team-actions";
import { call } from "@/lib/call";
import { Empty, Panel } from "../ui";

type Member = { id: string; name: string; email: string; role: string; lastSignIn: string | null };
type Invite = { id: string; name: string; email: string; role: string; purpose: string; expires: string };
type Shared = { name: string; purpose: "invite" | "reset"; url: string; emailed: boolean };

const ROLE_OPTIONS = ROLES.map((r) => ({ value: r.value, label: r.label }));

export function TeamManager({ meId, emailOn, inviteDays, members, invites }: { meId: string; emailOn: boolean; inviteDays: number; members: Member[]; invites: Invite[] }) {
  const [inviting, setInviting] = useState(false);
  const [shared, setShared] = useState<Shared | null>(null);
  const [removing, setRemoving] = useState<Member | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setError(null);
      const r = await call(fn());
      if (!r.ok) setError(r.error ?? "That didn't work. Try again.");
    });

  const showLink = (name: string, purpose: Shared["purpose"], r: LinkResult) => {
    if (r.ok) setShared({ name, purpose, url: r.url, emailed: r.emailed });
    else setError(r.error);
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[14px] text-navy/65">
          {members.length} {members.length === 1 ? "person" : "people"} on the team.
        </p>
        <Button size="sm" onClick={() => { setError(null); setInviting(true); }}>Invite someone</Button>
      </div>

      {error && <p role="alert" className="mb-4 rounded-field bg-ember-soft px-4 py-3 text-[14px] font-medium text-ember">{error}</p>}

      <Panel>
        <ul className={`divide-y divide-navy/[0.07] ${pending ? "opacity-70" : ""}`}>
          {members.map((m) => {
            const me = m.id === meId;
            return (
              <li key={m.id} className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:gap-5 md:px-6">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-navy">
                    {m.name}
                    {me && <span className="ml-2 text-[13px] font-medium text-navy/65">(you)</span>}
                  </p>
                  <p className="truncate text-[13px] text-navy/65">{m.email}</p>
                  <p className="text-[12px] text-navy/65">{m.lastSignIn ? `Last signed in ${m.lastSignIn}` : "Hasn't signed in yet"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1 md:w-[150px] md:flex-none">
                    {me ? (
                      <p className="flex h-11 items-center px-4 text-[14px] font-medium text-navy">{roleLabel(m.role)}</p>
                    ) : (
                      <Select variant="pill" label={`Role for ${m.name}`} options={ROLE_OPTIONS} value={m.role} onChange={(v) => run(() => changeRole(m.id, v))} />
                    )}
                  </div>
                  <Button variant="secondary" size="sm" disabled={pending} onClick={() => start(async () => { setError(null); showLink(m.name, "reset", await call(passwordLink(m.id))); })}>
                    Password link
                  </Button>
                  {!me && (
                    <button type="button" onClick={() => { setError(null); setRemoving(m); }} className="press h-10 shrink-0 rounded-full px-3 text-[14px] font-semibold text-ember hover:bg-ember-soft md:px-4">
                      Remove
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>

      <h2 className="mt-10 mb-3 font-heading text-[18px] font-bold text-navy">Open links</h2>
      <Panel>
        {invites.length === 0 ? (
          <Empty title="No open links" body={`Invitations and password links appear here until they're used. Each one works once and lasts ${inviteDays} days.`} />
        ) : (
          <ul className="divide-y divide-navy/[0.07]">
            {invites.map((i) => (
              <li key={i.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center md:px-6">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-[15px] font-semibold text-navy">
                    <span className="truncate">{i.name}</span>
                    <Badge tone={i.purpose === "reset" ? "warn" : "info"}>{i.purpose === "reset" ? "Password link" : `Invited as ${roleLabel(i.role).toLowerCase()}`}</Badge>
                  </p>
                  <p className="truncate text-[13px] text-navy/65">{i.email} · expires {i.expires}</p>
                </div>
                <button type="button" disabled={pending} onClick={() => run(() => cancelInvite(i.id))} className="press h-10 self-start rounded-full px-4 text-[14px] font-semibold text-navy/70 hover:bg-navy/[0.05] sm:self-auto">
                  Cancel link
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <h2 className="mt-10 mb-3 font-heading text-[18px] font-bold text-navy">What each role can do</h2>
      <Panel className="p-5 md:p-6">
        <dl className="grid gap-4 md:grid-cols-3">
          {ROLES.map((r) => (
            <div key={r.value}>
              <dt className="text-[15px] font-semibold text-navy">{r.label}</dt>
              <dd className="mt-1 text-[14px] text-navy/60">{r.hint}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      <Sheet open={inviting} onOpenChange={setInviting} title="Invite someone">
        <InviteForm
          emailOn={emailOn}
          onDone={(name, r) => {
            setInviting(false);
            showLink(name, "invite", r);
          }}
        />
      </Sheet>

      <Sheet open={shared !== null} onOpenChange={(o) => !o && setShared(null)} title="Share the link">
        {shared && <ShareLink shared={shared} inviteDays={inviteDays} onDone={() => setShared(null)} />}
      </Sheet>

      <Sheet open={removing !== null} onOpenChange={(o) => !o && setRemoving(null)} title="Remove from the team">
        <SheetTitle className="pr-10 font-heading text-[22px] font-bold text-navy">Remove {removing?.name}?</SheetTitle>
        <p className="mt-2 text-[14.5px] text-navy/65">They&apos;re signed out straight away and can&apos;t sign in again. Their past activity stays in the log. You can invite them again later.</p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setRemoving(null)}>Keep them</Button>
          <Button
            variant="danger"
            disabled={pending}
            onClick={() =>
              removing &&
              start(async () => {
                const r = await call(removeMember(removing.id));
                setRemoving(null);
                setError(r.ok ? null : r.error);
              })
            }
          >
            {pending && <Spinner />}
            Remove
          </Button>
        </div>
      </Sheet>
    </>
  );
}

function InviteForm({ emailOn, onDone }: { emailOn: boolean; onDone: (name: string, r: LinkResult) => void }) {
  const [role, setRole] = useState("editor");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("role", role);
        setError(null);
        start(async () => {
          const r = await call(inviteMember(fd));
          if (r.ok) onDone(String(fd.get("name")), r);
          else setError(r.error);
        });
      }}
      className="space-y-5"
    >
      <SheetTitle className="pr-10 font-heading text-[22px] font-bold text-navy">Invite someone</SheetTitle>
      <p className="-mt-2 text-[14px] text-navy/60">
        {emailOn ? "We'll email them a link to choose a password. You'll also get the link to share yourself." : "You'll get a link to send them (email isn't set up on this site yet). It works once."}
      </p>
      <Field label="Name"><Input label="Name" name="name" required maxLength={120} autoFocus placeholder="e.g. Ama Mensah" /></Field>
      <Field label="Email"><Input label="Email" name="email" type="email" required maxLength={160} placeholder="name@example.com" /></Field>
      <Field label="Role">
        <Select label="Role" options={ROLE_OPTIONS} value={role} onChange={setRole} />
        <p className="mt-2 text-[13px] text-navy/65">{ROLES.find((r) => r.value === role)?.hint}</p>
      </Field>
      {error && <p role="alert" className="rounded-field bg-ember-soft px-4 py-3 text-[14px] font-medium text-ember">{error}</p>}
      <Button type="submit" size="lg" full disabled={pending}>
        {pending && <Spinner />}
        Create invitation
      </Button>
    </form>
  );
}

function ShareLink({ shared, inviteDays, onDone }: { shared: Shared; inviteDays: number; onDone: () => void }) {
  const [copied, setCopied] = useState(false);
  const what = shared.purpose === "invite" ? "invitation" : "password link";
  return (
    <div className="space-y-5">
      <SheetTitle className="pr-10 font-heading text-[22px] font-bold text-navy">{shared.purpose === "invite" ? `Invitation for ${shared.name}` : `Password link for ${shared.name}`}</SheetTitle>
      <p className="text-[14.5px] text-navy/65">
        {shared.emailed ? `We've emailed the ${what}. ` : `Send this ${what} to ${shared.name} yourself, for example by WhatsApp. `}
        It works once and expires in {inviteDays} days. You won&apos;t see it again after closing this, but you can create a new one.
      </p>
      <div className="flex gap-2">
        <input readOnly value={shared.url} aria-label="Link" onFocus={(e) => e.currentTarget.select()} className="h-12 min-w-0 flex-1 rounded-field border border-navy/15 bg-navy/[0.03] px-4 text-[14px] text-navy outline-none" />
        <Button
          variant="secondary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(shared.url);
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <Button full onClick={onDone}>Done</Button>
    </div>
  );
}
