"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Field, Input, Select, Spinner, Textarea } from "@/components/market/Form";
import { Button } from "@/components/ui/Button";
import { Sheet, SheetTitle } from "@/components/ui/Sheet";
import { LISTING_CATS } from "@/lib/directory";
import { DUR, EASE } from "@/lib/motion";
import { BUSINESS_STATUS, CREDENTIAL_STATE } from "@/lib/status";
import { deleteBusiness, saveBusiness, uploadImages } from "../../actions";
import { call } from "@/lib/call";
import { useCan } from "../AdminContext";

export type BusinessInput = {
  id?: string;
  name: string;
  slug: string;
  category: string;
  kind: string;
  city: string;
  area: string;
  blurb: string;
  about: string;
  price: string;
  responds: string;
  languages: string;
  phone: string;
  whatsapp: string;
  email: string;
  status: string;
  images: string[];
  credentials: { label: string; state: string }[];
  services: string[]; // service ids
  isExample?: boolean;
};

export type ServiceOption = { id: string; category: string; name: string; visible: boolean };

const CAT_OPTIONS = LISTING_CATS.map((c) => ({ value: c.key, label: c.name }));
const STATUS_OPTIONS = BUSINESS_STATUS.map((s) => ({ value: s.value, label: s.label }));
const CRED_OPTIONS = CREDENTIAL_STATE.map((s) => ({ value: s.value, label: s.label }));
const DEFAULT_CREDS = ["Business registration (Registrar-General)", "Owner identity checked", "Address visited by our team"];

/** `initial` is a saved business, or a few fields to start a new one with (from the waitlist, issue #67). */
export function BusinessForm({ initial, library, allServices, fromWaitlist }: { initial?: Partial<BusinessInput>; library: string[]; allServices: ServiceOption[]; fromWaitlist?: string }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const canEdit = useCan("edit");
  const canDelete = useCan("delete");
  const formRef = useRef<HTMLFormElement>(null);
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [category, setCategory] = useState(initial?.category || "rentals");
  const [serviceIds, setServiceIds] = useState<string[]>(initial?.services ?? []);
  const categoryServices = allServices.filter((sv) => sv.category === category);
  const [creds, setCreds] = useState(initial?.credentials ?? DEFAULT_CREDS.map((label) => ({ label, state: "pending" })));
  const [error, setError] = useState<{ msg: string; field?: string } | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, start] = useTransition();
  const isNew = !initial?.id;

  const onUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    const r = await uploadImages(fd).catch(() => ({ ok: false as const, error: "Upload failed. Try again." }));
    setUploading(false);
    if (r.ok) setImages((xs) => [...xs, ...r.paths]);
    else setError({ msg: r.error, field: "images" });
  };

  const move = (i: number, d: -1 | 1) =>
    setImages((xs) => {
      const j = i + d;
      if (j < 0 || j >= xs.length) return xs;
      const n = [...xs];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const fd = new FormData(e.currentTarget);
    fd.set("images", JSON.stringify(images));
    fd.set("credentials", JSON.stringify(creds.filter((c) => c.label.trim())));
    fd.set("services", JSON.stringify(serviceIds));
    if (initial?.id) fd.set("id", initial.id);
    start(async () => {
      const r = await call(saveBusiness(fd));
      if (!r.ok) {
        const field = "field" in r ? r.field : undefined;
        setError({ msg: r.error, field });
        if (field) formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus();
        return;
      }
      if (isNew) router.replace(`/admin/businesses/${r.id}?created=1`);
      else {
        setSaved(true);
        router.refresh();
      }
    });
  };

  const v = (k: keyof BusinessInput) => (initial?.[k] as string | undefined) ?? "";

  return (
    <form ref={formRef} onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_340px]">
      {fromWaitlist && <input type="hidden" name="fromWaitlist" value={fromWaitlist} />}
      {/* inert: viewers can read every field but not change it */}
      <div className="space-y-6" inert={!canEdit}>
        <Section title="Details">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Business name"><Input label="Business name" name="name" defaultValue={v("name")} required /></Field>
            <Field label="Web address" hint="optional, made from the name">
              <div className="flex items-center rounded-field border border-navy/15 bg-white pl-4 text-[15px] text-navy/65 focus-within:border-navy/40">
                <span className="shrink-0">/listing/</span>
                <input name="slug" aria-label="Web address" defaultValue={v("slug")} placeholder="business-name" className="h-12 w-full min-w-0 bg-transparent pr-4 text-navy outline-none placeholder:text-navy/30 focus-visible:shadow-none" />
              </div>
            </Field>
            <Field label="Category">
              <Select
                label="Category"
                name="category"
                options={CAT_OPTIONS}
                value={category}
                onChange={(c) => {
                  setCategory(c);
                  // Services belong to one category: keep only those that still apply.
                  setServiceIds((ids) => ids.filter((id) => allServices.some((sv) => sv.id === id && sv.category === c)));
                }}
              />
            </Field>
            <Field label="What kind of business"><Input label="What kind of business" name="kind" defaultValue={v("kind")} placeholder="e.g. Furnished apartment" required /></Field>
            <Field label="City"><Input label="City" name="city" defaultValue={v("city") || "Accra"} required /></Field>
            <Field label="Area"><Input label="Area" name="area" defaultValue={v("area")} placeholder="e.g. East Legon" required /></Field>
          </div>
          <div className="mt-5 space-y-5">
            <Field label="One-line summary" hint="shown on cards"><Input label="One-line summary" name="blurb" defaultValue={v("blurb")} maxLength={200} required /></Field>
            <Field label="Full description"><Textarea label="Full description" name="about" defaultValue={v("about")} required /></Field>
            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Price"><Input label="Price" name="price" defaultValue={v("price") || "Price on request"} /></Field>
              <Field label="Response time"><Input label="Response time" name="responds" defaultValue={v("responds") || "Usually replies within a day"} /></Field>
              <Field label="Languages" hint="comma-separated"><Input label="Languages" name="languages" defaultValue={v("languages") || "English"} /></Field>
            </div>
          </div>
        </Section>

        <Section title="Services" sub="Where this business appears inside its category. Choose every service it offers.">
          {categoryServices.length ? (
            <div role="group" aria-label="Services" className="flex flex-wrap gap-2" data-field="services">
              {categoryServices.map((sv) => {
                const on = serviceIds.includes(sv.id);
                return (
                  <button
                    key={sv.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setServiceIds((ids) => (on ? ids.filter((x) => x !== sv.id) : [...ids, sv.id]))}
                    className={`press flex h-10 items-center gap-2 rounded-full border px-4 text-[14px] font-medium ${on ? "border-navy bg-navy text-white" : "border-navy/15 text-navy hover:border-navy/35"}`}
                  >
                    {on && <span aria-hidden="true">✓</span>}
                    {sv.name}
                    {!sv.visible && <span className={`text-[11px] ${on ? "text-white/70" : "text-navy/65"}`}>(hidden)</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-[14px] text-navy/65">
              This category has no services yet. <Link href="/admin/services" className="font-semibold text-navy underline-offset-4 hover:underline">Add services</Link> first.
            </p>
          )}
        </Section>

        <Section title="Contact details" sub="Shown to customers only after they accept the disclaimer and receive a reference code.">
          <div className="grid gap-5 md:grid-cols-3">
            <Field label="Phone"><Input label="Phone" name="phone" type="tel" defaultValue={v("phone")} placeholder="+233 …" /></Field>
            <Field label="WhatsApp"><Input label="WhatsApp" name="whatsapp" type="tel" defaultValue={v("whatsapp")} placeholder="+233 …" /></Field>
            <Field label="Email"><Input label="Email" name="email" type="email" defaultValue={v("email")} /></Field>
          </div>
        </Section>

        <Section title="Photos" sub="The first photo is the cover. JPG, PNG or WebP, up to 6 MB each.">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <AnimatePresence initial={false}>
              {images.map((src, i) => (
                <motion.li
                  key={src}
                  layout={!reduce}
                  initial={{ opacity: 0, transform: "scale(0.96)" }}
                  animate={{ opacity: 1, transform: "scale(1)" }}
                  exit={{ opacity: 0, transform: "scale(0.96)", transition: { duration: DUR.fast * 0.6 } }}
                  transition={{ duration: DUR.base, ease: EASE.out }}
                  className="group relative aspect-square overflow-hidden rounded-card bg-navy/5"
                >
                  <Image src={src} alt="" fill sizes="200px" className="object-cover" />
                  {i === 0 && <span className="absolute top-2 left-2 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-navy">Cover</span>}
                  {canEdit && (
                  <div className="absolute inset-x-2 bottom-2 flex justify-between gap-1">
                    <span className="flex gap-1">
                      <IconBtn label="Move earlier" onClick={() => move(i, -1)} disabled={i === 0}>←</IconBtn>
                      <IconBtn label="Move later" onClick={() => move(i, 1)} disabled={i === images.length - 1}>→</IconBtn>
                    </span>
                    <IconBtn label="Remove photo" onClick={() => setImages((xs) => xs.filter((x) => x !== src))}>✕</IconBtn>
                  </div>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          {canEdit && (
          <div className="mt-4 flex flex-wrap gap-2">
            <label className="press inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-navy px-4 text-[14px] font-semibold text-white hover:bg-navy-hover">
              {uploading && <Spinner />}
              {uploading ? "Uploading" : "Upload photos"}
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => onUpload(e.target.files)} disabled={uploading} />
            </label>
            <Button type="button" variant="secondary" size="sm" onClick={() => setPickerOpen(true)}>Choose from library</Button>
          </div>
          )}
        </Section>

        <Section title="Credentials" sub="What our team has checked. Every item must be Checked before the business can be Verified.">
          <ul className="space-y-2">
            {creds.map((c, i) => (
              <li key={i} className="flex flex-col gap-2 rounded-card border border-navy/10 p-3 sm:flex-row sm:items-center">
                <input
                  aria-label="Credential"
                  value={c.label}
                  onChange={(e) => setCreds((xs) => xs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                  placeholder="e.g. Business registration"
                  className="h-11 min-w-0 flex-1 rounded-full border border-transparent px-3 text-[15px] text-navy outline-none hover:border-navy/15 focus:border-navy/40"
                />
                <div className="flex items-center gap-2">
                  <div className="w-[160px]">
                    <Select variant="pill" label="Credential state" options={CRED_OPTIONS} value={c.state} onChange={(s) => setCreds((xs) => xs.map((x, j) => (j === i ? { ...x, state: s } : x)))} />
                  </div>
                  {canEdit && <IconBtn label="Remove credential" onClick={() => setCreds((xs) => xs.filter((_, j) => j !== i))} tone="light">✕</IconBtn>}
                </div>
              </li>
            ))}
          </ul>
          {canEdit && (
            <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={() => setCreds((xs) => [...xs, { label: "", state: "pending" }])}>
              Add credential
            </Button>
          )}
        </Section>
      </div>

      {/* Publish panel */}
      <aside className="xl:sticky xl:top-8 xl:self-start">
        <div className="rounded-panel border border-navy/10 bg-white p-5 shadow-card">
          <div inert={!canEdit}>
            <Field label="Status">
              <Select label="Status" name="status" options={STATUS_OPTIONS} defaultValue={v("status") || "draft"} />
            </Field>
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-navy/65">Draft and Hidden stay off the site. In review shows with a &ldquo;Verification in review&rdquo; badge.</p>
          <AnimatePresence>
            {error && (
              <motion.p key={error.msg} role="alert" initial={{ opacity: 0, transform: "translateY(-4px)" }} animate={{ opacity: 1, transform: "translateY(0px)" }} exit={{ opacity: 0 }} transition={{ duration: DUR.fast, ease: EASE.out }} className="mt-4 rounded-field bg-ember-soft px-4 py-3 text-[14px] font-medium text-ember">
                {error.msg}
              </motion.p>
            )}
            {saved && !error && (
              <motion.p key="saved" role="status" initial={{ opacity: 0, transform: "translateY(-4px)" }} animate={{ opacity: 1, transform: "translateY(0px)" }} exit={{ opacity: 0 }} transition={{ duration: DUR.fast, ease: EASE.out }} className="mt-4 rounded-field bg-ok-soft px-4 py-3 text-[14px] font-medium text-ok">
                Saved
              </motion.p>
            )}
          </AnimatePresence>
          {canEdit ? (
            <Button type="submit" size="lg" full className="mt-4" disabled={pending}>
              {pending && <Spinner />}
              {pending ? "Saving" : isNew ? "Create business" : "Save changes"}
            </Button>
          ) : (
            <p className="mt-4 rounded-field bg-navy/[0.04] px-4 py-3 text-[13.5px] text-navy/60">You have view-only access. Ask an owner if something needs changing.</p>
          )}
          {!isNew && (
            <>
              <Link href={`/listing/${initial?.slug}`} target="_blank" className="press mt-2 flex h-12 items-center justify-center rounded-full text-[14px] font-semibold text-navy hover:bg-navy/[0.05]">
                View on site ↗
              </Link>
              {canDelete && (
                <button type="button" onClick={() => setConfirmDelete(true)} className="press mt-1 flex h-10 w-full items-center justify-center rounded-full text-[13px] font-semibold text-ember hover:bg-ember-soft">
                  Delete business
                </button>
              )}
            </>
          )}
        </div>
      </aside>

      {/* Library picker */}
      <Sheet open={pickerOpen} onOpenChange={setPickerOpen} title="Choose photos">
        <SheetTitle className="font-heading text-[22px] font-bold text-navy">Photo library</SheetTitle>
        <p className="mt-1 text-[14px] text-navy/65">Tap to add. Licensed photos already on the site.</p>
        <ul className="mt-5 grid grid-cols-3 gap-2">
          {library.map((src) => {
            const on = images.includes(src);
            return (
              <li key={src}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => setImages((xs) => (on ? xs.filter((x) => x !== src) : [...xs, src]))}
                  className={`press relative block aspect-square w-full overflow-hidden rounded-field ring-offset-2 ${on ? "ring-2 ring-gold" : ""}`}
                >
                  <Image src={src} alt="" fill sizes="150px" className="object-cover" />
                  {on && <span className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-[12px] font-bold text-white">✓</span>}
                </button>
              </li>
            );
          })}
        </ul>
        <Button type="button" full className="mt-5" onClick={() => setPickerOpen(false)}>Done</Button>
      </Sheet>

      {/* Delete confirmation */}
      <Sheet open={confirmDelete} onOpenChange={setConfirmDelete} title="Delete business">
        <SheetTitle className="font-heading text-[22px] font-bold text-navy">Delete {initial?.name}?</SheetTitle>
        <p className="mt-2 text-[14.5px] text-navy/65">This removes the listing and its credentials. Enquiries keep their reference codes but lose the link to this business. This can&apos;t be undone; choose Hidden instead if you may need it again.</p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button type="button" variant="secondary" onClick={() => setConfirmDelete(false)}>Keep it</Button>
          <Button type="button" variant="danger" onClick={() => initial?.id && start(async () => { const r = await call(deleteBusiness(initial.id!)); if (r) { setConfirmDelete(false); setError({ msg: r.error }); } })}>
            Delete
          </Button>
        </div>
      </Sheet>
    </form>
  );
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-panel border border-navy/10 bg-white p-5 shadow-card md:p-7">
      <h2 className="font-heading text-[18px] font-bold text-navy">{title}</h2>
      {sub && <p className="mt-1 text-[13.5px] text-navy/65">{sub}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function IconBtn({ label, onClick, disabled, children, tone = "dark" }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode; tone?: "dark" | "light" }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`press flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[14px] font-bold disabled:opacity-30 ${tone === "dark" ? "bg-black/55 text-white backdrop-blur-sm hover:bg-black/70" : "text-navy/65 hover:bg-navy/[0.05] hover:text-navy"}`}
    >
      {children}
    </button>
  );
}
