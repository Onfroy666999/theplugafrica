"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { submitReview } from "@/app/actions";
import { Field, Input, Spinner, Textarea } from "@/components/market/Form";
import { FormGuard } from "@/components/market/FormGuard";
import { Check, Star } from "@/components/market/Icons";
import { Button } from "@/components/ui/Button";
import { Sheet, SheetTitle } from "@/components/ui/Sheet";
import { call } from "@/lib/call";
import { DUR, EASE } from "@/lib/motion";

const LABELS = ["", "Poor", "Below expectations", "OK", "Good", "Excellent"];

/** "Write a review" (issue #14): needs the reference code from contacting the business; approved before it shows. */
export function WriteReview({ slug, name }: { slug: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  return (
    <>
      <Button variant="secondary" className="mt-5" onClick={() => { setSession((n) => n + 1); setOpen(true); }}>
        Write a review
      </Button>
      <Sheet open={open} onOpenChange={setOpen} title="Write a review">
        <ReviewForm key={session} slug={slug} name={name} onDone={() => setOpen(false)} />
      </Sheet>
    </>
  );
}

function ReviewForm({ slug, name, onDone }: { slug: string; name: string; onDone: () => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const shown = hover || rating;

  if (sent)
    return (
      <motion.div initial={{ opacity: 0, transform: "translateY(6px)" }} animate={{ opacity: 1, transform: "translateY(0px)" }} transition={{ duration: DUR.base, ease: EASE.out }}>
        <span className="flex h-11 w-11 items-center justify-center rounded-field bg-ok-soft text-ok"><Check className="h-5 w-5" /></span>
        <SheetTitle className="mt-4 font-heading text-[22px] font-bold text-navy">Thank you for your review</SheetTitle>
        <p className="mt-2 text-[14.5px] text-navy/65">Our team reads every review before it appears, usually within a couple of days. It helps others choose well.</p>
        <Button full className="mt-6" onClick={onDone}>Done</Button>
      </motion.div>
    );

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!rating) return setError("Choose a rating from 1 to 5 stars.");
        setBusy(true);
        setError(null);
        const fd = new FormData(e.currentTarget);
        fd.set("rating", String(rating));
        const r = await call(submitReview(slug, fd));
        setBusy(false);
        if (r.ok) setSent(true);
        else setError(r.error);
      }}
      className="relative space-y-5"
    >
      <div>
        <SheetTitle className="pr-10 font-heading text-[22px] font-bold text-navy">Review {name}</SheetTitle>
        <p className="mt-2 text-[14px] text-navy/60">
          Reviews come only from people who contacted {name} through The Plug. You&apos;ll need the reference code you were given then, like PLG-7KQ2-M9XA.
        </p>
      </div>
      <Field label="Your rating">
        <div role="radiogroup" aria-label="Your rating" className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} ${n === 1 ? "star" : "stars"}: ${LABELS[n]}`}
              onMouseEnter={() => setHover(n)}
              onClick={() => setRating(n)}
              className="press flex h-11 w-11 items-center justify-center rounded-full hover:bg-gold/10"
            >
              <Star className={`h-7 w-7 transition-colors duration-150 ${n <= shown ? "text-gold" : "text-navy/15"}`} />
            </button>
          ))}
          <span className="ml-2 text-[14px] font-medium text-navy/60">{LABELS[shown]}</span>
        </div>
      </Field>
      <Field label="Your review">
        <Textarea label="Your review" name="body" required minLength={20} maxLength={2000} rows={4} placeholder="What did you use them for, and how did it go?" />
      </Field>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Name to show" hint="e.g. Ama O."><Input label="Name to show" name="name" required maxLength={60} autoComplete="given-name" /></Field>
        <Field label="Reference code"><Input label="Reference code" name="ref" required maxLength={13} placeholder="PLG-XXXX-XXXX" className="font-mono uppercase" autoCapitalize="characters" spellCheck={false} /></Field>
      </div>
      <FormGuard />
      {error && <p role="alert" className="rounded-field bg-ember-soft px-4 py-3 text-[14px] font-medium text-ember">{error}</p>}
      <Button type="submit" size="lg" full disabled={busy}>
        {busy && <Spinner />}
        {busy ? "Sending" : "Send review"}
      </Button>
      <p className="text-center text-[12.5px] text-navy/65">Be fair and specific. We don&apos;t publish personal details, abuse, or reviews about anything other than the service.</p>
    </form>
  );
}
