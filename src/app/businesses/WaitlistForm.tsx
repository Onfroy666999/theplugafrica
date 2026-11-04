"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Field, Input, Select, Spinner, Success, makeRef, toOptions } from "@/components/market/Form";
import { Button } from "@/components/ui/Button";
import { CATS } from "@/lib/directory";
import { CITIES } from "@/lib/listings";
import { DUR } from "@/lib/motion";

const CATEGORY_OPTIONS = CATS.filter((c) => c.key !== "emergency").map((c) => ({ value: c.key, label: c.name }));
const CITY_OPTIONS = toOptions([...CITIES, "Somewhere else"]);

export function WaitlistForm() {
  const [ref, setRef] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {ref ? (
        <motion.div key="done">
          <Success
            title="You're on the list"
            body="We'll contact you to start verification. Have your business registration and ID ready."
            refCode={ref}
          />
        </motion.div>
      ) : (
        <motion.form
          key="form"
          exit={{ opacity: 0, transition: { duration: DUR.fast } }}
          onSubmit={(e) => {
            e.preventDefault();
            setBusy(true);
            setTimeout(() => setRef(makeRef("BIZ")), 700);
          }}
          className="space-y-5 rounded-hero border border-navy/10 bg-white p-6 shadow-card md:p-9"
        >
          <h2 className="font-heading text-[22px] font-bold text-navy">Join the waitlist</h2>
          <Field label="Business name"><Input label="Business name" required name="business" autoComplete="organization" /></Field>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Category">
              <Select label="Category" name="category" options={CATEGORY_OPTIONS} defaultValue="rentals" />
            </Field>
            <Field label="City">
              <Select label="City" name="city" options={CITY_OPTIONS} defaultValue="Accra" />
            </Field>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Your name"><Input label="Your name" required name="name" autoComplete="name" /></Field>
            <Field label="Phone or WhatsApp"><Input label="Phone or WhatsApp" required name="phone" type="tel" autoComplete="tel" /></Field>
          </div>
          <Field label="Email" hint="optional"><Input label="Email" name="email" type="email" autoComplete="email" /></Field>
          <Button type="submit" size="lg" full disabled={busy}>
            {busy && <Spinner />}
            {busy ? "Sending" : "Join the waitlist"}
          </Button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
