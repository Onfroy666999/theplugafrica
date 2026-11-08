"use client";

import { useState, useTransition } from "react";
import { Field, Input, Spinner } from "@/components/market/Form";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { Select } from "@/components/ui/Select";
import { Sheet, SheetTitle } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import { call } from "@/lib/call";
import { EMERGENCY_CITIES, EMERGENCY_SERVICES, NATIONWIDE, telHref } from "@/lib/emergency";
import { confirmEmergency, deleteEmergency, saveEmergency } from "../../emergency-actions";
import { useCan } from "../AdminContext";
import { Empty, Panel } from "../ui";

export type Contact = {
  id: string;
  city: string;
  service: string;
  name: string;
  phone: string;
  altPhone: string;
  address: string;
  notes: string;
  source: string;
  sourceUrl: string;
  verified: boolean;
  verifiedOn: string | null;
  stale: boolean;
};

const CITY_OPTIONS = [{ value: NATIONWIDE, label: "All of Ghana" }, ...EMERGENCY_CITIES.map((c) => ({ value: c, label: c }))];
const SERVICE_OPTIONS = EMERGENCY_SERVICES.map((s) => ({ value: s.value, label: s.label }));
const cityLabel = (c: string) => (c ? c : "All of Ghana");
const serviceLabel = (s: string) => EMERGENCY_SERVICES.find((x) => x.value === s)?.label ?? s;

export function EmergencyManager({ contacts }: { contacts: Contact[] }) {
  const canEdit = useCan("edit");
  const canDelete = useCan("delete");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState<Contact | "new" | null>(null);
  const [deleting, setDeleting] = useState<Contact | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const shown = filter === "all" ? contacts : contacts.filter((c) => c.city === (filter === "nationwide" ? "" : filter));

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <ChipGroup
          label="Where"
          chips={[{ value: "all", label: "All" }, { value: "nationwide", label: "All of Ghana" }, ...EMERGENCY_CITIES.map((c) => ({ value: c, label: c }))]}
          value={filter}
          onChange={setFilter}
        />
        {canEdit && <Button size="sm" onClick={() => setEditing("new")}>Add a number</Button>}
      </div>
      {notice && <p role="alert" className="mb-4 rounded-field bg-ember-soft px-4 py-3 text-[14px] font-medium text-ember">{notice}</p>}

      <Panel>
        {shown.length === 0 ? (
          <Empty
            title="No numbers here yet"
            body="Add each number with where you confirmed it (the official website, or a call on a given date). Numbers for the whole country, like 112, show in every city."
            action={canEdit ? <Button onClick={() => setEditing("new")}>Add a number</Button> : undefined}
          />
        ) : (
          <ul className={`divide-y divide-navy/[0.07] ${pending ? "opacity-70" : ""}`}>
            {shown.map((c) => (
              <li key={c.id} className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:gap-5 md:px-6">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-navy">
                    {c.name}
                    <span className="font-normal text-navy/45">· {serviceLabel(c.service)} · {cityLabel(c.city)}</span>
                  </p>
                  <p className="mt-0.5 text-[14px]">
                    <a href={telHref(c.phone)} className="font-semibold text-navy hover:underline">{c.phone}</a>
                    {c.altPhone && <> · <a href={telHref(c.altPhone)} className="font-semibold text-navy hover:underline">{c.altPhone}</a></>}
                    {c.notes && <span className="text-navy/55"> · {c.notes}</span>}
                  </p>
                  <p className="mt-1 text-[12.5px] text-navy/50">{c.source ? `Source: ${c.source}` : "No source yet"}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {!c.verified ? (
                    <Badge tone="muted">Not verified · hidden</Badge>
                  ) : c.stale ? (
                    <Badge tone="warn">Check again · verified {c.verifiedOn}</Badge>
                  ) : (
                    <Badge tone="ok">Verified {c.verifiedOn}</Badge>
                  )}
                  {canEdit && c.verified && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        start(async () => {
                          setNotice(null);
                          const r = await call(confirmEmergency(c.id));
                          if (!r.ok) setNotice(r.error);
                        })
                      }
                    >
                      Checked today
                    </Button>
                  )}
                  {canEdit && <Button variant="secondary" size="sm" onClick={() => setEditing(c)}>Edit</Button>}
                  {canDelete && (
                    <button type="button" onClick={() => { setNotice(null); setDeleting(c); }} className="press h-10 rounded-full px-4 text-[14px] font-semibold text-ember hover:bg-ember-soft">
                      Delete
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Sheet open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} title={editing === "new" ? "Add a number" : "Edit number"}>
        {editing !== null && <ContactForm key={editing === "new" ? "new" : editing.id} initial={editing === "new" ? undefined : editing} defaultCity={filter !== "all" && filter !== "nationwide" ? filter : NATIONWIDE} onDone={() => setEditing(null)} />}
      </Sheet>

      <Sheet open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)} title="Delete number">
        <SheetTitle className="pr-10 font-heading text-[22px] font-bold text-navy">Delete {deleting?.name}?</SheetTitle>
        <p className="mt-2 text-[14.5px] text-navy/65">It disappears from the Emergency page straight away.</p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Keep it</Button>
          <Button
            variant="danger"
            disabled={pending}
            onClick={() =>
              deleting &&
              start(async () => {
                const r = await call(deleteEmergency(deleting.id));
                setDeleting(null);
                if (!r.ok) setNotice(r.error);
              })
            }
          >
            {pending && <Spinner />}
            Delete
          </Button>
        </div>
      </Sheet>
    </>
  );
}

function ContactForm({ initial, defaultCity, onDone }: { initial?: Contact; defaultCity: string; onDone: () => void }) {
  const [city, setCity] = useState(initial?.city ?? defaultCity);
  const [service, setService] = useState(initial?.service ?? "ambulance");
  const [verified, setVerified] = useState(initial?.verified ?? false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("city", city);
        fd.set("service", service);
        fd.set("verified", String(verified));
        if (initial) fd.set("id", initial.id);
        setError(null);
        start(async () => {
          const r = await call(saveEmergency(fd));
          if (r.ok) onDone();
          else setError(r.error);
        });
      }}
      className="space-y-5"
    >
      <SheetTitle className="pr-10 font-heading text-[22px] font-bold text-navy">{initial ? `Edit ${initial.name}` : "Add an emergency number"}</SheetTitle>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Where"><Select label="Where" options={CITY_OPTIONS} value={city} onChange={setCity} /></Field>
        <Field label="Service"><Select label="Service" options={SERVICE_OPTIONS} value={service} onChange={setService} /></Field>
      </div>
      <Field label="Name"><Input label="Name" name="name" defaultValue={initial?.name} required maxLength={120} placeholder="e.g. National Ambulance Service" /></Field>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Phone"><Input label="Phone" name="phone" defaultValue={initial?.phone} required maxLength={25} inputMode="tel" placeholder="e.g. 112" /></Field>
        <Field label="Second phone" hint="optional"><Input label="Second phone" name="altPhone" defaultValue={initial?.altPhone} maxLength={25} inputMode="tel" /></Field>
      </div>
      <Field label="Address" hint="optional"><Input label="Address" name="address" defaultValue={initial?.address} maxLength={200} /></Field>
      <Field label="Notes" hint="optional"><Input label="Notes" name="notes" defaultValue={initial?.notes} maxLength={200} placeholder="e.g. 24 hours; emergency unit at the main gate" /></Field>
      <Field label="Where you confirmed it"><Input label="Where you confirmed it" name="source" defaultValue={initial?.source} maxLength={200} placeholder="e.g. Ghana Police Service website, or called on 3 Nov" /></Field>
      <Field label="Source link" hint="optional"><Input label="Source link" name="sourceUrl" type="url" defaultValue={initial?.sourceUrl} maxLength={300} placeholder="https://" /></Field>
      <div className="rounded-field bg-cream px-4 py-3.5">
        <Switch checked={verified} onChange={setVerified} label={verified ? "Verified: shown on the Emergency page" : "Not verified yet: hidden from the public"} />
        <p className="mt-2 text-[12.5px] text-navy/55">Only mark it verified once you&apos;ve confirmed it from an official source or by calling it. Changing the number resets the verified date.</p>
      </div>
      {error && <p role="alert" className="rounded-field bg-ember-soft px-4 py-3 text-[14px] font-medium text-ember">{error}</p>}
      <Button type="submit" size="lg" full disabled={pending}>
        {pending && <Spinner />}
        {initial ? "Save changes" : "Add number"}
      </Button>
    </form>
  );
}
