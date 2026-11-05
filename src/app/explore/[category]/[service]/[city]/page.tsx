import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryServices, getService, getServiceListings } from "@/lib/data";
import { getCat } from "@/lib/directory";
import { CITIES } from "@/lib/listings";
import { cityFromSlug, pageMeta } from "@/lib/site";
import { ServiceView } from "../ServiceView";

export const dynamic = "force-dynamic";

type Params = { category: string; service: string; city: string };
type Props = { params: Promise<Params> };

async function load(p: Params) {
  const cat = getCat(p.category);
  const city = cityFromSlug(p.city);
  if (!cat || !city) return null;
  const [svc, all, siblings] = await Promise.all([getService(p.category, p.service), getServiceListings(p.category, p.service), getCategoryServices(p.category)]);
  if (!svc) return null;
  return { cat, city, svc, all, siblings, listings: all.filter((l) => l.city === city) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  const d = await load(p);
  if (!d) return {};
  return pageMeta({
    title: `${d.svc.name} in ${d.city} — The Plug Africa`,
    description: `${d.svc.name} in ${d.city}: verified businesses you can contact directly. ${d.svc.description}`.trim(),
    path: `/explore/${d.cat.key}/${d.svc.slug}/${p.city}`,
    image: d.svc.image,
    noindex: !d.listings.some((l) => !l.isExample),
  });
}

/** One service in one city, e.g. /explore/rentals/homes-apartments/accra (issue #13). */
export default async function ServiceCityPage({ params }: Props) {
  const d = await load(await params);
  if (!d) notFound();
  const cities = CITIES.filter((c) => d.all.some((l) => l.city === c));
  return <ServiceView cat={d.cat} svc={d.svc} listings={d.listings} siblings={d.siblings} cities={cities} city={d.city} />;
}
