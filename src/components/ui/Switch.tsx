"use client";

import { Switch as S } from "@base-ui/react/switch";

/** The one toggle. Rendered inside a pill so it lines up with filter selects. */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className={`press flex h-11 shrink-0 cursor-pointer items-center gap-2.5 rounded-full border px-4 text-[14px] font-medium ${checked ? "border-ok/50 bg-ok-soft text-ok" : "border-navy/15 bg-white text-navy hover:border-navy/35"}`}>
      <S.Root
        checked={checked}
        onCheckedChange={(v) => onChange(v)}
        className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-navy/20 p-0.5 transition-colors duration-200 data-[checked]:bg-ok"
      >
        {/* Centred in the track with an even 2px gap all round (issue #118: it used to sit against the top edge). */}
        <S.Thumb className="block size-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-[var(--ease-out)] data-[checked]:translate-x-4" />
      </S.Root>
      {label}
    </label>
  );
}
