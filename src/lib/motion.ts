// Motion tokens for scripted (Motion) animations. Mirrors the CSS tokens in globals.css.
// Rule of thumb: enter with EASE.out, move on screen with EASE.inOut, exits are faster than entries.

export const EASE = {
  out: [0.23, 1, 0.32, 1],
  inOut: [0.77, 0, 0.175, 1],
  drawer: [0.32, 0.72, 0, 1],
} as const;

export const DUR = {
  press: 0.15,
  fast: 0.2, // exits, small swaps
  base: 0.25, // popovers, tab content, list changes
  enter: 0.5, // scroll reveals, hero copy
  crossfade: 1.2, // hero photo crossfade
} as const;

/** The one spring for UI indicators (tab underline, chip highlight). */
export const SPRING = { type: "spring", duration: 0.35, bounce: 0.15 } as const;

/** Standard stagger between siblings. */
export const STAGGER = 0.05;

/** Shared variants so every reveal / swap looks identical. */
export const fadeUp = {
  hidden: { opacity: 0, transform: "translateY(12px)" },
  shown: { opacity: 1, transform: "translateY(0px)" },
} as const;

export const swap = {
  initial: { opacity: 0, transform: "translateY(6px)" },
  animate: { opacity: 1, transform: "translateY(0px)" },
  exit: { opacity: 0, transition: { duration: DUR.fast * 0.6 } },
} as const;
