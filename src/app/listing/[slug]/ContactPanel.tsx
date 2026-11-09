"use client";

import { AnimatePresence, motion } from "motion/react";
import { FormGuard } from "@/components/market/FormGuard";
import { useState } from "react";
import { createEnquiry, sendBusinessRequest } from "@/app/actions";
import { Field, Input, RefCode, Spinner, Textarea } from "@/components/market/Form";
import { RequestDetails } from "@/components/market/RequestDetails";
import { Chat, Check, Shield } from "@/components/market/Icons";
import { Button, LinkButton } from "@/components/ui/Button";
import { Sheet, SheetTitle } from "@/components/ui/Sheet";
import type { Listing } from "@/lib/listings";
import { DUR, EASE } from "@/lib/motion";

/** Contact card (desktop), contact bar (phones) and the disclaimer sheet. Contacting creates a reference code. */
export function ContactPanel({ l }: { l: Listing }) {
  const [open, setOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [session, setSession] = useState(0); // fresh steps on each open, not on close (avoids a flash mid-exit)
  const show = () => {
    setSession((n) => n + 1);
    setOpen(true);
  };

  return (
    <>
      <div className="rounded-panel border border-navy/12 bg-white p-6 shadow-card">
        <p className="font-heading text-[20px] font-bold text-navy">{l.price}</p>
        <p className="mt-1 text-[14px] text-navy/60">{l.responds}</p>
        <Button full size="lg" className="mt-5" onClick={show}>
          <Chat /> Contact this business
        </Button>
        <Button variant="secondary" full size="lg" className="mt-3" onClick={() => { setSession((n) => n + 1); setRequestOpen(true); }}>
          Send a request
        </Button>
        <LinkButton href={`/concierge?listing=${l.slug}`} variant="ghost" size="lg" full className="mt-1">
          Ask a concierge to handle it
        </LinkButton>
        <p className="mt-4 text-[12.5px] leading-relaxed text-navy/65">
          You deal with the business directly. The Plug never takes payments for them.
        </p>
      </div>

      {/* Phones: contact stays one tap away while reading */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-navy/10 bg-white/95 px-5 py-3 backdrop-blur-md lg:hidden">
        <div className="min-w-0">
          <p className="truncate font-heading text-[15px] font-bold text-navy">{l.price}</p>
          <p className="truncate text-[12.5px] text-navy/65">{l.responds}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" onClick={() => { setSession((n) => n + 1); setRequestOpen(true); }}>Request</Button>
          <Button onClick={show}>Contact</Button>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen} title={`Contact ${l.name}`}>
        <ContactSteps l={l} key={session} />
      </Sheet>

      <Sheet open={requestOpen} onOpenChange={setRequestOpen} title={`Send a request to ${l.name}`}>
        <RequestForm l={l} key={session} />
      </Sheet>
    </>
  );
}

type Contact = { phone?: string; whatsapp?: string; email?: string };

function ContactSteps({ l }: { l: Listing }) {
  const [agreed, setAgreed] = useState(false);
  const [ref, setRef] = useState<string | null>(null);
  const [contact, setContact] = useState<Contact>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const getDetails = async () => {
    setBusy(true);
    setError(null);
    const r = await createEnquiry(l.slug).catch(() => ({ ok: false as const, error: "Something went wrong. Please try again." }));
    setBusy(false);
    if (r.ok) {
      setContact(r.contact);
      setRef(r.ref);
    } else setError(r.error);
  };

  const wa = contact.whatsapp?.replace(/[^\d]/g, "");
  const channels = [
    { label: "Call", href: contact.phone ? `tel:${contact.phone.replace(/\s+/g, "")}` : undefined },
    { label: "WhatsApp", href: wa ? `https://wa.me/${wa}?text=${encodeURIComponent(`Hello, I found you on The Plug Africa. Ref ${ref ?? ""}`)}` : undefined },
    { label: "Email", href: contact.email ? `mailto:${contact.email}?subject=${encodeURIComponent(`Enquiry via The Plug Africa (${ref ?? ""})`)}` : undefined },
  ];
  const hasAny = channels.some((c) => c.href);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {!ref ? (
        <motion.div key="disclaimer" exit={{ opacity: 0, filter: "blur(2px)", transition: { duration: DUR.fast * 0.6 } }}>
          <span className="flex h-11 w-11 items-center justify-center rounded-field bg-cream text-gold"><Shield /></span>
          <SheetTitle className="mt-4 pr-10 font-heading text-[22px] font-bold text-navy">Before you contact {l.name}</SheetTitle>
          <ul className="mt-4 space-y-2.5 text-[14.5px] leading-relaxed text-navy/70">
            {[
              "The Plug is a directory. We connect you; we don't handle your payments to businesses or guarantee outcomes.",
              "Check credentials yourself before paying anyone, and never pay before you've seen what you're paying for.",
              "We'll give you a reference code so the business knows you found them through The Plug.",
            ].map((t) => (
              <li key={t} className="flex gap-2.5">
                <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ok-soft text-ok"><Check className="h-3 w-3" /></span>
                {t}
              </li>
            ))}
          </ul>
          <label className="mt-6 flex cursor-pointer items-center gap-3 rounded-field bg-cream px-4 py-3.5 text-[14px] font-medium text-navy">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="h-[18px] w-[18px] accent-[#14173A]" />
            I understand
          </label>
          {error && <p role="alert" className="mt-4 rounded-field bg-ember-soft px-4 py-3 text-[14px] font-medium text-ember">{error}</p>}
          <Button full size="lg" className="mt-4" disabled={!agreed || busy} onClick={getDetails}>
            {busy && <Spinner />}
            Get contact details
          </Button>
        </motion.div>
      ) : (
        <motion.div
          key="ref"
          initial={{ opacity: 0, filter: "blur(2px)", transform: "translateY(6px)" }}
          animate={{ opacity: 1, filter: "blur(0px)", transform: "translateY(0px)" }}
          transition={{ duration: DUR.base, ease: EASE.out }}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-field bg-ok-soft text-ok"><Check className="h-5 w-5" /></span>
          <SheetTitle className="mt-4 font-heading text-[22px] font-bold text-navy">Your reference code</SheetTitle>
          <p className="mt-2 text-[14.5px] text-navy/65">Mention this code when you contact {l.name}. It helps us follow up if anything goes wrong.</p>
          <div className="mt-5">
            <RefCode code={ref} copied={copied} onCopy={() => navigator.clipboard?.writeText(ref).then(() => setCopied(true), () => {})} />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {channels.map((c) =>
              c.href ? (
                <a key={c.label} href={c.href} target={c.label === "WhatsApp" ? "_blank" : undefined} rel="noopener noreferrer" className="press flex h-12 items-center justify-center rounded-full bg-navy text-[14px] font-semibold text-white hover:bg-navy-hover">
                  {c.label}
                </a>
              ) : (
                <span key={c.label} className="flex h-12 items-center justify-center rounded-full border border-navy/12 text-[14px] font-semibold text-navy/35">{c.label}</span>
              ),
            )}
          </div>
          {!hasAny && (
            <p className="mt-3 text-[12.5px] leading-relaxed text-navy/65">
              This business&apos;s contact details are being added. A Plug concierge can reach them for you meanwhile.
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** "Send a request through The Plug" (issue #50): the details are stored with a reference code and passed to the business. */
function RequestForm({ l }: { l: Listing }) {
  const [ref, setRef] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (ref)
    return (
      <motion.div initial={{ opacity: 0, transform: "translateY(6px)" }} animate={{ opacity: 1, transform: "translateY(0px)" }} transition={{ duration: DUR.base, ease: EASE.out }}>
        <span className="flex h-11 w-11 items-center justify-center rounded-field bg-ok-soft text-ok"><Check className="h-5 w-5" /></span>
        <SheetTitle className="mt-4 font-heading text-[22px] font-bold text-navy">Request sent</SheetTitle>
        <p className="mt-2 text-[14.5px] text-navy/65">The Plug will pass your request to {l.name}, and they&apos;ll contact you. Keep this reference in case you need to follow up.</p>
        <div className="mt-5">
          <RefCode code={ref} copied={copied} onCopy={() => navigator.clipboard?.writeText(ref).then(() => setCopied(true), () => {})} />
        </div>
      </motion.div>
    );

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const r = await sendBusinessRequest(l.slug, new FormData(e.currentTarget)).catch(() => ({ ok: false as const, error: "Something went wrong. Please try again." }));
        setBusy(false);
        if (r.ok) setRef(r.ref);
        else setError(r.error);
      }}
      className="relative space-y-5"
    >
      <div>
        <SheetTitle className="pr-10 font-heading text-[22px] font-bold text-navy">Send a request to {l.name}</SheetTitle>
        <p className="mt-2 text-[14px] text-navy/60">The Plug records your request and passes it on, so there&apos;s a record if you need help later.</p>
      </div>
      <Field label="What do you need?">
        <Textarea label="What do you need?" name="message" required minLength={10} maxLength={2000} rows={3} placeholder={`For example: I'd like a quote from ${l.name} for next week.`} />
      </Field>
      <RequestDetails category={l.cat} service={l.services?.[0]?.name ?? l.kind} defaultCity={l.city} />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Your name"><Input label="Your name" required name="name" autoComplete="name" /></Field>
        <Field label="Phone or WhatsApp"><Input label="Phone or WhatsApp" required name="phone" type="tel" autoComplete="tel" /></Field>
      </div>
      <Field label="Email" hint="optional"><Input label="Email" name="email" type="email" autoComplete="email" /></Field>
      <FormGuard />
      {error && <p role="alert" className="rounded-field bg-ember-soft px-4 py-3 text-[14px] font-medium text-ember">{error}</p>}
      <Button type="submit" size="lg" full disabled={busy}>
        {busy && <Spinner />}
        {busy ? "Sending" : "Send request"}
      </Button>
      <p className="text-center text-[12.5px] text-navy/65">The Plug is a directory: deal with the business directly and never pay before you&apos;ve seen what you&apos;re paying for.</p>
    </form>
  );
}
