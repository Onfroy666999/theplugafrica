"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "@/components/market/Icons";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { Select } from "@/components/ui/Select";
import type { InboxKind } from "@/lib/inbox-filters";
import { useCan } from "./AdminContext";

/**
 * Filters for an inbox (issue #67): status, search, month and (concierge) who it's assigned to, kept in the address bar
 * so a filtered view can be shared. Owners also get a spreadsheet download of what's shown.
 */
export function InboxToolbar({
  kind,
  statuses,
  months,
  placeholder,
  assignable = false,
}: {
  kind: InboxKind;
  statuses: readonly { value: string; label: string }[];
  months: { value: string; label: string }[];
  placeholder: string;
  assignable?: boolean;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const canExport = useCan("team");
  const [q, setQ] = useState(params.get("q") ?? "");

  const set = (k: string, v: string | null) => {
    // The address as it is now, not when typing began: a filter changed meanwhile must not be undone (issue #94).
    const p = new URLSearchParams(window.location.search);
    if (v && v !== "all") p.set(k, v);
    else p.delete(k);
    p.delete("page"); // a new filter starts at the first page
    router.replace(p.size ? `${path}?${p}` : path, { scroll: false });
  };

  // Debounced search so typing doesn't reload on every key.
  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get("q") ?? "") !== q.trim()) set("q", q.trim() || null);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const exportQuery = new URLSearchParams(params.toString());
  exportQuery.delete("page");

  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-col gap-3 md:flex-row">
        <label className="flex h-11 shrink-0 items-center gap-3 rounded-full border border-navy/15 bg-white px-4 transition-[border-color,box-shadow] duration-200 hover:border-navy/35 focus-within:border-navy/40 focus-within:shadow-[0_0_0_4px_rgb(180_145_63/0.15)] md:flex-1">
          <Search className="h-5 w-5 text-navy/65" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label="Search this inbox" className="w-full bg-transparent text-[15px] text-navy outline-none placeholder:text-navy/40 focus-visible:shadow-none" />
        </label>
        <div className="md:w-[190px]">
          <Select variant="pill" label="Month" options={[{ value: "all", label: "All time" }, ...months]} value={params.get("month") ?? "all"} onChange={(v) => set("month", v)} />
        </div>
        {assignable && (
          <div className="md:w-[190px]">
            <Select
              variant="pill"
              label="Assigned to"
              options={[{ value: "all", label: "Anyone" }, { value: "me", label: "Assigned to me" }, { value: "none", label: "Not assigned" }]}
              value={params.get("assigned") ?? "all"}
              onChange={(v) => set("assigned", v)}
            />
          </div>
        )}
        {canExport && (
          <a
            href={`/admin/export/${kind}${exportQuery.size ? `?${exportQuery}` : ""}`}
            className="press flex h-11 shrink-0 items-center justify-center rounded-full border border-navy/15 bg-white px-5 text-[14px] font-semibold text-navy hover:border-navy/35"
          >
            Download spreadsheet
          </a>
        )}
      </div>
      <ChipGroup label="Status" chips={[{ value: "all", label: "All" }, ...statuses.map((s) => ({ value: s.value, label: s.label }))]} value={params.get("status") ?? "all"} onChange={(v) => set("status", v)} />
    </div>
  );
}
