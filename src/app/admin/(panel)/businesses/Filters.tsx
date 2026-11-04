"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "@/components/market/Icons";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { Select } from "@/components/ui/Select";
import { CATS } from "@/lib/directory";
import { BUSINESS_STATUS } from "@/lib/status";

const STATUS_CHIPS = [{ value: "all", label: "All" }, ...BUSINESS_STATUS.map((s) => ({ value: s.value, label: s.label }))];
const CAT_OPTIONS = [{ value: "all", label: "All categories" }, ...CATS.filter((c) => c.key !== "emergency").map((c) => ({ value: c.key, label: c.name }))];

export function BusinessFilters() {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const [q, setQ] = useState(params.get("q") ?? "");

  const set = (k: string, v: string | null) => {
    const p = new URLSearchParams(params.toString());
    if (v && v !== "all") p.set(k, v);
    else p.delete(k);
    router.replace(`${path}?${p.toString()}`, { scroll: false });
  };

  // Debounced search so typing doesn't reload on every key.
  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get("q") ?? "") !== q) set("q", q.trim() || null);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-col gap-3 md:flex-row">
        <label className="flex h-11 shrink-0 items-center gap-3 rounded-full border border-navy/15 bg-white px-4 transition-[border-color,box-shadow] duration-200 hover:border-navy/35 focus-within:border-navy/40 focus-within:shadow-[0_0_0_4px_rgb(180_145_63/0.15)] md:flex-1">
          <Search className="h-5 w-5 text-navy/45" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, city or area" aria-label="Search businesses" className="w-full bg-transparent text-[15px] text-navy outline-none placeholder:text-navy/40 focus-visible:shadow-none" />
        </label>
        <div className="md:w-[220px]">
          <Select variant="pill" label="Category" options={CAT_OPTIONS} value={params.get("category") ?? "all"} onChange={(v) => set("category", v)} />
        </div>
      </div>
      <ChipGroup label="Status" chips={STATUS_CHIPS} value={params.get("status") ?? "all"} onChange={(v) => set("status", v)} />
    </div>
  );
}
