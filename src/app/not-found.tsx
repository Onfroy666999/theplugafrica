import type { Metadata } from "next";
import Link from "next/link";
import { CatIcon } from "@/components/market/Icons";
import { SearchBar } from "@/components/market/SearchBar";
import { FloatingConcierge, Footer, Header } from "@/components/market/Sections";
import { LinkButton } from "@/components/ui/Button";
import { CATS } from "@/lib/directory";

export const metadata: Metadata = { title: "Page not found — The Plug Africa" };

/** Shown for any unknown address (issue #28). */
export default function NotFound() {
  return (
    <main className="min-h-screen bg-white text-navy">
      <Header />
      <section className="mx-auto max-w-[880px] px-5 pt-16 pb-20 text-center md:pt-24">
        <p className="text-[14px] font-semibold tracking-[0.12em] text-gold uppercase">Page not found</p>
        <h1 className="mt-3 font-heading text-[32px] leading-tight font-extrabold tracking-[-0.03em] md:text-[46px]">We couldn&apos;t find that page</h1>
        <p className="mx-auto mt-3 max-w-lg text-[16px] text-navy/60">The link may be old, or the listing may have moved. Search for what you need, or start from a category.</p>
        <div className="mt-8 text-left">
          <SearchBar initialCity="Any city" />
        </div>
        <ul className="mt-8 flex flex-wrap justify-center gap-2">
          {CATS.filter((c) => c.key !== "emergency").map((c) => (
            <li key={c.key}>
              <Link href={`/explore/${c.key}`} className="press flex h-11 items-center gap-2 rounded-full border border-navy/15 px-4 text-[14px] font-semibold text-navy hover:border-navy/35">
                <CatIcon k={c.key} className="h-[18px] w-[18px]" />
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <LinkButton href="/" variant="secondary">Back to the homepage</LinkButton>
          <LinkButton href="/concierge">Ask a concierge</LinkButton>
        </div>
      </section>
      <Footer />
      <FloatingConcierge />
    </main>
  );
}
