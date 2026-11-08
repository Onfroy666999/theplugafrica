import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { EMERGENCY_SERVICES, needsRecheck } from "@/lib/emergency";
import { PageHeader, fmtDate } from "../ui";
import { EmergencyManager, type Contact } from "./EmergencyManager";

/** Emergency numbers (issue #11): only verified ones appear on the public page. */
export default async function EmergencyAdmin() {
  await requireAdmin();
  const rows = await db.emergencyContact.findMany({ orderBy: [{ city: "asc" }, { name: "asc" }] });
  const order = (s: string) => EMERGENCY_SERVICES.findIndex((x) => x.value === s);
  const contacts: Contact[] = rows
    .sort((a, b) => (a.city ?? "").localeCompare(b.city ?? "") || order(a.service) - order(b.service) || a.name.localeCompare(b.name))
    .map((c) => ({
      id: c.id,
      city: c.city ?? "",
      service: c.service,
      name: c.name,
      phone: c.phone,
      altPhone: c.altPhone ?? "",
      address: c.address ?? "",
      notes: c.notes ?? "",
      source: c.source ?? "",
      sourceUrl: c.sourceUrl ?? "",
      verified: !!c.verifiedAt,
      verifiedOn: c.verifiedAt ? fmtDate(c.verifiedAt) : null,
      stale: needsRecheck(c.verifiedAt),
    }));
  const verified = contacts.filter((c) => c.verified).length;
  return (
    <>
      <PageHeader title="Emergency numbers" sub={`${verified} of ${contacts.length} verified. Only verified numbers appear on the Emergency page, with their source and date.`} />
      <EmergencyManager contacts={contacts} />
    </>
  );
}
