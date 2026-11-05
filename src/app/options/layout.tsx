import type { Metadata } from "next";

// Design reference pages: kept for the owner, hidden from search engines.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function OptionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
