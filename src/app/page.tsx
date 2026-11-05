import { getPublicListings, getServicesByCategory } from "@/lib/data";
import { HomeClient } from "./HomeClient";

// Always read the latest published businesses (admin changes show immediately).
export const dynamic = "force-dynamic";

export default async function Home() {
  const [listings, services] = await Promise.all([getPublicListings(), getServicesByCategory()]);
  return <HomeClient listings={listings} services={services} />;
}
