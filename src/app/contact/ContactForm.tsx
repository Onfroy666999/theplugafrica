"use client";

import { AnimatePresence, motion } from "motion/react";
import { FormGuard } from "@/components/market/FormGuard";
import { useState } from "react";
import { sendContactMessage } from "@/app/actions";
import { Field, Input, Select, Spinner, Success, Textarea, toOptions } from "@/components/market/Form";
import { Button } from "@/components/ui/Button";
import { CONTACT_TOPICS } from "@/lib/contact";
import { DUR } from "@/lib/motion";

const TOPIC_OPTIONS = toOptions([...CONTACT_TOPICS]);

export function ContactForm() {
  const [ref, setRef] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <AnimatePresence mode="wait" initial={false}>
      {ref ? (
        <motion.div key="done">
          <Success title="Message sent" body="Thank you. Someone from The Plug will reply by email or phone. Keep this reference in case you need to follow up." refCode={ref} />
        </motion.div>
      ) : (
        <motion.form
          key="form"
          exit={{ opacity: 0, transition: { duration: DUR.fast } }}
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            const r = await sendContactMessage(new FormData(e.currentTarget)).catch(() => ({ ok: false as const, error: "Something went wrong. Please try again." }));
            setBusy(false);
            if (r.ok) setRef(r.ref);
            else setError(r.error);
          }}
          className="relative space-y-5 rounded-hero border border-navy/10 bg-white p-6 shadow-card md:p-9"
        >
          <h2 className="font-heading text-[22px] font-bold text-navy">Send us a message</h2>
          <Field label="Your name"><Input label="Your name" required name="name" autoComplete="name" /></Field>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Email" hint="email or phone"><Input label="Email" name="email" type="email" autoComplete="email" /></Field>
            <Field label="Phone or WhatsApp" hint="email or phone"><Input label="Phone or WhatsApp" name="phone" type="tel" autoComplete="tel" /></Field>
          </div>
          <Field label="What's it about?">
            <Select label="What's it about?" name="topic" options={TOPIC_OPTIONS} defaultValue={CONTACT_TOPICS[0]} />
          </Field>
          <Field label="Message"><Textarea label="Message" required name="message" rows={5} minLength={10} maxLength={4000} /></Field>
          <FormGuard />
          {error && <p role="alert" className="rounded-field bg-ember-soft px-4 py-3 text-[14px] font-medium text-ember">{error}</p>}
          <Button type="submit" size="lg" full disabled={busy}>
            {busy && <Spinner />}
            {busy ? "Sending" : "Send message"}
          </Button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
