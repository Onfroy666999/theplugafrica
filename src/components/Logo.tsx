type Tone = "light" | "dark";

/** The Linked Mark — original flat version (concept #4). Do not substitute. */
export function LinkedMark({ tone = "dark", className }: { tone?: Tone; className?: string }) {
  const a = tone === "dark" ? "#F3EEDF" : "#14173A";
  const b = tone === "dark" ? "#D9BE7A" : "#B4913F";
  return (
    <svg viewBox="10 30 176 88" className={className} aria-hidden="true">
      <rect x="20" y="40" width="80" height="68" rx="34" fill="none" stroke={a} strokeWidth="9" />
      <rect x="96" y="40" width="80" height="68" rx="34" fill="none" stroke={b} strokeWidth="9" />
    </svg>
  );
}

/** Lockup: mark | THE PLUG / AFRICA. `tone="dark"` = for dark backgrounds. */
export function Lockup({ tone = "dark", className = "" }: { tone?: Tone; className?: string }) {
  const word = tone === "dark" ? "text-paper" : "text-navy";
  const sub = tone === "dark" ? "text-gold-light" : "text-gold";
  const div = tone === "dark" ? "bg-paper/25" : "bg-navy/20";
  return (
    <span className={`inline-flex items-center gap-3 ${className}`} aria-label="The Plug Africa">
      <LinkedMark tone={tone} className="h-6 w-auto" />
      <span className={`h-6 w-px ${div}`} />
      <span className="flex flex-col leading-none">
        <span className={`font-display text-[15px] font-semibold tracking-[0.04em] ${word}`}>THE PLUG</span>
        <span className={`mt-1 text-[8.5px] font-medium tracking-[0.42em] ${sub}`}>AFRICA</span>
      </span>
    </span>
  );
}
