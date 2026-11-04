"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { RefCode, makeRef } from "@/components/market/Form";
import { Chat, Check, Shield } from "@/components/market/Icons";
import { Button, LinkButton } from "@/components/ui/Button";
import { Sheet, SheetTitle } from "@/components/ui/Sheet";
import type { Listing } from "@/lib/listings";
import { DUR, EASE } from "@/lib/motion";

/** Contact card (desktop), contact bar (phones) and the disclaimer sheet. Contacting creates a reference code. */
export function ContactPanel({ l }: { l: Listing }) {
  const [open, setOpen] = useState(false);
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
        <LinkButton href={`/concierge?listing=${l.slug}`} variant="secondary" size="lg" full className="mt-3">
          Ask a concierge to handle it
        </LinkButton>
        <p className="mt-4 text-[12.5px] leading-relaxed text-navy/50">
          You deal with the business directly. The Plug never takes payments for them.
        </p>
      </div>

      {/* Phones: contact stays one tap away while reading */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-navy/10 bg-white/95 px-5 py-3 backdrop-blur-md lg:hidden">
        <div className="min-w-0">
          <p className="truncate font-heading text-[15px] font-bold text-navy">{l.price}</p>
          <p className="truncate text-[12.5px] text-navy/55">{l.responds}</p>
        </div>
        <Button onClick={show}>Contact</Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen} title={`Contact ${l.name}`}>
        <ContactSteps l={l} key={session} />
      </Sheet>
    </>
  );
}

function ContactSteps({ l }: { l: Listing }) {
  const [agreed, setAgreed] = useState(false);
  const [ref, setRef] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {!ref ? (
        <motion.div key="disclaimer" exit={{ opacity: 0, filter: "blur(2px)", transition: { duration: DUR.fast * 0.6 } }}>
          <span className="flex h-11 w-11 items-center justify-center rounded-field bg-cream text-gold"><Shield /></span>
          <SheetTitle className="mt-4 pr-10 font-heading text-[22px] font-bold text-navy">Before you contact {l.name}</SheetTitle>
          <ul className="mt-4 space-y-2.5 text-[14.5px] leading-relaxed text-navy/70">
            {[
              "The Plug is a directory. We connect you; we don't take payments or guarantee outcomes.",
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
          <Button full size="lg" className="mt-4" disabled={!agreed} onClick={() => setRef(makeRef("PLG"))}>
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
            {["Call", "WhatsApp", "Email"].map((c) => (
              <span key={c} className="flex h-12 items-center justify-center rounded-full border border-navy/12 text-[14px] font-semibold text-navy/40">{c}</span>
            ))}
          </div>
          <p className="mt-3 text-[12.5px] leading-relaxed text-navy/50">
            Demo: in the live site, the business&apos;s phone, WhatsApp and email appear here, routed through The Plug so your number stays private.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
