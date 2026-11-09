"use client";

// The hearts on listing cards (issue #82). One small store shared by every card on the page: the saved list is
// fetched once, and only for visitors whose browser says they're signed in, so others cost the server nothing.

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { mySavedSlugs, toggleSaved } from "@/app/account/actions";

let saved = new Set<string>();
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((f) => f());
const subscribe = (f: () => void) => {
  listeners.add(f);
  return () => listeners.delete(f);
};

/** True when the browser carries the "signed in" hint cookie (it holds nothing personal). */
export const signedInHint = () => typeof document !== "undefined" && /(?:^|;\s*)plug_signed_in=1(?:;|$)/.test(document.cookie);

function load() {
  loading ??= mySavedSlugs()
    .then((slugs) => {
      saved = new Set(slugs ?? []);
      emit();
    })
    .catch(() => {});
  return loading;
}

/** Signed in or not, for the header. False on the server and during hydration, so the page never mismatches. */
export function useSignedIn() {
  return useSyncExternalStore(subscribe, signedInHint, () => false);
}

export function useSaved(slug: string) {
  const router = useRouter();
  const path = usePathname();
  const isSaved = useSyncExternalStore(subscribe, () => signedInHint() && saved.has(slug), () => false);
  useEffect(() => {
    if (signedInHint()) load();
    else if (saved.size || loading) {
      // Signed out since the last page: forget the old list.
      saved = new Set();
      loading = null;
      emit();
    }
  }, []);

  const signIn = () => router.push(`/account/sign-in?next=${encodeURIComponent(path)}`);
  const set = (on: boolean) => {
    saved = new Set(saved);
    if (on) saved.add(slug);
    else saved.delete(slug);
    emit();
  };

  async function toggle() {
    if (!signedInHint()) return signIn();
    const was = saved.has(slug);
    set(!was); // show it straight away; undo if the server says no
    const r = await toggleSaved(slug).catch(() => null);
    if (r?.ok) return set(r.saved);
    set(was);
    if (r && "signIn" in r) signIn();
  }

  return [isSaved, toggle] as const;
}
