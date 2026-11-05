import type { Metadata } from "next";
import { pageMeta } from "@/lib/site";
import Image from "next/image";
import { CatIcon } from "@/components/market/Icons";
import { Footer, Header } from "@/components/market/Sections";
import { EmergencyClient } from "./EmergencyClient";

export const metadata: Metadata = pageMeta({
  title: "Emergency contacts — The Plug Africa",
  description: "Hospitals, police, fire, embassies and pharmacies by city.",
  path: "/emergency",
});

export default function EmergencyPage() {
  return (
    <main className="min-h-screen bg-white text-navy">
      <Header />
      <section className="mx-auto max-w-[1280px] px-3 pt-2 md:px-8 md:pt-4">
        <div className="relative isolate overflow-hidden rounded-hero md:rounded-hero">
          <Image src="/images/emergency.jpg" alt="Ambulance crew at work" fill priority sizes="100vw" className="-z-10 object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
          <div className="max-w-2xl px-6 py-14 md:px-14 md:py-20">
            <span className="flex h-12 w-12 items-center justify-center rounded-card bg-ember text-white"><CatIcon k="emergency" /></span>
            <h1 className="mt-5 font-heading text-[34px] leading-[1.08] font-extrabold tracking-[-0.03em] text-white md:text-[50px]">Emergency contacts</h1>
            <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-white/80">Hospitals, police, fire services, embassies and pharmacies for your city.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 pt-10 md:px-8">
        <div role="note" className="rounded-card border border-ember/30 bg-ember-soft p-5 text-[15px] leading-relaxed text-navy md:p-6">
          <strong>We&apos;re verifying every number before we publish it.</strong> Until then, use official government sources or ask your hotel, landlord or embassy. In a life-threatening emergency, call your local emergency number straight away.
        </div>
        <div className="mt-10">
          <EmergencyClient />
        </div>
      </section>
      <Footer />
    </main>
  );
}
