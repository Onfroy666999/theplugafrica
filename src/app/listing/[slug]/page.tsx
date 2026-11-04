import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Star } from "@/components/market/Icons";
import { ListingCard, StatusBadge } from "@/components/market/ListingCard";
import { Footer, Header, Reveal } from "@/components/market/Sections";
import { CATS } from "@/lib/directory";
import { LISTINGS, getListing, reviewsFor } from "@/lib/listings";
import { ContactPanel } from "./ContactPanel";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return LISTINGS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const l = getListing((await params).slug);
  return l ? { title: `${l.name} — ${l.kind} in ${l.area}, ${l.city} · The Plug Africa`, description: l.blurb } : {};
}

export default async function ListingPage({ params }: Props) {
  const l = getListing((await params).slug);
  if (!l) notFound();
  const cat = CATS.find((c) => c.key === l.cat)!;
  const reviews = reviewsFor(l);
  const similar = LISTINGS.filter((x) => x.cat === l.cat && x.slug !== l.slug).slice(0, 4);
  const imgs = l.images.length >= 3 ? l.images.slice(0, 3) : [...l.images, ...cat.tiles.map((t) => t.img).filter((i) => !l.images.includes(i))].slice(0, 3);

  return (
    <main className="min-h-screen bg-white pb-20 text-navy lg:pb-0">
      <Header />
      <div className="mx-auto max-w-[1280px] px-5 pt-6 md:px-8">
        {/* Breadcrumb */}
        <nav className="text-[13px] text-navy/55">
          <Link href="/explore" className="hover:text-navy">Explore</Link>
          <span className="mx-2">/</span>
          <Link href={`/explore?cat=${l.cat}`} className="hover:text-navy">{cat.name}</Link>
          <span className="mx-2">/</span>
          <span className="text-navy">{l.name}</span>
        </nav>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-[28px] leading-tight font-extrabold tracking-[-0.03em] text-navy md:text-[38px]">{l.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] text-navy/65">
              <span className="flex items-center gap-1 font-semibold text-navy"><Star className="h-4 w-4 text-gold" /> {l.rating.toFixed(1)} <span className="font-normal text-navy/55">({l.reviewCount} reviews)</span></span>
              <span>{l.kind}</span>
              <span>{l.area}, {l.city}</span>
              <StatusBadge status={l.status} />
            </div>
          </div>
          <span className="rounded-full bg-cream px-3 py-1.5 text-[12px] font-semibold text-navy/70">Example listing</span>
        </div>

        {/* Gallery: one large + two stacked (Airbnb pattern) */}
        <div className="mt-6 grid h-[300px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-panel md:h-[440px]">
          {imgs.map((src, i) => (
            <div key={src} className={`relative overflow-hidden bg-navy/5 ${i === 0 ? "col-span-4 row-span-2 md:col-span-3" : "hidden md:block"}`}>
              <Image src={src} alt={`${l.name} photo ${i + 1}`} fill priority={i === 0} sizes={i === 0 ? "(min-width:768px) 75vw, 100vw" : "25vw"} className="object-cover" />
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_380px]">
          <div>
            <Reveal>
              <p className="text-[17px] leading-relaxed text-navy/80">{l.blurb}</p>
              <p className="mt-4 text-[15.5px] leading-relaxed text-navy/65">{l.about}</p>
              <p className="mt-4 text-[14px] text-navy/55">Languages: {l.languages.join(", ")}</p>
            </Reveal>

            {/* Credentials */}
            <Reveal className="mt-10 border-t border-navy/10 pt-10">
              <h2 className="font-heading text-[22px] font-bold text-navy">What we&apos;ve checked</h2>
              <p className="mt-1 text-[14px] text-navy/55">Our team reviews documents before a business is marked Verified.</p>
              <ul className="mt-5 divide-y divide-navy/[0.07] rounded-card border border-navy/10">
                {l.credentials.map((c) => (
                  <li key={c.label} className="flex items-center justify-between gap-4 px-5 py-4 text-[15px]">
                    <span className="text-navy">{c.label}</span>
                    {c.state === "verified" ? (
                      <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-ok-soft px-2.5 py-1 text-[12px] font-semibold text-ok"><Check className="h-3.5 w-3.5" /> Checked</span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-warn-soft px-2.5 py-1 text-[12px] font-semibold text-warn">In review</span>
                    )}
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* Reviews */}
            <Reveal className="mt-10 border-t border-navy/10 pt-10">
              <h2 className="flex items-center gap-2 font-heading text-[22px] font-bold text-navy">
                <Star className="h-5 w-5 text-gold" /> {l.rating.toFixed(1)} · {l.reviewCount} reviews
              </h2>
              <p className="mt-1 text-[14px] text-navy/55">Example reviews. Real reviews are moderated before they appear.</p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {reviews.map((r, i) => (
                  <figure key={i} className="rounded-card bg-cream p-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy font-heading text-[14px] font-bold text-white">E</span>
                      <div>
                        <p className="text-[14px] font-semibold text-navy">{r.name}</p>
                        <p className="text-[12.5px] text-navy/50">{r.when}</p>
                      </div>
                      <span className="ml-auto flex">
                        {Array.from({ length: 5 }, (_, k) => <Star key={k} className={`h-3.5 w-3.5 ${k < r.rating ? "text-gold" : "text-navy/15"}`} />)}
                      </span>
                    </div>
                    <blockquote className="mt-3 text-[15px] leading-relaxed text-navy/75">{r.text}</blockquote>
                  </figure>
                ))}
              </div>
              <Button variant="secondary" className="mt-5">Write a review</Button>
            </Reveal>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <ContactPanel l={l} />
          </aside>
        </div>

        {similar.length > 0 && (
          <section className="mt-20 border-t border-navy/10 pt-12">
            <h2 className="font-heading text-[24px] font-bold text-navy">More in {cat.name}</h2>
            <div className="mt-6 grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
              {similar.map((s, i) => (
                <Reveal key={s.slug} delay={i * 0.05}><ListingCard l={s} /></Reveal>
              ))}
            </div>
          </section>
        )}
      </div>
      <Footer />
    </main>
  );
}
