"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Field, Input, Spinner } from "@/components/market/Form";
import { Button } from "@/components/ui/Button";
import { Sheet, SheetTitle } from "@/components/ui/Sheet";
import { call } from "@/lib/call";
import type { SiteImageGroup } from "@/lib/site-images";
import { resetSiteImage, saveSiteImage } from "../../site-image-actions";
import { useCan } from "../AdminContext";
import { PhotoPicker } from "../PhotoPicker";
import { Panel } from "../ui";

export type SlotView = {
  key: string;
  group: SiteImageGroup;
  label: string;
  where: string;
  hasCaption: boolean;
  original: string;
  url: string;
  alt: string;
  caption: string;
  position?: string;
  changed: boolean;
};

/** Admin › Site photos (issue #112): every changeable photo, grouped by where it appears; tap one to change it. */
export function SitePhotos({ groups, slots, library }: { groups: { id: SiteImageGroup; title: string; sub: string }[]; slots: SlotView[]; library: string[] }) {
  const canEdit = useCan("edit");
  const [editing, setEditing] = useState<SlotView | null>(null);

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <Panel key={g.id} className="p-5 md:p-6">
          <h2 className="font-heading text-[18px] font-bold text-navy">{g.title}</h2>
          <p className="mt-1 text-[14px] text-navy/65">{g.sub}</p>
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {slots
              .filter((s) => s.group === g.id)
              .map((s) => (
                <li key={s.key}>
                  <button
                    type="button"
                    disabled={!canEdit}
                    onClick={() => setEditing(s)}
                    aria-label={canEdit ? `Change ${g.title}: ${s.label}` : undefined}
                    className="press group block w-full text-left disabled:cursor-default"
                  >
                    <span className="relative block aspect-[4/3] overflow-hidden rounded-card bg-navy/5">
                      <Image src={s.url} alt="" fill sizes="(min-width:1024px) 22vw, 45vw" className="object-cover" style={{ objectPosition: s.position }} />
                      {s.changed && <span className="absolute top-2 left-2 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-navy">Changed</span>}
                      {canEdit && (
                        <span className="absolute right-2 bottom-2 rounded-full bg-white/95 px-3 py-1 text-[12px] font-semibold text-navy opacity-90 group-hover:opacity-100">Change</span>
                      )}
                    </span>
                    <span className="mt-2 block text-[14px] font-semibold text-navy">{s.label}</span>
                    <span className="block text-[12.5px] text-navy/60">{s.where}</span>
                  </button>
                </li>
              ))}
          </ul>
        </Panel>
      ))}

      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title="Change photo">
        {editing && <Editor key={editing.key} slot={editing} library={library} onDone={() => setEditing(null)} />}
      </Sheet>
    </div>
  );
}

function Editor({ slot, library, onDone }: { slot: SlotView; library: string[]; onDone: () => void }) {
  const router = useRouter();
  const [url, setUrl] = useState(slot.url);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const finish = () => {
    router.refresh();
    onDone();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        fd.set("key", slot.key);
        fd.set("url", url);
        setError(null);
        start(async () => {
          const r = await call(saveSiteImage(fd));
          if (r.ok) finish();
          else setError(r.error);
        });
      }}
      className="space-y-5"
    >
      <div>
        <SheetTitle className="pr-10 font-heading text-[22px] font-bold text-navy">{slot.label}</SheetTitle>
        <p className="mt-1 text-[14px] text-navy/65">{slot.where}</p>
      </div>
      <div className="relative aspect-[16/9] overflow-hidden rounded-card bg-navy/5">
        <Image src={url} alt="" fill sizes="520px" className="object-cover" style={{ objectPosition: url === slot.original ? slot.position : undefined }} />
      </div>
      <PhotoPicker value={url} onChange={setUrl} library={library} onError={setError} />
      <Field label="Describe the photo" hint="read aloud to people who can't see it">
        <Input label="Describe the photo" name="alt" defaultValue={slot.alt} maxLength={200} placeholder="e.g. A family outside their new home in East Legon" />
      </Field>
      {slot.hasCaption && (
        <Field label="Caption" hint="shown on the photo">
          <Input label="Caption" name="caption" defaultValue={slot.caption} maxLength={80} placeholder="e.g. Rentals · Example home, East Legon" />
        </Field>
      )}
      {error && <p role="alert" className="rounded-field bg-ember-soft px-4 py-3 text-[14px] font-medium text-ember">{error}</p>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" size="lg" full disabled={pending}>
          {pending && <Spinner />}
          Save photo
        </Button>
        {slot.changed && (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            full
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await call(resetSiteImage(slot.key));
                if (r.ok) finish();
                else setError(r.error);
              })
            }
          >
            Use the original
          </Button>
        )}
      </div>
    </form>
  );
}
