"use client";

import Image from "next/image";
import { useState } from "react";
import { Spinner } from "@/components/market/Form";
import { uploadImages } from "../actions";

const MAX = 6 * 1024 * 1024;

/**
 * Pick one photo: upload a new one (it's chosen straight away) or tap one from the library (issue #112). Used by
 * Admin › Site photos and Admin › Services. Uploads are added to the top of the library for this visit.
 */
export function PhotoPicker({ value, onChange, library, onError }: { value: string; onChange: (src: string) => void; library: string[]; onError: (msg: string | null) => void }) {
  const [uploading, setUploading] = useState(false);
  const [added, setAdded] = useState<string[]>([]);
  const photos = [...added, ...library.filter((p) => !added.includes(p))];

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX) return onError(`${file.name} is over 6 MB. Make it smaller and try again.`);
    setUploading(true);
    onError(null);
    const fd = new FormData();
    fd.append("files", file);
    const r = await uploadImages(fd).catch(() => ({ ok: false as const, error: "Upload failed. Check your connection and try again." }));
    setUploading(false);
    if (!r.ok) return onError(r.error);
    setAdded((xs) => [...r.paths, ...xs]);
    onChange(r.paths[0]);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[14px] font-semibold text-navy">Photo</span>
        <label className="press inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-navy px-4 text-[14px] font-semibold text-white hover:bg-navy-hover">
          {uploading && <Spinner />}
          {uploading ? "Uploading" : "Upload a photo"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => {
              upload(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <p className="mt-1 text-[13px] text-navy/60">JPG, PNG or WebP, up to 6 MB. Or tap a photo below.</p>
      <ul className="mt-3 grid max-h-[260px] grid-cols-4 gap-2 overflow-y-auto pr-1">
        {photos.map((src) => (
          <li key={src}>
            <button
              type="button"
              aria-label={`Use ${src.split("/").pop()}`}
              aria-pressed={value === src}
              onClick={() => onChange(src)}
              className={`press relative block aspect-square w-full overflow-hidden rounded-field ring-offset-2 ${value === src ? "ring-2 ring-gold" : ""}`}
            >
              <Image src={src} alt="" fill sizes="100px" className="object-cover" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
