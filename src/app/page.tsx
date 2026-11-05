import type { Metadata } from "next";
import { getPublicListings, getServicesByCategory } from "@/lib/data";
import { HomeClient } from "./HomeClient";
import { pageMeta } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: "The Plug Africa — Verified businesses and services across Africa",
  description: "Find verified businesses, homes, schools, events and trusted help across Africa. Contact them directly, or let a Plug concierge handle it.",
  path: "/",
});

// Always read the latest published businesses (admin changes show immediately).
export const dynamic = "force-dynamic";

export default async function Home() {
  const [listings, services] = await Promise.all([getPublicListings(), getServicesByCategory()]);
  return <HomeClient listings={listings} services={services} />;
}
