import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Lockup } from "@/components/Logo";
import { getAdmin } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Admin sign in — The Plug Africa", robots: { index: false, follow: false } };

export default async function AdminLogin() {
  if (await getAdmin()) redirect("/admin");
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-5 py-16">
      <div className="w-full max-w-[420px]">
        <div className="flex justify-center">
          <Lockup tone="light" />
        </div>
        <div className="mt-8 rounded-hero border border-navy/10 bg-white p-7 shadow-card md:p-9">
          <h1 className="font-heading text-[24px] font-bold text-navy">Admin sign in</h1>
          <p className="mt-1 mb-7 text-[14px] text-navy/55">For The Plug Africa team only.</p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
