import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "@/components/market/Icons";
import { FloatingConcierge, Footer, Header, Reveal } from "@/components/market/Sections";
import { getMembership } from "@/lib/membership";
import { BENEFITS, MEMBERSHIP_USD, canJoin, describeMembership, formatGhs } from "@/lib/membership-plan";
import { STAGGER } from "@/lib/motion";
import { paystackReady, planPrice } from "@/lib/paystack";
import { pageMeta } from "@/lib/site";
import { getUser } from "@/lib/users";
import { JoinButton } from "./JoinButton";

export const metadata: Metadata = pageMeta({
  title: "Concierge membership — The Plug Africa",
  description: `Priority with a Plug concierge, checks before you pay and quick tasks done for you. $${MEMBERSHIP_USD} a month, optional, cancel any time.`,
  path: "/membership",
});

const FAQ = [
  {
    q: "Do I need it to use The Plug?",
    a: "No. Everyone can search the directory, contact businesses and ask a concierge for help. The membership is optional and adds priority and extras.",
  },
  {
    q: "Is it the same as the concierge fee?",
    a: "No. When a concierge handles a deal for you, there's a separate fee for that deal, agreed with you before any work starts.",
  },
  {
    q: "How do I pay?",
    a: "By card, through Paystack. The price is in dollars and charged in cedis each month. The Plug never sees your card details.",
  },
  {
    q: "Can I cancel?",
    a: "Any time, from your account. You keep the benefits until the end of the month you've paid for, and you won't be charged again.",
  },
];

export default async function MembershipPage() {
  const [user, price] = await Promise.all([getUser(), planPrice()]);
  const membership = user ? await getMembership(user.id) : null;
  const ready = paystackReady();
  const joinable = canJoin(membership);

  return (
    <main className="min-h-screen bg-white text-navy">
      <Header />
      <section className="mx-auto grid max-w-[1280px] gap-10 px-5 pt-10 md:px-8 lg:grid-cols-[1fr_440px] lg:gap-16 lg:pt-16">
        <div>
          <p className="text-[13px] font-semibold tracking-[0.14em] text-gold-ink uppercase">Concierge membership</p>
          <h1 className="mt-3 font-heading text-[36px] leading-[1.08] font-extrabold tracking-[-0.03em] md:text-[52px]">A Plug concierge on your side, all month.</h1>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-navy/65">
            For people who rely on The Plug to get things done: moving here, hiring, renting or running a business. Members come first with the concierge, and get checks and small tasks done for them.
          </p>
          <ul className="mt-9 space-y-4">
            {BENEFITS.map((b, i) => (
              <Reveal as="li" key={b.title} delay={i * STAGGER} className="flex gap-4">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ok-soft text-ok"><Check className="h-4 w-4" /></span>
                <span>
                  <span className="block font-heading text-[17px] font-bold">{b.title}</span>
                  <span className="mt-0.5 block text-[15px] leading-relaxed text-navy/65">{b.body}</span>
                </span>
              </Reveal>
            ))}
          </ul>
        </div>

        <aside className="lg:pt-2">
          <div className="rounded-hero border border-navy/10 bg-white p-7 shadow-card md:p-9 lg:sticky lg:top-24">
            <p className="font-heading text-[17px] font-bold">Concierge membership</p>
            <p className="mt-4 flex items-baseline gap-2">
              <span className="font-heading text-[48px] leading-none font-extrabold tracking-[-0.03em]">${MEMBERSHIP_USD}</span>
              <span className="text-[16px] text-navy/65">a month</span>
            </p>
            <p className="mt-2 text-[14.5px] text-navy/65">
              {price ? `Charged as ${formatGhs(price.amount)} a month by Paystack.` : "Charged in cedis at checkout, through Paystack."}
            </p>
            <ul className="mt-6 space-y-2.5 text-[14.5px] text-navy/80">
              {["Optional: everything else on The Plug stays free", "Cancel any time from your account", "Paid by card; The Plug never sees your card"].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-ok" />
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-7">
              {membership && !joinable ? (
                <div className="rounded-panel bg-cream p-5">
                  <p className="font-semibold">You&apos;re a member.</p>
                  <p className="mt-1 text-[14.5px] text-navy/65">{describeMembership(membership)}</p>
                  <Link href="/account" className="mt-3 inline-block text-[14.5px] font-semibold underline-offset-4 hover:underline">Manage it in your account</Link>
                </div>
              ) : !ready ? (
                <div className="rounded-panel bg-cream p-5">
                  <p className="font-semibold">Membership opens soon.</p>
                  <p className="mt-1 text-[14.5px] text-navy/65">
                    {user ? "We'll email you when it does." : <>Create an account now and we&apos;ll email you when it opens. <Link href="/account/sign-in?next=%2Fmembership" className="font-semibold text-navy underline-offset-4 hover:underline">Sign in</Link></>}
                  </p>
                </div>
              ) : (
                <JoinButton signedIn={Boolean(user)} />
              )}
            </div>
          </div>
        </aside>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 pt-20 pb-24 md:px-8">
        <h2 className="font-heading text-[26px] font-bold md:text-[30px]">Questions</h2>
        <dl className="mt-6 grid gap-4 md:grid-cols-2">
          {FAQ.map((f) => (
            <div key={f.q} className="rounded-panel bg-cream p-6">
              <dt className="font-heading text-[17px] font-bold">{f.q}</dt>
              <dd className="mt-2 text-[15px] leading-relaxed text-navy/65">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>
      <Footer />
      <FloatingConcierge />
    </main>
  );
}
