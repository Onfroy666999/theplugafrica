import Link from "next/link";
import { BusinessForm } from "../BusinessForm";
import { photoLibrary } from "../library";
import { PageHeader } from "../../ui";

export default async function NewBusiness() {
  return (
    <>
      <Link href="/admin/businesses" className="text-[14px] font-medium text-navy/55 hover:text-navy">← Businesses</Link>
      <div className="mt-3">
        <PageHeader title="Add a business" sub="Saved as a draft until you change the status." />
      </div>
      <BusinessForm library={await photoLibrary()} />
    </>
  );
}
