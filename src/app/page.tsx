import { getPublicListings } from "@/lib/data";
import { HomeClient } from "./HomeClient";

// Always read the latest published businesses (admin changes show immediately).
export const dynamic = "force-dynamic";

export default async function Home() {
  return <HomeClient listings={await getPublicListings()} />;
}
