import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { parseImages } from "@/lib/data";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { BUSINESS_STATUS, find } from "@/lib/status";
import { BusinessForm } from "../BusinessForm";
import { allServiceOptions } from "../serviceOptions";
import { photoLibrary } from "../library";
import { PageHeader } from "../../ui";

export default async function EditBusiness({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  // Checked here too: on client-side navigation the layout (and its check) isn't run again.
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const b = await db.business.findUnique({ where: { id }, include: { credentials: { orderBy: { position: "asc" } }, services: { select: { id: true } } } });
  if (!b) notFound();
  const s = find(BUSINESS_STATUS, b.status);

  return (
    <>
      <Link href="/admin/businesses" className="text-[14px] font-medium text-navy/65 hover:text-navy">← Businesses</Link>
      <div className="mt-3">
        <PageHeader
          title={b.name}
          sub={b.isExample ? "Example business from the design. Replace or hide it once real businesses are in." : `/listing/${b.slug}`}
          action={<Badge tone={s.tone}>{s.label}</Badge>}
        />
      </div>
      {sp.created && <p role="status" className="mb-6 rounded-field bg-ok-soft px-4 py-3 text-[14px] font-medium text-ok">Business created. It stays off the site until the status is In review or Verified.</p>}
      <BusinessForm
        library={await photoLibrary()}
        allServices={await allServiceOptions()}
        initial={{
          id: b.id,
          name: b.name,
          slug: b.slug,
          category: b.category,
          kind: b.kind,
          city: b.city,
          area: b.area,
          blurb: b.blurb,
          about: b.about,
          price: b.price,
          responds: b.responds,
          languages: b.languages,
          phone: b.phone ?? "",
          whatsapp: b.whatsapp ?? "",
          email: b.email ?? "",
          status: b.status,
          images: parseImages(b.images),
          credentials: b.credentials.map((c) => ({ label: c.label, state: c.state })),
          services: b.services.map((sv) => sv.id),
          isExample: b.isExample,
          mediated: b.mediated,
          availability: b.availability,
        }}
      />
    </>
  );
}
