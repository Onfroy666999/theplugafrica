"use client";

import { Select as S } from "@base-ui/react/select";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";

export type Option = { value: string; label: string };

/** Trigger styles: `field` in forms, `pill` in filter bars, `bare` inside the hero search. */
const trigger = cva(
  "group/sel flex w-full min-w-0 cursor-pointer items-center justify-between gap-2 text-left text-navy outline-none transition-[border-color,box-shadow,background-color] duration-200",
  {
    variants: {
      variant: {
        field: "h-12 rounded-field border border-navy/15 bg-white px-4 text-[15px] hover:border-navy/30 data-[popup-open]:border-navy/40 data-[popup-open]:shadow-[0_0_0_4px_rgb(180_145_63/0.15)]",
        pill: "h-11 rounded-full border border-navy/15 bg-white px-4 text-[14px] font-medium hover:border-navy/35 data-[popup-open]:border-navy/40",
        bare: "h-full bg-transparent text-[15px] font-medium",
      },
    },
  },
);

type Props = {
  options: Option[];
  value?: string;
  defaultValue?: string;
  onChange?: (v: string) => void;
  name?: string;
  label: string; // accessible name
  variant?: "field" | "pill" | "bare";
  icon?: React.ReactNode;
  className?: string;
};

export function Select({ options, value, defaultValue, onChange, name, label, variant = "field", icon, className }: Props) {
  const items = Object.fromEntries(options.map((o) => [o.value, o.label]));
  return (
    <S.Root
      items={items}
      value={value}
      defaultValue={defaultValue ?? (value === undefined ? options[0]?.value : undefined)}
      onValueChange={(v) => onChange?.(v as string)}
      name={name}
    >
      <S.Trigger aria-label={label} className={clsx(trigger({ variant }), className)}>
        <span className="flex min-w-0 items-center gap-2.5">
          {icon && <span className="shrink-0 text-navy/65">{icon}</span>}
          <S.Value className="truncate" />
        </span>
        <S.Icon className="shrink-0 text-navy/65 transition-transform duration-200 ease-[var(--ease-out)] group-data-[popup-open]/sel:rotate-180">
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
          </svg>
        </S.Icon>
      </S.Trigger>
      <S.Portal>
        <S.Positioner sideOffset={8} alignItemWithTrigger={false} className="z-[95] outline-none">
          <S.Popup className="ui-popup max-h-[min(360px,var(--available-height))] min-w-[max(var(--anchor-width),200px)] overflow-y-auto rounded-field bg-white p-1.5 shadow-pop outline-none">
            <S.List>
              {options.map((o) => (
                <S.Item
                  key={o.value}
                  value={o.value}
                  className="flex cursor-pointer items-center justify-between gap-6 rounded-xl px-3 py-2.5 text-[15px] text-navy outline-none select-none data-[highlighted]:bg-navy/[0.05] data-[selected]:font-semibold"
                >
                  <S.ItemText>{o.label}</S.ItemText>
                  <S.ItemIndicator className="text-gold">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                      <path fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" d="m5 12.5 4.5 4.5L19 7.5" />
                    </svg>
                  </S.ItemIndicator>
                </S.Item>
              ))}
            </S.List>
          </S.Popup>
        </S.Positioner>
      </S.Portal>
    </S.Root>
  );
}

export const toOptions = (xs: readonly string[]): Option[] => xs.map((x) => ({ value: x, label: x }));
