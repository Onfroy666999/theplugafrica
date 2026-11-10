import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { businessRate, customerRate } from "@/lib/fees";
import { PageHeader, Panel } from "../../ui";
import { DealForm } from "./DealForm";

type SP = Promise<{ request?: string }>;

/** Record a deal on a concierge request (issue #84): who, what, the agreed price, and which sides pay a fee. */
export default async function NewDeal({ searchParams }: { searchParams: SP }) {
  await requireAdmin("edit");
  const { request: id } = await searchParams;
  if (!id) notFound();
  const [request, businesses] = await Promise.all([
    db.conciergeRequest.findUnique({ where: { id }, select: { id: true, ref: true, name: true, phone: true, email: true, details: true, fromMember: true, businessId: true } }),
    db.business.findMany({ where: { isExample: false }, orderBy: { name: "asc" }, select: { id: true, name: true, email: true, phone: true } }),
  ]);
  if (!request) notFound();
  return (
    <>
      <PageHeader title="Record a deal" sub={`Concierge request ${request.ref} from ${request.name}. Record it once the customer and business have agreed a price.`} />
      <Panel className="mb-5 p-5 text-[14.5px] text-navy/75">
        <p className="font-semibold text-navy">What they asked for</p>
        <p className="mt-1 whitespace-pre-line">{request.details}</p>
        <Link href="/admin/concierge" className="mt-3 inline-block text-[14px] font-semibold text-navy hover:underline">Back to concierge requests</Link>
      </Panel>
      <DealForm
        request={{ id: request.id, name: request.name, phone: request.phone, email: request.email ?? "", member: request.fromMember, businessId: request.businessId ?? "" }}
        businesses={businesses.map((b) => ({ id: b.id, name: b.name, email: b.email ?? "", phone: b.phone ?? "" }))}
        rates={{ customer: customerRate(request.fromMember), business: businessRate() }}
      />
    </>
  );
}
