import type { Metadata } from "next";
import Link from "next/link";
import { ListingCard } from "@/components/market/ListingCard";
import { FloatingConcierge, Footer, Header } from "@/components/market/Sections";
import { LinkButton } from "@/components/ui/Button";
import { getPublicListings } from "@/lib/data";
import { db } from "@/lib/db";
import { getCat } from "@/lib/directory";
import { toCardListing } from "@/lib/listings";
import { getMembership } from "@/lib/membership";
import { MEMBERSHIP_USD, canJoin, describeMembership } from "@/lib/membership-plan";
import { requireUser } from "@/lib/users";
import { signOut } from "./actions";
import { DeleteAccount, MembershipControls, ProfileForm } from "./AccountForms";

export const metadata: Metadata = { title: "Your account — The Plug Africa", robots: { index: false, follow: false } };

// What a visitor sees for each status the team sets in the admin.
const CONCIERGE_STATUS: Record<string, string> = { new: "Received", in_progress: "In progress", done: "Done", closed: "Closed" };
const REQUEST_STATUS: Record<string, string> = { new: "Sent", contacted: "Business contacted", converted: "Done", closed: "Closed" };

type Row = { ref: string; title: string; detail: string | null; status: string; date: Date; href: string | null };

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Accra" });

export default async function AccountPage() {
  const user = await requireUser("/account");
  // Requests sent while signed in, and earlier ones sent with this (now verified) email address.
  const mine = { OR: [{ userId: user.id }, { email: { equals: user.email, mode: "insensitive" as const } }] };
  const [concierge, enquiries, savedRows, listings, membership] = await Promise.all([
    db.conciergeRequest.findMany({
      where: mine,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { ref: true, category: true, service: true, status: true, createdAt: true, business: { select: { name: true } } },
    }),
    db.enquiry.findMany({
      where: mine,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { ref: true, kind: true, status: true, createdAt: true, business: { select: { name: true, slug: true } } },
    }),
    db.savedBusiness.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, select: { business: { select: { slug: true } } } }),
    getPublicListings(),
    getMembership(user.id),
  ]);

  const rows: Row[] = [
    ...concierge.map((c) => ({
      ref: c.ref,
      title: "Concierge request",
      detail: [getCat(c.category)?.name ?? c.category, c.service, c.business?.name].filter(Boolean).join(" · "),
      status: CONCIERGE_STATUS[c.status] ?? c.status,
      date: c.createdAt,
      href: null,
    })),
    ...enquiries.map((e) => ({
      ref: e.ref,
      title: e.kind === "request" ? `Request to ${e.business?.name ?? "a business"}` : `Contact details for ${e.business?.name ?? "a business"}`,
      detail: null,
      status: e.kind === "request" ? (REQUEST_STATUS[e.status] ?? e.status) : "Shared with you",
      date: e.createdAt,
      href: e.business ? `/listing/${e.business.slug}` : null,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const order = savedRows.map((s) => s.business.slug);
  const saved = listings.filter((l) => order.includes(l.slug)).sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug)).map(toCardListing);

  return (
    <main className="min-h-screen bg-white text-navy">
      <Header />
      <section className="mx-auto max-w-[1280px] px-5 pt-10 md:px-8 md:pt-14">
        <p className="text-[13px] font-semibold tracking-[0.14em] text-gold-ink uppercase">Your account</p>
        <h1 className="mt-3 font-heading text-[32px] leading-[1.08] font-extrabold tracking-[-0.03em] md:text-[44px]">
          {user.name ? `Hello, ${user.name.split(" ")[0]}` : "Hello"}
        </h1>
        <p className="mt-3 text-[15.5px] text-navy/65">
          {user.email} · with The Plug since {new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "Africa/Accra" }).format(user.createdAt)}
        </p>
      </section>

      <section className="mx-auto grid max-w-[1280px] gap-10 px-5 pt-10 pb-20 md:px-8 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
        <div className="min-w-0 space-y-12">
          <div>
            <h2 className="font-heading text-[22px] font-bold">Your requests</h2>
            {rows.length === 0 ? (
              <div className="mt-4 rounded-panel bg-cream p-6">
                <p className="text-[15px] leading-relaxed text-navy/65">
                  Nothing yet. Requests you send while signed in, or with {user.email}, show up here with their reference and progress.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <LinkButton href="/explore" size="sm">Explore businesses</LinkButton>
                  <LinkButton href="/concierge" size="sm" variant="secondary">Ask a concierge</LinkButton>
                </div>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-navy/10 rounded-panel border border-navy/10">
                {rows.map((r) => (
                  <li key={r.ref} className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 p-5">
                    <div className="min-w-0">
                      <p className="font-heading text-[16px] font-bold">
                        {r.href ? <Link href={r.href} className="hover:underline">{r.title}</Link> : r.title}
                      </p>
                      {r.detail && <p className="mt-0.5 text-[14px] text-navy/65">{r.detail}</p>}
                      <p className="mt-1.5 text-[13px] text-navy/65">
                        <span className="font-mono font-semibold tracking-wide text-navy">{r.ref}</span> · {dateFmt.format(r.date)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-cream px-3 py-1 text-[12.5px] font-semibold text-navy">{r.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="font-heading text-[22px] font-bold">Saved businesses</h2>
            {saved.length === 0 ? (
              <p className="mt-4 rounded-panel bg-cream p-6 text-[15px] leading-relaxed text-navy/65">
                Tap the heart on any business to keep it here.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
                {saved.map((l) => (
                  <ListingCard key={l.slug} l={l} sizes="(min-width:1280px) 25vw, (min-width:640px) 45vw, 90vw" />
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className={`rounded-panel p-6 ${membership && !canJoin(membership) ? "bg-navy text-white" : "bg-cream"}`}>
            <h2 className="font-heading text-[18px] font-bold">Concierge membership</h2>
            {membership && !canJoin(membership) ? (
              <>
                <p className="mt-2 text-[14.5px] leading-relaxed text-white/75">{describeMembership(membership)}</p>
                <MembershipControls status={membership.status} />
              </>
            ) : (
              <>
                <p className="mt-2 text-[14.5px] leading-relaxed text-navy/65">
                  Priority with the concierge, checks before you pay and quick tasks done for you. ${MEMBERSHIP_USD} a month, cancel any time.
                </p>
                <LinkButton href="/membership" size="sm" className="mt-4">See the membership</LinkButton>
              </>
            )}
          </div>
          <ProfileForm name={user.name ?? ""} phone={user.phone ?? ""} />
          <div className="rounded-panel border border-navy/10 p-6">
            <h2 className="font-heading text-[18px] font-bold">Signing in</h2>
            <p className="mt-2 text-[14.5px] leading-relaxed text-navy/65">You sign in with a code sent to {user.email}. There&apos;s no password.</p>
            <form action={signOut} className="mt-4">
              <button type="submit" className="press h-10 rounded-full border border-navy/15 px-5 text-[14px] font-semibold text-navy hover:border-navy/40">
                Sign out
              </button>
            </form>
          </div>
          <DeleteAccount />
        </aside>
      </section>
      <Footer />
      <FloatingConcierge />
    </main>
  );
}
