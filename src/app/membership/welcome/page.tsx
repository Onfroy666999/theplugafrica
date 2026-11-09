import type { Metadata } from "next";
import { SuccessIcon } from "@/components/market/Form";
import { Footer, Header } from "@/components/market/Sections";
import { LinkButton } from "@/components/ui/Button";
import { confirmCheckout, getMembership } from "@/lib/membership";
import { BENEFITS, hasBenefits } from "@/lib/membership-plan";
import { verifyTransaction } from "@/lib/paystack";
import { requireUser } from "@/lib/users";

export const metadata: Metadata = { title: "Welcome — The Plug Africa", robots: { index: false, follow: false } };

type SP = Promise<{ reference?: string; trxref?: string }>;

/** Paystack sends members back here after checkout (issue #83). The payment is checked with Paystack, not trusted from the address. */
export default async function Welcome({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const reference = String(sp.reference ?? sp.trxref ?? "").slice(0, 100);
  const user = await requireUser(`/membership/welcome${reference ? `?reference=${encodeURIComponent(reference)}` : ""}`);
  const confirmed = reference ? await confirmCheckout(user.id, user.email, await verifyTransaction(reference)) : false;
  const member = confirmed || hasBenefits(await getMembership(user.id));

  return (
    <main className="min-h-screen bg-cream text-navy">
      <Header />
      <section className="mx-auto max-w-[640px] px-5 pt-12 pb-24 md:pt-20">
        <div className="rounded-hero border border-navy/10 bg-white p-7 shadow-card md:p-10">
          {member ? (
            <>
              <SuccessIcon />
              <h1 className="mt-5 font-heading text-[28px] leading-tight font-extrabold tracking-[-0.02em] md:text-[34px]">Welcome, you&apos;re a member</h1>
              <p className="mt-3 text-[15.5px] leading-relaxed text-navy/65">Paystack emails your receipt, and we&apos;ve sent you a welcome. Here&apos;s what you can use from today:</p>
              <ul className="mt-5 space-y-2 text-[15px]">
                {BENEFITS.map((b) => (
                  <li key={b.title}>
                    <strong className="font-semibold">{b.title}.</strong> <span className="text-navy/65">{b.body}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex flex-wrap gap-3">
                <LinkButton href="/concierge">Ask a concierge</LinkButton>
                <LinkButton href="/account" variant="secondary">Your account</LinkButton>
              </div>
            </>
          ) : (
            <>
              <h1 className="font-heading text-[28px] leading-tight font-extrabold tracking-[-0.02em]">We haven&apos;t received the payment yet</h1>
              <p className="mt-3 text-[15.5px] leading-relaxed text-navy/65">
                If you completed the payment, it can take a minute to reach us: refresh this page shortly. If you left the checkout or the card was declined, nothing was charged; you can try again.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <LinkButton href="/membership">Back to membership</LinkButton>
                <LinkButton href="/account" variant="secondary">Your account</LinkButton>
              </div>
            </>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
