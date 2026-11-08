import type { Metadata } from "next";
import Link from "next/link";
import { Lockup } from "@/components/Logo";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { can, roleLabel } from "@/lib/roles";
import { logout } from "../actions";
import { AdminRoleProvider } from "./AdminContext";
import { AdminNav, type NavItem } from "./AdminNav";

export const metadata: Metadata = { title: "Admin — The Plug Africa", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const [enq, cnc, wl, msg, rev] = await Promise.all([
    db.enquiry.count({ where: { status: "new" } }),
    db.conciergeRequest.count({ where: { status: "new" } }),
    db.waitlistEntry.count({ where: { status: "new" } }),
    db.contactMessage.count({ where: { status: "new" } }),
    db.review.count({ where: { status: "pending" } }),
  ]);
  const items: NavItem[] = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/businesses", label: "Businesses" },
    { href: "/admin/services", label: "Services" },
    { href: "/admin/emergency", label: "Emergency" },
    { href: "/admin/enquiries", label: "Enquiries", count: enq },
    { href: "/admin/concierge", label: "Concierge", count: cnc },
    { href: "/admin/waitlist", label: "Waitlist", count: wl },
    { href: "/admin/messages", label: "Messages", count: msg },
    { href: "/admin/reviews", label: "Reviews", count: rev },
    ...(can(admin.role, "team")
      ? [
          { href: "/admin/team", label: "Team" },
          { href: "/admin/activity", label: "Activity" },
        ]
      : []),
    { href: "/admin/account", label: "My account" },
  ];
  const first = admin.name.split(" ")[0];
  const role = roleLabel(admin.role);

  return (
    <div className="min-h-screen bg-cream/60 lg:grid lg:grid-cols-[248px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-navy/10 bg-white px-4 py-6 lg:flex">
        <Link href="/admin" className="px-2"><Lockup tone="light" /></Link>
        <p className="mt-2 px-2 text-[11px] font-semibold tracking-[0.16em] text-gold uppercase">Admin</p>
        <div className="mt-8 min-h-0 overflow-y-auto"><AdminNav items={items} layout="side" /></div>
        <div className="mt-auto space-y-1 border-t border-navy/10 pt-4">
          <Link href="/" target="_blank" className="press flex h-10 items-center rounded-full px-4 text-[14px] text-navy/60 hover:text-navy">View site ↗</Link>
          <p className="px-4 pt-2 text-[13px] font-semibold text-navy">{admin.name}</p>
          <p className="px-4 text-[12px] text-navy/50">{role}</p>
          <form action={logout}>
            <button className="press flex h-10 items-center rounded-full px-4 text-[14px] text-navy/60 hover:text-navy">Sign out</button>
          </form>
        </div>
      </aside>

      {/* Phone/tablet top bar */}
      <header className="sticky top-0 z-40 border-b border-navy/10 bg-white/95 backdrop-blur-md lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/admin"><Lockup tone="light" /></Link>
          <form action={logout}>
            <button className="press h-10 rounded-full px-4 text-[14px] font-medium text-navy hover:bg-navy/[0.05]">Sign out</button>
          </form>
        </div>
        <div className="px-3 pb-2"><AdminNav items={items} layout="top" /></div>
      </header>

      <main className="min-w-0 px-4 py-6 md:px-8 md:py-10">
        <p className="mb-1 text-[13px] text-navy/50">
          Signed in as {first} · {role}
          {admin.role === "viewer" && " (view only)"}
        </p>
        <AdminRoleProvider role={admin.role}>{children}</AdminRoleProvider>
      </main>
    </div>
  );
}
