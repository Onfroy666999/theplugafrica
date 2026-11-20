"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const MIN_GAP_MS = 10_000;

/**
 * Reloads the admin page's data when you come back to the tab (issue #118): a fee paid, a request sent or a member
 * joining in the meantime shows without pressing refresh. At most once every 10 seconds, and never while the tab is
 * hidden. What you're typing is kept: only the server data is fetched again.
 */
export function RefreshOnReturn() {
  const router = useRouter();
  useEffect(() => {
    let last = Date.now();
    const back = () => {
      if (document.visibilityState !== "visible" || Date.now() - last < MIN_GAP_MS) return;
      last = Date.now();
      router.refresh();
    };
    document.addEventListener("visibilitychange", back);
    window.addEventListener("focus", back);
    return () => {
      document.removeEventListener("visibilitychange", back);
      window.removeEventListener("focus", back);
    };
  }, [router]);
  return null;
}
