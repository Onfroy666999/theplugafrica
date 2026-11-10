import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SuccessIcon } from "@/components/market/Form";
import { Footer, Header } from "@/components/market/Sections";
import { db } from "@/lib/db";
import { percentLabel } from "@/lib/fees";
import { formatGhs } from "@/lib/membership-plan";
import { PayButton } from "./PayButton";

export const metadata: Metadata = { title: "Pay your fee — The Plug Africa", robots: { index: false, follow: false } };

/** The page an emailed fee link opens (issue #84): what the fee is for, and a button to pay it through Paystack. */
export default async function PayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const fee = await db.conciergeFee.findUnique({
    where: { token },
    include: { deal: { select: { description: true, businessName: true, valuePesewas: true, customerRate: true, businessRate: true } } },
  });
  if (!fee) notFound();
  const d = fee.deal;
  const rate = percentLabel(fee.party === "customer" ? d.customerRate : d.businessRate);
  const rows: [string, string][] = [
    ["For", d.description],
    [fee.party === "customer" ? "Business" : "Introduced by", fee.party === "customer" ? d.businessName : "The Plug concierge"],
    ["Agreed price", formatGhs(d.valuePesewas)],
    [`The Plug's fee (${rate})`, formatGhs(fee.amountPesewas)],
    ["Fee reference", fee.ref],
  ];

  return (
    <main className="min-h-screen bg-cream text-navy">
      <Header />
      <section className="mx-auto max-w-[560px] px-5 pt-10 pb-24 md:pt-16">
        <div className="rounded-hero border border-navy/10 bg-white p-7 shadow-card md:p-9">
          {fee.status === "paid" ? (
            <>
              <SuccessIcon />
              <h1 className="mt-5 font-heading text-[28px] leading-tight font-extrabold tracking-[-0.02em]">Paid. Thank you.</h1>
              <p className="mt-3 text-[15.5px] leading-relaxed text-navy/65">Fee {fee.ref} for {d.description} has been paid. Paystack emailed you a receipt.</p>
            </>
          ) : fee.status !== "due" ? (
            <>
              <h1 className="font-heading text-[26px] leading-tight font-extrabold tracking-[-0.02em]">Nothing to pay</h1>
              <p className="mt-3 text-[15.5px] leading-relaxed text-navy/65">Fee {fee.ref} is no longer due. If you think that&apos;s wrong, reply to the email it came with.</p>
            </>
          ) : (
            <>
              <p className="text-[13px] font-semibold tracking-[0.14em] text-gold-ink uppercase">{fee.party === "customer" ? "Concierge fee" : "Introduction fee"}</p>
              <h1 className="mt-2 font-heading text-[30px] leading-tight font-extrabold tracking-[-0.02em]">{formatGhs(fee.amountPesewas)}</h1>
              <p className="mt-2 text-[15px] text-navy/65">For {fee.name}</p>
              <dl className="mt-6 divide-y divide-navy/10 border-y border-navy/10 text-[14.5px]">
                {rows.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-6 py-3">
                    <dt className="text-navy/65">{k}</dt>
                    <dd className="text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6">
                <PayButton token={fee.token} amount={formatGhs(fee.amountPesewas)} needsEmail={!fee.email} />
              </div>
              <p className="mt-5 text-[13px] leading-relaxed text-navy/65">
                {fee.party === "customer"
                  ? `This is The Plug's fee for handling your request. You pay ${d.businessName} directly for the service itself; The Plug never holds that money.`
                  : "This is The Plug's fee for the introduction. The Plug never handles the payment between you and your customer."}
              </p>
            </>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
