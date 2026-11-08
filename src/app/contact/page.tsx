import type { Metadata } from "next";
import Link from "next/link";
import { Arrow, CatIcon, Chat, Shield } from "@/components/market/Icons";
import { FloatingConcierge, Footer, Header, Reveal } from "@/components/market/Sections";
import { STAGGER } from "@/lib/motion";
import { pageMeta } from "@/lib/site";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = pageMeta({
  title: "Contact — The Plug Africa",
  description: "Questions, feedback, a listing to report or a partnership to discuss: send The Plug Africa a message.",
  path: "/contact",
});

/** Faster routes for the things people most often get in touch about. */
const ROUTES = [
  { href: "/concierge", title: "Need someone found for you?", body: "A Plug concierge finds, introduces and follows up. It's a paid service.", icon: <Chat className="h-5 w-5" /> },
  { href: "/businesses", title: "Own a business?", body: "Join the waitlist to be verified and listed.", icon: <Shield className="h-5 w-5" /> },
  { href: "/emergency", title: "Is it urgent?", body: "Hospitals, police, fire and embassies by city.", icon: <CatIcon k="emergency" className="h-5 w-5" /> },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white text-navy">
      <Header />
      <section className="mx-auto max-w-[1280px] px-5 pt-10 md:px-8 md:pt-16">
        <p className="text-[13px] font-semibold tracking-[0.14em] text-gold-ink uppercase">Contact</p>
        <h1 className="mt-3 max-w-2xl font-heading text-[34px] leading-[1.08] font-extrabold tracking-[-0.03em] md:text-[50px]">Talk to The Plug team</h1>
        <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-navy/65">
          Questions, feedback, a listing that doesn&apos;t look right, or an idea for working together. We read every message and reply by email or phone.
        </p>
      </section>

      <section className="mx-auto grid max-w-[1280px] gap-8 px-5 pt-10 md:px-8 lg:grid-cols-[1.25fr_1fr] lg:gap-12">
        <div id="message" className="scroll-mt-24">
          <ContactForm />
        </div>
        <div>
          <h2 className="font-heading text-[19px] font-bold text-navy">Quicker routes</h2>
          <ul className="mt-4 space-y-3">
            {ROUTES.map((r, i) => (
              <li key={r.href}>
                <Reveal delay={i * STAGGER}>
                  <Link href={r.href} className="press group flex items-start gap-4 rounded-panel bg-cream p-5 transition-shadow duration-200 hover:shadow-card">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-white text-gold">{r.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-heading text-[16.5px] font-bold text-navy">{r.title}</span>
                      <span className="mt-1 block text-[14.5px] leading-relaxed text-navy/65">{r.body}</span>
                    </span>
                    <Arrow className="mt-1 h-4 w-4 shrink-0 text-navy/65 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
          <p className="mt-6 rounded-panel border border-navy/10 p-5 text-[14.5px] leading-relaxed text-navy/65">
            <strong className="text-navy">About a business you found here?</strong> Use the contact button on its listing to reach the business directly. Use this form to report a listing.
          </p>
        </div>
      </section>
      <Footer />
      <FloatingConcierge />
    </main>
  );
}
