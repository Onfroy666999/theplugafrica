"use client";

import { AnimatePresence, motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Field, Input, Select, Spinner, Success, Textarea, makeRef, toOptions } from "@/components/market/Form";
import { Button, LinkButton } from "@/components/ui/Button";
import { CATS } from "@/lib/directory";
import { CITIES, getListing } from "@/lib/listings";
import { DUR } from "@/lib/motion";

const CATEGORY_OPTIONS = CATS.filter((c) => c.key !== "emergency").map((c) => ({ value: c.key, label: c.name }));
const CITY_OPTIONS = toOptions([...CITIES, "Somewhere else"]);
const WHEN_OPTIONS = toOptions(["As soon as possible", "This week", "This month", "In the next few months", "Just exploring"]);

export function ConciergeForm() {
  const params = useSearchParams();
  const listing = getListing(params.get("listing") ?? "");
  const [ref, setRef] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {ref ? (
        <motion.div key="done">
          <Success
            title="Request received"
            body="A Plug concierge will contact you to understand what you need and agree the fee before any work starts."
            refCode={ref}
          >
            <LinkButton href="/explore" className="mt-6">Keep exploring</LinkButton>
          </Success>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          exit={{ opacity: 0, transition: { duration: DUR.fast } }}
          onSubmit={(e) => {
            e.preventDefault();
            setBusy(true);
            setTimeout(() => setRef(makeRef("CNC")), 700);
          }}
          className="space-y-5 rounded-hero border border-navy/10 bg-white p-6 shadow-card md:p-9"
        >
          {listing && (
            <div className="flex items-center justify-between gap-3 rounded-field bg-cream px-4 py-3 text-[14px]">
              <span className="text-navy/70">About: <strong className="text-navy">{listing.name}</strong></span>
              <span className="text-[12px] text-navy/45">{listing.kind}</span>
            </div>
          )}
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Your name"><Input label="Your name" required name="name" autoComplete="name" /></Field>
            <Field label="Phone or WhatsApp"><Input label="Phone or WhatsApp" required name="phone" type="tel" autoComplete="tel" /></Field>
          </div>
          <Field label="Email" hint="optional"><Input label="Email" name="email" type="email" autoComplete="email" /></Field>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="City">
              <Select label="City" name="city" options={CITY_OPTIONS} defaultValue={listing?.city ?? "Accra"} />
            </Field>
            <Field label="What is it about?">
              <Select label="What is it about?" name="category" options={CATEGORY_OPTIONS} defaultValue={listing?.cat ?? "special-services"} />
            </Field>
          </div>
          <Field label="What do you need?">
            <Textarea
              label="What do you need?"
              required
              name="details"
              defaultValue={listing ? `I'd like help with ${listing.name} (${listing.kind}, ${listing.area}). ` : ""}
              placeholder="For example: I'm moving to Accra in March with two children and need a furnished 3-bed near a good school."
            />
          </Field>
          <Field label="When do you need it?">
            <Select label="When do you need it?" name="when" options={WHEN_OPTIONS} defaultValue="This month" />
          </Field>
          <Button type="submit" size="lg" full disabled={busy}>
            {busy && <Spinner />}
            {busy ? "Sending" : "Send request"}
          </Button>
          <p className="text-center text-[12.5px] text-navy/45">We&apos;ll only use your details to respond to this request.</p>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
