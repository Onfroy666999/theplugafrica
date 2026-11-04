"use client";

import { Dialog } from "@base-ui/react/dialog";

/** The one dialog: bottom sheet on phones, centred card from md up. Focus trap, Escape and outside-click via Base UI. */
export function Sheet({ open, onOpenChange, title, children }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; children: React.ReactNode }) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => onOpenChange(o)}>
      <Dialog.Portal>
        <Dialog.Backdrop className="ui-backdrop fixed inset-0 z-[90] bg-navy/40" />
        <Dialog.Popup
          aria-label={title}
          className="ui-sheet fixed inset-x-0 bottom-0 z-[91] mx-auto max-h-[92svh] w-full max-w-[520px] overflow-y-auto rounded-t-hero bg-white p-6 shadow-float outline-none md:top-1/2 md:bottom-auto md:-translate-y-1/2 md:rounded-hero md:p-8"
        >
          <span className="mx-auto mb-4 block h-1 w-10 rounded-full bg-navy/15 md:hidden" aria-hidden="true" />
          <Dialog.Close aria-label="Close" className="press absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full text-navy hover:bg-navy/[0.05]">
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
            </svg>
          </Dialog.Close>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export const SheetTitle = Dialog.Title;
