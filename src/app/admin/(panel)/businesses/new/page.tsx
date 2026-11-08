import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { LISTING_CATS } from "@/lib/directory";
import { BusinessForm } from "../BusinessForm";
import { allServiceOptions } from "../serviceOptions";
import { photoLibrary } from "../library";
import { PageHeader } from "../../ui";

/** New business, optionally started from a waitlist entry (?waitlist=<id>, issue #67). */
export default async function NewBusiness({ searchParams }: { searchParams: Promise<{ waitlist?: string }> }) {
  await requireAdmin("edit");
  const { waitlist } = await searchParams;
  const w = waitlist ? await db.waitlistEntry.findUnique({ where: { id: waitlist } }) : null;
  const listingCategory = w && LISTING_CATS.some((c) => c.key === w.category) ? w.category : undefined;
  return (
    <>
      <Link href={w ? "/admin/waitlist" : "/admin/businesses"} className="text-[14px] font-medium text-navy/55 hover:text-navy">← {w ? "Waitlist" : "Businesses"}</Link>
      <div className="mt-3">
        <PageHeader
          title={w ? `Add ${w.businessName}` : "Add a business"}
          sub={w ? `From the waitlist (${w.ref}). The entry is marked Listed once you create the business. Saved as a draft until you change the status.` : "Saved as a draft until you change the status."}
        />
      </div>
      <BusinessForm
        library={await photoLibrary()}
        allServices={await allServiceOptions()}
        fromWaitlist={w?.id}
        initial={w ? { name: w.businessName, category: listingCategory, city: w.city, phone: w.phone, email: w.email ?? "" } : undefined}
      />
    </>
  );
}
