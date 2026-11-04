import type { Tone } from "@/lib/status";

const TONES: Record<Tone, string> = {
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  info: "bg-info-soft text-info",
  ember: "bg-ember-soft text-ember",
  muted: "bg-navy/[0.06] text-navy/60",
};

/** The one status pill, used for every status on admin and public pages. */
export function Badge({ tone, children, className = "" }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold whitespace-nowrap ${TONES[tone]} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      {children}
    </span>
  );
}
