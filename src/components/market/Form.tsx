"use client";

import { motion } from "motion/react";
import { DUR, EASE } from "@/lib/motion";
import { Check } from "./Icons";

export { Select, toOptions } from "@/components/ui/Select";

/** Field chrome shared by inputs, textareas and the Select `field` variant. */
const base =
  "w-full rounded-field border border-navy/15 bg-white px-4 text-[15px] text-navy outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-navy/35 hover:border-navy/30 focus:border-navy/40 focus:shadow-[0_0_0_4px_rgb(180_145_63/0.15)]";

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="block text-[14px] font-semibold text-navy">
        {label}
        {hint && <span className="ml-2 font-normal text-navy/65">{hint}</span>}
      </span>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <input aria-label={label} {...props} className={`${base} h-12 ${props.className ?? ""}`} />;
}

export function Textarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return <textarea aria-label={label} {...props} className={`${base} min-h-[120px] resize-y py-3 ${props.className ?? ""}`} />;
}

/** Spinner used inside submit buttons while "sending". */
export function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />;
}

/** Reference-code display shared by the contact sheet and form success states. */
export function RefCode({ code, onCopy, copied }: { code: string; onCopy?: () => void; copied?: boolean }) {
  return (
    <button
      type="button"
      onClick={onCopy}
      className="press mx-auto flex w-full max-w-sm items-center justify-between gap-4 rounded-field border-2 border-dashed border-gold/50 bg-cream px-5 py-4"
    >
      <span className="font-mono text-[20px] font-bold tracking-[0.12em] text-navy">{code}</span>
      {onCopy && <span className="text-[13px] font-semibold text-gold-ink">{copied ? "Copied" : "Copy"}</span>}
    </button>
  );
}

/** Success state shared by every form. */
export function Success({ title, body, refCode, children }: { title: string; body: string; refCode: string; children?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, transform: "translateY(10px)", filter: "blur(2px)" }}
      animate={{ opacity: 1, transform: "translateY(0px)", filter: "blur(0px)" }}
      transition={{ duration: DUR.base, ease: EASE.out }}
      className="rounded-hero border border-navy/10 bg-white p-8 text-center shadow-card md:p-10"
    >
      <SuccessIcon />
      <h2 className="mt-5 font-heading text-[26px] font-bold text-navy">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-navy/65">{body}</p>
      <div className="mt-6">
        <RefCode code={refCode} onCopy={() => navigator.clipboard?.writeText(refCode).catch(() => {})} />
      </div>
      <p className="mt-4 text-[12.5px] text-navy/65">Keep this reference. Quote it if you contact us about this request.</p>
      {children}
    </motion.div>
  );
}

export function SuccessIcon() {
  return (
    <motion.span
      initial={{ transform: "scale(0.6)", opacity: 0 }}
      animate={{ transform: "scale(1)", opacity: 1 }}
      transition={{ delay: 0.1, type: "spring", duration: 0.5, bounce: 0.3 }}
      className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ok-soft text-ok"
    >
      <Check className="h-7 w-7" />
    </motion.span>
  );
}
