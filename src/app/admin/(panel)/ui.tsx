// Small presentational pieces shared by every admin page (server-safe).
import Link from "next/link";

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-heading text-[28px] font-extrabold tracking-[-0.02em] text-navy md:text-[32px]">{title}</h1>
        {sub && <p className="mt-1 text-[15px] text-navy/55">{sub}</p>}
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
      <p className="mx-auto mt-1 max-w-sm text-[14px] text-navy/55">{body}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function StatCard({ label, value, href, note }: { label: string; value: number; href: string; note?: string }) {
  return (
    <Link href={href} className="press group block rounded-panel border border-navy/10 bg-white p-5 shadow-card hover:border-navy/25">
      <p className="text-[13px] font-medium text-navy/55">{label}</p>
      <p className="mt-2 font-heading text-[34px] leading-none font-extrabold text-navy tabular-nums">{value}</p>
      {note && <p className="mt-2 text-[12.5px] text-navy/50">{note}</p>}
    </Link>
  );
}

export const fmtDate = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Accra" }).format(d);
