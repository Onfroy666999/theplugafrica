// Small presentational pieces shared by every admin page (server-safe).
import Link from "next/link";

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-heading text-[28px] font-extrabold tracking-[-0.02em] text-navy md:text-[32px]">{title}</h1>
        {sub && <p className="mt-1 text-[15px] text-navy/65">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-panel border border-navy/10 bg-white shadow-card ${className}`}>{children}</section>;
}

export function Empty({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="font-heading text-[18px] font-bold text-navy">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-[14px] text-navy/65">{body}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function StatCard({ label, value, href, note }: { label: string; value: number; href: string; note?: string }) {
  return (
    <Link href={href} className="press group block rounded-panel border border-navy/10 bg-white p-5 shadow-card hover:border-navy/25">
      <p className="text-[13px] font-medium text-navy/65">{label}</p>
      <p className="mt-2 font-heading text-[34px] leading-none font-extrabold text-navy tabular-nums">{value}</p>
      {note && <p className="mt-2 text-[12.5px] text-navy/65">{note}</p>}
    </Link>
  );
}

export const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Accra" }).format(d);

/** "51–100 of 230" with Newer / Older links that keep the current filters (issue #67). */
export function Pager({ page, pageSize, total, query, path }: { page: number; pageSize: number; total: number; query: string; path: string }) {
  if (total <= pageSize && page === 1) return null;
  const from = Math.min((page - 1) * pageSize + 1, total);
  const to = Math.min(page * pageSize, total);
  const href = (p: number) => {
    const q = new URLSearchParams(query);
    if (p > 1) q.set("page", String(p));
    else q.delete("page");
    return q.size ? `${path}?${q}` : path;
  };
  const link = "press flex h-10 items-center rounded-full border border-navy/15 bg-white px-4 text-[14px] font-medium text-navy hover:border-navy/35";
  return (
    <nav aria-label="Pages" className="mt-4 flex items-center justify-between gap-3">
      <p className="text-[13px] text-navy/65 tabular-nums">{total ? `${from}–${to} of ${total}` : "Nothing on this page"}</p>
      <div className="flex gap-2">
        {page > 1 && <Link href={href(page - 1)} className={link}>Newer</Link>}
        {to < total && <Link href={href(page + 1)} className={link}>Older</Link>}
      </div>
    </nav>
  );
}
