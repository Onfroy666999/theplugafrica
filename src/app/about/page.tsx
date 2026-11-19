import type { Metadata } from "next";
import Image from "next/image";
import { Check, Shield } from "@/components/market/Icons";
import { FloatingConcierge, Footer, Header, Reveal } from "@/components/market/Sections";
import { LinkButton } from "@/components/ui/Button";
import { STAGGER } from "@/lib/motion";
import { pageMeta } from "@/lib/site";
import { getSiteImages } from "@/lib/site-images-server";

// Reads the photos chosen in Admin › Site photos (issue #112).
export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMeta({
  title: "About — The Plug Africa",
  description: "The Plug Africa connects people with verified businesses and services, starting in Ghana. What we do, who it's for, and what we don't do.",
  path: "/about",
  image: "/images/market.jpg",
});

const FOR = [
  { t: "Expats and returnees", d: "Settling in: a home, a school, a driver, someone to help at home." },
  { t: "Investors and researchers", d: "Finding the right firms, advisers and organisations on the ground." },
  { t: "Businesses", d: "Suppliers, recruiters, office space and services you can rely on." },
  { t: "Everyone here already", d: "The same trusted names, whether you've lived here a week or all your life." },
];

const HOW = [
  { t: "We check businesses first", d: "Before a business is listed, we look at its registration, the owner's ID and any licences its trade needs. Verified means every check passed." },
  { t: "You contact them directly", d: "Every listing has its own contact details. Each introduction gets a reference code, so the business knows you came from The Plug." },
  { t: "Or let a concierge handle it", d: "For things that need more care, a Plug concierge finds the right people, makes the introduction, mediates and follows up. It's a paid service." },
];

const DONT = [
  "We don't take payments between you and a business. You pay them directly.",
  "We don't guarantee the outcome of any job or deal. Always check credentials before you commit.",
];

export default async function AboutPage() {
  const img = (await getSiteImages())["page.about"];
  return (
    <main className="min-h-screen bg-white text-navy">
      <Header />

      <section className="mx-auto grid max-w-[1280px] items-center gap-10 px-5 pt-10 md:px-8 md:pt-16 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          <p className="text-[13px] font-semibold tracking-[0.14em] text-gold-ink uppercase">About The Plug</p>
          <h1 className="mt-3 font-heading text-[36px] leading-[1.06] font-extrabold tracking-[-0.03em] md:text-[54px]">The trusted way to find people who get things done.</h1>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-navy/65">
            Finding a good landlord, school, driver or supplier usually depends on who you know. The Plug Africa is a directory of businesses we&apos;ve checked, so anyone can find them, starting in Ghana.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="/explore" size="lg">Explore businesses</LinkButton>
            <LinkButton href="/concierge" variant="secondary" size="lg">Ask a concierge</LinkButton>
          </div>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-hero bg-navy/5 lg:aspect-[5/6]">
          <Image src={img.url} alt={img.alt} fill priority sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" style={{ objectPosition: img.position }} />
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 pt-24 md:px-8">
        <h2 className="font-heading text-[26px] font-bold tracking-[-0.02em] md:text-[32px]">Who it&apos;s for</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FOR.map((f, i) => (
            <Reveal key={f.t} delay={i * STAGGER}>
              <div className="h-full rounded-panel bg-cream p-6">
                <h3 className="font-heading text-[17px] font-bold text-navy">{f.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-navy/65">{f.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 pt-24 md:px-8">
        <h2 className="font-heading text-[26px] font-bold tracking-[-0.02em] md:text-[32px]">How it works</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {HOW.map((h, i) => (
            <Reveal as="li" key={h.t} delay={i * STAGGER} className="h-full rounded-panel border border-navy/10 p-7">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy font-heading text-[15px] font-bold text-white">{i + 1}</span>
                <h3 className="mt-5 font-heading text-[18px] font-bold text-navy">{h.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-navy/65">{h.d}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 pt-24 md:px-8">
        <div className="grid gap-8 rounded-hero bg-navy p-8 text-white md:p-14 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div>
            <span className="flex h-11 w-11 items-center justify-center rounded-card bg-white/10 text-gold-light"><Shield /></span>
            <h2 className="mt-5 font-heading text-[26px] leading-tight font-bold tracking-[-0.02em] md:text-[32px]">What we don&apos;t do</h2>
            <p className="mt-3 text-[16px] leading-relaxed text-white/70">The Plug connects you. The arrangement you make is between you and the business.</p>
          </div>
          <ul className="space-y-4 self-center">
            {DONT.map((d) => (
              <li key={d} className="flex gap-3 text-[16px] leading-relaxed text-white/85">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold text-navy"><Check className="h-3 w-3" /></span>
                {d}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 pt-24 text-center md:px-8">
        <h2 className="font-heading text-[26px] font-bold tracking-[-0.02em] md:text-[32px]">Starting in Accra</h2>
        <p className="mx-auto mt-3 max-w-xl text-[16px] leading-relaxed text-navy/65">
          We&apos;re verifying businesses in Accra first, then other Ghanaian cities, then more of Africa. If you run a business people should be able to trust, we&apos;d like to hear from you.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <LinkButton href="/businesses">List your business</LinkButton>
          <LinkButton href="/contact" variant="secondary">Contact us</LinkButton>
        </div>
      </section>

      <Footer />
      <FloatingConcierge />
    </main>
  );
}
