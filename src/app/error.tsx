"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect } from "react";
import { Footer, Header } from "@/components/market/Sections";
import { Button, LinkButton } from "@/components/ui/Button";

/** Shown when a page fails to load (issue #28). The digest lets us find the error in the server logs. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  // Server errors need fresh data from the server, so refresh the route as well as resetting the boundary.
  const retry = () => startTransition(() => { router.refresh(); reset(); });
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-white text-navy">
      <Header />
      <section className="mx-auto max-w-[720px] px-5 pt-16 pb-24 text-center md:pt-24">
        <p className="text-[14px] font-semibold tracking-[0.12em] text-ember uppercase">Something went wrong</p>
        <h1 className="mt-3 font-heading text-[32px] leading-tight font-extrabold tracking-[-0.03em] md:text-[44px]">This page didn&apos;t load</h1>
        <p className="mx-auto mt-3 max-w-md text-[16px] text-navy/60">It&apos;s a problem on our side, not yours. Try again in a moment; if it keeps happening, a Plug concierge can still help.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={retry}>Try again</Button>
          <LinkButton href="/" variant="secondary">Back to the homepage</LinkButton>
          <LinkButton href="/concierge" variant="ghost">Ask a concierge</LinkButton>
        </div>
        {error.digest && <p className="mt-8 text-[13px] text-navy/40">Reference: {error.digest}</p>}
      </section>
      <Footer />
    </main>
  );
}
