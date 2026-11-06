"use client";

import { AnimatePresence, motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { submitConcierge } from "@/app/actions";
import { Field, Input, Select, Spinner, Success, Textarea, toOptions } from "@/components/market/Form";
import { Button, LinkButton } from "@/components/ui/Button";
import { CATS } from "@/lib/directory";
import { getListing } from "@/lib/listings";
import { RequestDetails } from "@/components/market/RequestDetails";
import { DUR } from "@/lib/motion";

const CATEGORY_OPTIONS = CATS.filter((c) => c.key !== "emergency").map((c) => ({ value: c.key, label: c.name }));
const WHEN_OPTIONS = toOptions(["As soon as possible", "This week", "This month", "In the next few months", "Just exploring"]);

/** `service`: set on a concierge service page (issue #36); fixes the category and names the service. */
export function ConciergeForm({ service }: { service?: { category: string; slug: string; name: string } } = {}) {
  const params = useSearchParams();
  const listing = getListing(params.get("listing") ?? "");
  const [ref, setRef] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState(service?.category ?? listing?.cat ?? "special-services");

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
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            const fd = new FormData(e.currentTarget);
            if (listing) fd.set("listing", listing.slug);
            if (service) {
              fd.set("category", service.category);
              fd.set("service", service.slug);
            }
            const r = await submitConcierge(fd).catch(() => ({ ok: false as const, error: "Something went wrong. Please try again." }));
            setBusy(false);
            if (r.ok) setRef(r.ref);
            else setError(r.error);
          }}
          className="relative space-y-5 rounded-hero border border-navy/10 bg-white p-6 shadow-card md:p-9"
        >
          {service && (
            <div className="rounded-field bg-cream px-4 py-3 text-[14px] text-navy/70">
              About: <strong className="text-navy">{service.name}</strong>
            </div>
          )}
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
          {!service && (
            <Field label="What is it about?">
              <Select label="What is it about?" name="category" options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
            </Field>
          )}
          <Field label="What do you need?">
            <Textarea
              label="What do you need?"
              required
              name="details"
              defaultValue={listing ? `I'd like help with ${listing.name} (${listing.kind}, ${listing.area}). ` : ""}
              placeholder={service?.category === "new-business" ? "For example: I want to register a small import business in Accra and open a business bank account." : "For example: I'm moving to Accra in March with two children and need a furnished 3-bed near a good school."}
            />
          </Field>
          {/* Where and when (issue #50); the choices follow the category */}
          <RequestDetails key={category} category={category} service={service?.name ?? listing?.kind} defaultCity={listing?.city} />
          <Field label="How soon?">
            <Select label="When do you need it?" name="when" options={WHEN_OPTIONS} defaultValue="This month" />
          </Field>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
          {error && <p role="alert" className="rounded-field bg-ember-soft px-4 py-3 text-[14px] font-medium text-ember">{error}</p>}
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
