// Shared details for concierge requests and requests to a business (issue #50):
// where the service happens, the exact location, and timing. Safe to import in client components.

import type { CatKey } from "./directory";

/** Neighbourhoods per city, alphabetical. "Other" lets people type an area that isn't listed. Edit freely. */
export const AREAS: Record<string, string[]> = {
  Accra: [
    "Abelemkpe", "Achimota", "Adabraka", "Adenta", "Airport Residential", "Amasaman", "Ashaiman", "Asylum Down", "Cantonments",
    "Dansoman", "Dome", "Dzorwulu", "East Legon", "East Legon Hills", "Haatso", "Kaneshie", "Kasoa", "Kokomlemle", "Kwabenya",
    "La (Labadi)", "Labone", "Lashibi", "Legon", "Madina", "McCarthy Hill", "North Legon", "North Ridge", "Nungua", "Osu",
    "Oyarifa", "Pokuase", "Ridge", "Roman Ridge", "Sakumono", "Shiashie", "Spintex", "Tema", "Tesano", "Teshie", "Trasacco",
    "Tse Addo", "Weija",
  ],
  Kumasi: [
    "Abrepo", "Adum", "Ahodwo", "Asokore Mampong", "Asokwa", "Atasomanso", "Atonsu", "Ayeduase", "Ayigya", "Bantama", "Daban",
    "Danyame", "Ejisu", "Kentinkrono", "KNUST", "Kwadaso", "Nhyiaeso", "Oforikrom", "Patasi", "Santasi", "Suame", "Tafo",
  ],
  Takoradi: [
    "Adiembra", "Airport Ridge", "Anaji", "Apremdo", "Beach Road", "Chapel Hill", "Effia", "Fijai", "Kansaworado",
    "Kwesimintsim", "Market Circle", "New Takoradi", "Sekondi", "Tanokrom",
  ],
  Tamale: ["Changli", "Choggu", "Gumani", "Kakpagyili", "Kalpohin", "Kanvilli", "Lamashegu", "Nyohini", "Sakasaka", "Tishigu", "Vittin"],
};
export const OTHER_AREA = "Other";

export type ServiceMode = "my_place" | "their_place" | "elsewhere" | "remote";

export const MODE_LABELS: Record<ServiceMode, string> = {
  my_place: "At my place",
  their_place: "At their location",
  elsewhere: "Somewhere else",
  remote: "Online or by phone",
};

/** Short hint under the choice, so people know what each one means for this kind of service. */
export const MODE_HINTS: Record<ServiceMode, string> = {
  my_place: "They come to your home or office.",
  their_place: "You go to them: their office, shop, school or property.",
  elsewhere: "You meet somewhere else, such as a hotel, an airport pickup or a site.",
  remote: "A call, video call or messages. No meeting needed.",
};

/** Which choices make sense for each category, most likely first. */
const MODES_BY_CATEGORY: Partial<Record<CatKey, ServiceMode[]>> = {
  rentals: ["their_place", "elsewhere", "remote"],
  "jobs-hr": ["remote", "their_place", "my_place"],
  education: ["their_place", "my_place", "remote"],
  entertainment: ["their_place", "elsewhere"],
  "special-services": ["my_place", "elsewhere", "their_place"],
  "new-business": ["remote", "my_place", "elsewhere"],
  "invest-ngos": ["remote", "their_place", "elsewhere"],
  classifieds: ["their_place", "elsewhere", "my_place"],
};
const ALL_MODES: ServiceMode[] = ["my_place", "their_place", "elsewhere", "remote"];

export function modesFor(category?: string): ServiceMode[] {
  return (category && MODES_BY_CATEGORY[category as CatKey]) || ALL_MODES;
}

/** Chauffeurs and drivers: "somewhere else" means a pickup point. */
export function elsewhereLabel(service?: string) {
  return service && /chauffeur|driver|airport/i.test(service) ? "Where should they pick you up?" : "Where should you meet?";
}

export const TIMES_OF_DAY = ["Any time", "Morning", "Afternoon", "Evening"] as const;

/** One readable line for the admin inboxes. */
export function describeRequest(r: {
  serviceMode?: string | null;
  city?: string | null;
  area?: string | null;
  landmark?: string | null;
  meetingPlace?: string | null;
  preferredDate?: string | null;
  timeOfDay?: string | null;
}) {
  const where = [r.area, r.city].filter(Boolean).join(", ");
  const mode = r.serviceMode && r.serviceMode in MODE_LABELS ? MODE_LABELS[r.serviceMode as ServiceMode] : null;
  return {
    place: [mode, r.meetingPlace, where, r.landmark].filter(Boolean).join(" · "),
    when: [r.preferredDate, r.timeOfDay && r.timeOfDay !== "Any time" ? r.timeOfDay.toLowerCase() : null].filter(Boolean).join(", "),
  };
}
