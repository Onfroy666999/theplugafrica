"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Field, Input, Spinner } from "@/components/market/Form";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { Sheet, SheetTitle } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import { DUR, EASE } from "@/lib/motion";
import { deleteService, moveService, saveService, setServiceVisible } from "../../actions";
import { Empty, Panel } from "../ui";

type Svc = { id: string; slug: string; name: string; description: string; image: string; visible: boolean; count: number };

export function CategoryPicker({ cats, value }: { cats: { value: string; label: string }[]; value: string }) {
  const router = useRouter();
  const path = usePathname();
  return <ChipGroup label="Category" chips={cats} value={value} onChange={(v) => router.replace(`${path}?cat=${v}`, { scroll: false })} className="mb-5" />;
}

export function ServicesManager({ category, services, library }: { category: { key: string; name: string }; services: Svc[]; library: string[] }) {
  const reduce = useReducedMotion();
  const [editing, setEditing] = useState<Svc | "new" | null>(null);
  const [deleting, setDeleting] = useState<Svc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[14px] text-navy/55">
          {services.length} {services.length === 1 ? "service" : "services"} in {category.name}. Hidden services stay off the site.
        </p>
        <Button size="sm" onClick={() => setEditing("new")}>Add a service</Button>
      </div>

      <Panel>
        {services.length === 0 ? (
          <Empty title={`No services in ${category.name} yet`} body="Add the first one, for example “Cars” in Rentals." action={<Button onClick={() => setEditing("new")}>Add a service</Button>} />
        ) : (
          <ul className={`divide-y divide-navy/[0.07] ${pending ? "opacity-70" : ""}`}>
            <AnimatePresence initial={false}>
              {services.map((s, i) => (
                <motion.li
                  key={s.id}
                  layout={!reduce}
                  transition={{ duration: DUR.base, ease: EASE.out }}
                  className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center md:px-6"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-field bg-navy/5">
                      {s.image && <Image src={s.image} alt="" fill sizes="56px" className="object-cover" />}
                    </span>
                    <span className="min-w-0">
                      <span className={`block truncate text-[15px] font-semibold ${s.visible ? "text-navy" : "text-navy/45"}`}>{s.name}</span>
                      <span className="block truncate text-[13px] text-navy/50">
                        /explore/{category.key}/{s.slug} · {s.count} {s.count === 1 ? "business" : "businesses"}
                      </span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Switch checked={s.visible} label={s.visible ? "Visible" : "Hidden"} onChange={(v) => start(() => setServiceVisible(s.id, v))} />
                    <IconBtn label="Move up" disabled={i === 0} onClick={() => start(() => moveService(s.id, -1))}>↑</IconBtn>
                    <IconBtn label="Move down" disabled={i === services.length - 1} onClick={() => start(() => moveService(s.id, 1))}>↓</IconBtn>
                    <Button variant="secondary" size="sm" onClick={() => setEditing(s)}>Edit</Button>
                    <button type="button" onClick={() => { setError(null); setDeleting(s); }} className="press h-10 rounded-full px-4 text-[14px] font-semibold text-ember hover:bg-ember-soft">Delete</button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </Panel>

      <Sheet open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} title={editing === "new" ? "Add a service" : "Edit service"}>
        {editing !== null && <ServiceForm key={editing === "new" ? "new" : editing.id} category={category} initial={editing === "new" ? undefined : editing} library={library} onDone={() => setEditing(null)} />}
      </Sheet>

      <Sheet open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)} title="Delete service">
        <SheetTitle className="pr-10 font-heading text-[22px] font-bold text-navy">Delete {deleting?.name}?</SheetTitle>
        <p className="mt-2 text-[14.5px] text-navy/65">This removes it from {category.name}. It can&apos;t be undone; hide it instead if you might need it again.</p>
        {error && <p role="alert" className="mt-4 rounded-field bg-ember-soft px-4 py-3 text-[14px] font-medium text-ember">{error}</p>}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Keep it</Button>
          <Button
            variant="danger"
            disabled={pending}
            onClick={() =>
              deleting &&
              start(async () => {
                const r = await deleteService(deleting.id);
                if (r.ok) setDeleting(null);
                else setError(r.error);
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

function ServiceForm({ category, initial, library, onDone }: { category: { key: string; name: string }; initial?: Svc; library: string[]; onDone: () => void }) {
  const [image, setImage] = useState(initial?.image ?? "");
  const [visible, setVisible] = useState(initial?.visible ?? true);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("category", category.key);
        fd.set("image", image);
        fd.set("visible", String(visible));
        if (initial) fd.set("id", initial.id);
        setError(null);
        start(async () => {
          const r = await saveService(fd);
          if (r.ok) onDone();
          else setError(r.error);
        });
      }}
      className="space-y-5"
    >
      <SheetTitle className="pr-10 font-heading text-[22px] font-bold text-navy">{initial ? `Edit ${initial.name}` : `Add a service to ${category.name}`}</SheetTitle>
      <Field label="Name"><Input label="Name" name="name" defaultValue={initial?.name} placeholder="e.g. Cars" required autoFocus /></Field>
      <Field label="Web address" hint="optional, made from the name">
        <div className="flex items-center rounded-field border border-navy/15 bg-white pl-4 text-[15px] text-navy/45 focus-within:border-navy/40">
          <span className="shrink-0">/{category.key}/</span>
          <input name="slug" aria-label="Web address" defaultValue={initial?.slug} placeholder="cars" className="h-12 w-full min-w-0 bg-transparent pr-4 text-navy outline-none placeholder:text-navy/30 focus-visible:shadow-none" />
        </div>
      </Field>
      <Field label="Short description" hint="shown on the service page">
        <Input label="Short description" name="description" defaultValue={initial?.description} maxLength={240} placeholder="e.g. Car rental with or without a driver." />
      </Field>
      <div>
        <span className="block text-[14px] font-semibold text-navy">Photo</span>
        <ul className="mt-2 grid max-h-[220px] grid-cols-4 gap-2 overflow-y-auto pr-1">
          {library.map((src) => (
            <li key={src}>
              <button type="button" aria-pressed={image === src} onClick={() => setImage(src)} className={`press relative block aspect-square w-full overflow-hidden rounded-field ring-offset-2 ${image === src ? "ring-2 ring-gold" : ""}`}>
                <Image src={src} alt="" fill sizes="100px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      </div>
      <Switch checked={visible} onChange={setVisible} label={visible ? "Visible on the site" : "Hidden"} />
      {error && <p role="alert" className="rounded-field bg-ember-soft px-4 py-3 text-[14px] font-medium text-ember">{error}</p>}
      <Button type="submit" size="lg" full disabled={pending}>
        {pending && <Spinner />}
        {initial ? "Save changes" : "Add service"}
      </Button>
    </form>
  );
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} className="press flex h-10 w-10 items-center justify-center rounded-full border border-navy/15 text-[15px] font-bold text-navy hover:border-navy/35 disabled:opacity-30">
      {children}
    </button>
  );
}
