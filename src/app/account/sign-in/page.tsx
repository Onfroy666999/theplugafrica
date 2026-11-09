import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Footer, Header } from "@/components/market/Sections";
import { safeNext } from "@/lib/signin-code";
import { getUser } from "@/lib/users";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = {
  title: "Sign in — The Plug Africa",
  description: "Sign in to see your requests and saved businesses.",
  robots: { index: false, follow: false },
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getUser()) redirect(next);
  return (
    <main className="min-h-screen bg-cream text-navy">
      <Header />
      <section className="mx-auto max-w-[520px] px-5 pt-10 pb-24 md:pt-16">
        <SignInForm next={next} />
      </section>
      <Footer />
    </main>
  );
}
