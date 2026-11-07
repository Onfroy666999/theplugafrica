import type { Metadata } from "next";
import Link from "next/link";
import { Lockup } from "@/components/Logo";
import { findInvite } from "@/lib/invites";
import { aRole } from "@/lib/roles";
import { AcceptForm } from "./AcceptForm";

export const metadata: Metadata = { title: "Join the admin — The Plug Africa", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Opened from an invitation or password link (issue #18). Works without being signed in. */
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inv = await findInvite(token);
  const join = inv?.purpose === "invite";

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-5 py-16">
      <div className="w-full max-w-[440px]">
        <div className="flex justify-center"><Lockup tone="light" /></div>
        <div className="mt-8 rounded-hero border border-navy/10 bg-white p-7 shadow-card md:p-9">
          {!inv ? (
            <>
              <h1 className="font-heading text-[24px] font-bold text-navy">This link doesn&apos;t work any more</h1>
              <p className="mt-2 text-[15px] text-navy/60">It has expired or was already used. Ask an owner of The Plug Africa admin to send you a new one.</p>
              <Link href="/admin/login" className="press mt-6 inline-flex h-12 items-center rounded-full px-1 text-[15px] font-semibold text-navy hover:underline">Go to sign in →</Link>
            </>
          ) : (
            <>
              <h1 className="font-heading text-[24px] font-bold text-navy">{join ? "Join The Plug Africa admin" : "Set a new password"}</h1>
              <p className="mt-1 mb-7 text-[14.5px] text-navy/60">
                {join ? `You're joining as ${aRole(inv.role)} with ${inv.email}.` : `For ${inv.email}. Choosing a new password signs you out everywhere else.`}
              </p>
              <AcceptForm token={token} join={join} name={inv.name} email={inv.email} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
