"use client";

import Link from "next/link";
import { useState } from "react";
import { Field, Input, Spinner } from "@/components/market/Form";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { feeAmount, parseCedis, percentLabel } from "@/lib/fees";
import { formatGhs } from "@/lib/membership-plan";
import { recordDeal, type DealResult } from "../../../fee-actions";

type Biz = { id: string; name: string; email: string; phone: string };
const OTHER = "__other";

/** The deal form, with both fees worked out as you type (issue #84). */
export function DealForm({
  request,
  businesses,
  rates,
}: {
  request: { id: string; name: string; phone: string; email: string; member: boolean; businessId: string };
  businesses: Biz[];
  rates: { customer: number; business: number };
}) {
  const [bizId, setBizId] = useState(request.businessId || (businesses[0]?.id ?? OTHER));
  const [value, setValue] = useState("");
  const [chargeCustomer, setChargeCustomer] = useState(true);
  const [chargeBusiness, setChargeBusiness] = useState(true);
  const [send, setSend] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<DealResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const biz = businesses.find((b) => b.id === bizId);
  const pesewas = parseCedis(value);

  if (result?.ok)
    return (
      <div className="rounded-panel border border-navy/10 bg-white p-6 shadow-card">
        <h2 className="font-heading text-[20px] font-bold text-navy">Deal recorded</h2>
        <ul className="mt-4 space-y-3">
          {result.fees.map((f) => (
            <li key={f.ref} className="rounded-card bg-cream p-4 text-[14.5px]">
              <p className="font-semibold text-navy">
                {f.party === "customer" ? "Customer" : "Business"} fee: {f.amount} <span className="font-mono text-[13px] text-navy/65">{f.ref}</span>
              </p>
              <p className="mt-1 text-navy/65">{f.emailed ? "Emailed with the pay link." : "Not emailed. Copy the link and send it by WhatsApp or email."}</p>
              <button
                type="button"
                className="press mt-2 text-[14px] font-semibold text-navy underline-offset-4 hover:underline"
                onClick={() => (navigator.clipboard?.writeText(f.url) ?? Promise.reject()).then(() => setCopied(f.ref), () => window.prompt("Copy the pay link:", f.url))}
              >
                {copied === f.ref ? "Link copied" : "Copy pay link"}
              </button>
            </li>
          ))}
        </ul>
        <Link href="/admin/fees" className="mt-5 inline-block text-[14.5px] font-semibold text-navy hover:underline">Go to fees</Link>
      </div>
    );

  return (
    <form
      className="space-y-6 rounded-panel border border-navy/10 bg-white p-6 shadow-card"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("requestId", request.id);
        fd.set("businessId", bizId === OTHER ? "" : bizId);
        if (chargeCustomer) fd.set("chargeCustomer", "on");
        if (chargeBusiness) fd.set("chargeBusiness", "on");
        if (send) fd.set("send", "on");
        setBusy(true);
        const r = await recordDeal(fd).catch(() => ({ ok: false as const, error: "Something went wrong. Please try again." }));
        setBusy(false);
        setResult(r);
      }}
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Business">
          <Select
            label="Business"
            value={bizId}
            onChange={(v) => setBizId(v)}
            options={[...businesses.map((b) => ({ value: b.id, label: b.name })), { value: OTHER, label: "Not listed on The Plug" }]}
          />
        </Field>
        {bizId === OTHER && (
          <Field label="Business name"><Input label="Business name" name="businessName" required maxLength={160} /></Field>
        )}
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="What the deal is for"><Input label="What the deal is for" name="description" required maxLength={200} placeholder="e.g. 12-month lease, 2-bed in Osu" /></Field>
        <Field label="Agreed price (GHS)"><Input label="Agreed price (GHS)" name="value" required inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. 36000" /></Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-card border border-navy/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-navy">Customer pays {percentLabel(rates.customer)}{request.member && " (member rate)"}</p>
            <Switch label="Charge" checked={chargeCustomer} onChange={setChargeCustomer} />
          </div>
          <p className="mt-1 font-heading text-[22px] font-bold text-navy">{chargeCustomer && pesewas ? formatGhs(feeAmount(pesewas, rates.customer)) : "—"}</p>
          {chargeCustomer && (
            <div className="mt-3 grid gap-3">
              <Input label="Customer name" name="customerName" defaultValue={request.name} placeholder="Name" maxLength={120} />
              <Input label="Customer email" name="customerEmail" type="email" defaultValue={request.email} placeholder="Email for the pay link" maxLength={160} />
              <Input label="Customer phone" name="customerPhone" defaultValue={request.phone} placeholder="Phone or WhatsApp" maxLength={40} />
            </div>
          )}
        </div>
        <div className="rounded-card border border-navy/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-navy">Business pays {percentLabel(rates.business)}</p>
            <Switch label="Charge" checked={chargeBusiness} onChange={setChargeBusiness} />
          </div>
          <p className="mt-1 font-heading text-[22px] font-bold text-navy">{chargeBusiness && pesewas ? formatGhs(feeAmount(pesewas, rates.business)) : "—"}</p>
          {chargeBusiness && (
            <div key={bizId} className="mt-3 grid gap-3">
              <Input label="Business email" name="businessEmail" type="email" defaultValue={biz?.email ?? ""} placeholder="Email for the pay link" maxLength={160} />
              <Input label="Business phone" name="businessPhone" defaultValue={biz?.phone ?? ""} placeholder="Phone or WhatsApp" maxLength={40} />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[14px] text-navy/65">
        <Switch label="Email the pay links now" checked={send} onChange={setSend} />
        You can also copy the links afterwards.
      </div>
      <p className="text-[13.5px] text-navy/65">Only record a deal both sides agreed to, at the fee they were told about before work started.</p>
      {result && !result.ok && <p role="alert" className="rounded-field bg-ember-soft px-4 py-3 text-[14px] font-medium text-ember">{result.error}</p>}
      <Button type="submit" disabled={busy}>
        {busy && <Spinner />}
        {busy ? "Recording" : "Record deal"}
      </Button>
    </form>
  );
}
