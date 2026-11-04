"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CatIcon, Search } from "@/components/market/Icons";
import { ListingCard } from "@/components/market/ListingCard";
import { Button, LinkButton } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { CATS, type CatKey } from "@/lib/directory";
import { CITIES, type Listing } from "@/lib/listings";
import { DUR, EASE } from "@/lib/motion";

const SORT_OPTIONS = [
  { value: "relevant", label: "Most relevant" },
  { value: "rating", label: "Highest rated" },
  { value: "reviews", label: "Most reviewed" },
];
const CITY_OPTIONS = [{ value: "all", label: "All cities" }, ...CITIES.map((c) => ({ value: c, label: c }))];
const CAT_CHIPS = [
  { value: "all", label: "All" },
  ...CATS.filter((c) => c.key !== "emergency").map((c) => ({ value: c.key, label: c.name, icon: <CatIcon k={c.key} className="h-[18px] w-[18px]" /> })),
];

export function ExploreClient({ listings }: { listings: Listing[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const reduce = useReducedMotion();

  const cat = (params.get("cat") as CatKey | null) ?? null;
  const cityParam = params.get("city");
  const city = cityParam && CITIES.includes(cityParam) ? cityParam : "";
  const [q, setQ] = useState(params.get("q") ?? "");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sort, setSort] = useState("relevant");

  const setParam = (k: string, v: string | null) => {
    const p = new URLSearchParams(params.toString());
    if (v) p.set(k, v);
    else p.delete(k);
    router.replace(`${path}?${p.toString()}`, { scroll: false });
  };

  const results = useMemo(() => {
    const words = q.trim().toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    let r = listings.filter(
      (l) =>
        (!cat || l.cat === cat) &&
        (!city || l.city === city) &&
        (!verifiedOnly || l.status === "verified") &&
        (!words.length || words.some((w) => `${l.name} ${l.kind} ${l.area} ${l.blurb}`.toLowerCase().includes(w))),
    );
    if (sort === "rating") r = [...r].sort((a, b) => b.rating - a.rating);
    if (sort === "reviews") r = [...r].sort((a, b) => b.reviewCount - a.reviewCount);
    return r;
  }, [listings, q, cat, city, verifiedOnly, sort]);

  const catName = CATS.find((c) => c.key === cat)?.name;

  return (
    <div className="mx-auto max-w-[1280px] px-5 pt-8 pb-10 md:px-8">
      <h1 className="font-heading text-[30px] font-extrabold tracking-[-0.03em] text-navy md:text-[40px]">
        {catName ?? "Explore"}
        {city && <span className="text-navy/40"> in {city}</span>}
      </h1>

      {/* Search + filters: every control is a 44px pill */}
      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
        <label className="flex h-11 shrink-0 items-center gap-3 rounded-full border border-navy/15 bg-white px-4 transition-[border-color,box-shadow] duration-200 hover:border-navy/35 focus-within:border-navy/40 focus-within:shadow-[0_0_0_4px_rgb(180_145_63/0.15)] md:flex-1">
          <Search className="h-5 w-5 text-navy/45" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, service or area"
            aria-label="Search listings"
            className="w-full bg-transparent text-[15px] text-navy outline-none placeholder:text-navy/40 focus-visible:shadow-none"
          />
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] md:overflow-visible md:pb-0">
          <div className="w-[150px] shrink-0">
            <Select variant="pill" label="City" options={CITY_OPTIONS} value={city || "all"} onChange={(v) => setParam("city", v === "all" ? null : v)} />
          </div>
          <div className="w-[170px] shrink-0">
            <Select variant="pill" label="Sort" options={SORT_OPTIONS} value={sort} onChange={setSort} />
          </div>
          <Switch checked={verifiedOnly} onChange={setVerifiedOnly} label="Verified only" />
        </div>
      </div>

      <ChipGroup
        label="Category"
        chips={CAT_CHIPS}
        value={cat ?? "all"}
        onChange={(v) => setParam("cat", v === "all" ? null : v)}
        className="-mx-5 mt-4 px-5 md:mx-0 md:flex-wrap md:px-0"
      />

      <p className="mt-6 text-[14px] text-navy/55">
        {results.length} {results.length === 1 ? "result" : "results"}
        {results.some((l) => l.isExample) && " · Example listings while real businesses are added"}
      </p>

      <motion.div layout={!reduce} className="mt-4 grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
        <AnimatePresence mode="popLayout" initial={false}>
          {results.map((l) => (
            <motion.div
              key={l.slug}
              layout={!reduce}
              initial={{ opacity: 0, transform: "scale(0.97)" }}
              animate={{ opacity: 1, transform: "scale(1)" }}
              exit={{ opacity: 0, transform: "scale(0.97)", transition: { duration: DUR.fast } }}
              transition={{ duration: DUR.base, ease: EASE.out }}
            >
              <ListingCard l={l} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {results.length === 0 && (
        <div className="mt-6 rounded-panel bg-cream p-10 text-center">
          <p className="font-heading text-[20px] font-bold text-navy">Nothing here yet</p>
          <p className="mx-auto mt-2 max-w-md text-[15px] text-navy/60">
            We&apos;re still adding businesses. A Plug concierge can find someone for you in the meantime.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setQ("");
                setVerifiedOnly(false);
                router.replace(path, { scroll: false });
              }}
            >
              Clear filters
            </Button>
            <LinkButton href="/concierge">Ask a concierge</LinkButton>
          </div>
        </div>
      )}
    </div>
  );
}
