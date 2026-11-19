import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { SITE_IMAGE_GROUPS, SITE_IMAGE_SLOTS, mergeSiteImages } from "@/lib/site-images";
import { isAllowedPhoto } from "@/lib/storage";
import { photoLibrary } from "../businesses/library";
import { PageHeader } from "../ui";
import { SitePhotos, type SlotView } from "./SitePhotos";

/** Change the photos on the home hero, category headers and page headers (issue #112). */
export default async function SitePhotosPage() {
  await requireAdmin();
  const [rows, library] = await Promise.all([db.siteImage.findMany(), photoLibrary()]);
  const current = mergeSiteImages(rows, isAllowedPhoto);
  const changed = new Set(rows.map((r) => r.key));
  const slots: SlotView[] = SITE_IMAGE_SLOTS.map((s) => ({
    key: s.key,
    group: s.group,
    label: s.label,
    where: s.where,
    hasCaption: !!s.hasCaption,
    original: s.url,
    ...current[s.key],
    changed: changed.has(s.key),
  }));
  return (
    <>
      <PageHeader title="Site photos" sub="The photos on the home page, category pages and page headers. Business and service photos are changed on the business and in Services." />
      <SitePhotos groups={SITE_IMAGE_GROUPS} slots={slots} library={library} />
    </>
  );
}
