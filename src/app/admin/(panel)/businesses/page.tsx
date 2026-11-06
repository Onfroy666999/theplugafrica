import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import type { Prisma } from "@prisma/client";
import { LinkButton } from "@/components/ui/Button";
import { parseImages } from "@/lib/data";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/roles";
import { CATS } from "@/lib/directory";
import { BusinessFilters } from "./Filters";
import { StatusSelect } from "./StatusSelect";
import { Empty, PageHeader, Panel, fmtDate } from "../ui";

type SP = Promise<{ q?: string; status?: string; category?: string; examples?: string }>;

export default async function Businesses({ searchParams }: { searchParams: SP }) {
  const [sp, admin] = await Promise.all([searchParams, requireAdmin()]);
  const canEdit = can(admin.role, "edit");
  const add = canEdit ? <LinkButton href="/admin/businesses/new">Add a business</LinkButton> : undefined;
  const where: Prisma.BusinessWhereInput = {
    ...(sp.status ? { status: sp.status } : {}),
    ...(sp.category ? { category: sp.category } : {}),
    ...(sp.examples ? { isExample: true } : {}),
    ...(sp.q
      ? { OR: (["name", "city", "area", "kind"] as const).map((f) => ({ [f]: { contains: sp.q, mode: "insensitive" as const } })) }
      : {}),
  };
  const [rows, total] = await Promise.all([
    db.business.findMany({ where, orderBy: { updatedAt: "desc" }, include: { _count: { select: { enquiries: true } } } }),
    db.business.count(),
  ]);
  const catName = (k: string) => CATS.find((c) => c.key === k)?.name ?? k;

  return (
    <>
      <PageHeader title="Businesses" sub={`${total} in total. Only In review and Verified appear on the site.`} action={add} />
      <Suspense>
        <BusinessFilters />
      </Suspense>

      <Panel>
        {rows.length === 0 ? (
          <Empty title="No businesses match" body="Try another filter, or add the first real business." action={add} />
        ) : (
          <ul className="divide-y divide-navy/[0.07]">
            {rows.map((b) => {
              const img = parseImages(b.images)[0];
              return (
                <li key={b.id} className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:gap-5 md:px-6">
                  <Link href={`/admin/businesses/${b.id}`} className="group flex min-w-0 flex-1 items-center gap-4">
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-field bg-navy/5">
                      {img && <Image src={img} alt="" fill sizes="56px" className="media-zoom object-cover" />}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[15px] font-semibold text-navy group-hover:underline group-hover:underline-offset-4">{b.name}</span>
                        {b.isExample && <span className="shrink-0 rounded-full bg-navy/[0.06] px-2 py-0.5 text-[11px] font-semibold text-navy/55">Example</span>}
                      </span>
                      <span className="block truncate text-[13px] text-navy/55">
                        {catName(b.category)} · {b.kind} · {b.area}, {b.city}
                      </span>
                      <span className="block text-[12px] text-navy/40">
                        Updated {fmtDate(b.updatedAt)} · {b._count.enquiries} {b._count.enquiries === 1 ? "enquiry" : "enquiries"}
                      </span>
                    </span>
                  </Link>
                  <div className="flex items-center gap-2 md:w-[200px] md:shrink-0">
                    <div className="flex-1"><StatusSelect id={b.id} status={b.status} /></div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
