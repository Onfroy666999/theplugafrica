import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryServices, getService, getServiceListings } from "@/lib/data";
import { getCat } from "@/lib/directory";
import { ConciergeServiceView } from "./ConciergeServiceView";
import { CITIES } from "@/lib/listings";
import { pageMeta } from "@/lib/site";
import { ServiceView } from "./ServiceView";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ category: string; service: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, service } = await params;
  const cat = getCat(category);
  if (!cat) return {};
  const [svc, listings] = await Promise.all([getService(category, service), getServiceListings(category, service)]);
  if (!svc) return {};
  if (cat.concierge) return pageMeta({ title: `${svc.name} in Ghana — The Plug Africa`, description: svc.description || cat.line, path: `/explore/${cat.key}/${svc.slug}`, image: svc.image });
  return pageMeta({
    title: `${svc.name} in Ghana — ${cat.name} — The Plug Africa`,
    description: svc.description || cat.line,
    path: `/explore/${cat.key}/${svc.slug}`,
    image: svc.image,
    // Kept out of search results until a real (non-example) business is listed.
    noindex: !listings.some((l) => !l.isExample),
  });
}

/** Service page: businesses offering one service inside a category (issue #26). */
export default async function ServicePage({ params }: Props) {
  const { category, service } = await params;
  const cat = getCat(category);
  if (!cat) notFound();
  const [svc, listings, siblings] = await Promise.all([getService(category, service), getServiceListings(category, service), getCategoryServices(category)]);
  if (!svc) notFound();
  if (cat.concierge) return <ConciergeServiceView cat={cat} svc={svc} siblings={siblings} />;
  const cities = CITIES.filter((c) => listings.some((l) => l.city === c));
  return <ServiceView cat={cat} svc={svc} listings={listings} siblings={siblings} cities={cities} />;
}
