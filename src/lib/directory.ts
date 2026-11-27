// Example data for the design options. Everything here is a placeholder and is labelled "Example" in the UI.

export type CatKey =
  | "rentals"
  | "jobs-hr"
  | "education"
  | "entertainment"
  | "special-services"
  | "new-business"
  | "invest-ngos"
  | "emergency"
  | "classifieds";

export type Tile = { title: string; img: string };

// `tiles` now only feed the Emergency tab and fallbacks; services come from the database (issue #26).

/** `concierge`: The Plug delivers the service itself (no business listings); service pages lead to a concierge request (issue #36). */
/**
 * `listingServices`: in a concierge category, the services that list businesses all the same (issue #132: Lawyers in
 * Business). Those businesses are contacted through the concierge only.
 */
export const CATS: { key: CatKey; name: string; line: string; tiles: Tile[]; concierge?: boolean; listingServices?: string[] }[] = [
  {
    key: "rentals",
    name: "Rentals",
    line: "Homes, cars, event equipment and office space from verified owners.",
    tiles: [
      { title: "Furnished apartments", img: "/images/rentals.jpg" },
      { title: "Family homes", img: "/images/rentals-3.jpg" },
      { title: "Short stays", img: "/images/rentals-2.jpg" },
      { title: "Bedrooms & shared", img: "/images/rentals-4.jpg" },
    ],
  },
  {
    key: "jobs-hr",
    name: "Jobs & HR",
    line: "Recruiters, relocation support and HR services.",
    tiles: [
      { title: "Recruiters", img: "/images/jobs.jpg" },
      { title: "Relocation support", img: "/images/portrait-efua.jpg" },
      { title: "Interviews & hiring", img: "/images/jobs-2.jpg" },
      { title: "Payroll & HR", img: "/images/jobs-3.jpg" },
    ],
  },
  {
    key: "education",
    name: "Education",
    line: "Schools, tutors, universities and courses.",
    tiles: [
      { title: "Schools", img: "/images/education.jpg" },
      { title: "Private tutors", img: "/images/education-2.jpg" },
      { title: "Universities", img: "/images/education-3.jpg" },
      { title: "Training courses", img: "/images/education-4.jpg" },
    ],
  },
  {
    key: "entertainment",
    name: "Entertainment",
    line: "Places to eat, drink, dance, relax and explore.",
    tiles: [
      { title: "Restaurants", img: "/images/dining.jpg" },
      { title: "Live music & events", img: "/images/entertainment-2.jpg" },
      { title: "Beach & bars", img: "/images/entertainment-3.jpg" },
      { title: "Local food", img: "/images/entertainment-4.jpg" },
    ],
  },
  {
    key: "special-services",
    name: "Special Services",
    line: "Drivers, trades and help at home, all checked by our team.",
    tiles: [
      { title: "Chauffeurs", img: "/images/chauffeur.jpg" },
      { title: "Mechanics", img: "/images/special-2.jpg" },
      { title: "Electricians & trades", img: "/images/special-3.jpg" },
      { title: "Car hire", img: "/images/special-4.jpg" },
      // Home care (issue #24)
      { title: "Housekeepers & maids", img: "/images/homecare-housekeeper.jpg" },
      { title: "Cleaning services", img: "/images/homecare-cleaning.jpg" },
      { title: "Nannies & childcare", img: "/images/homecare-nanny.jpg" },
      { title: "Laundry & ironing", img: "/images/homecare-laundry.jpg" },
    ],
  },  {
    key: "new-business",
    name: "Business",
    line: "Starting or running a business in Ghana? The Plug handles registration, licences, compliance and legal work for you.",
    concierge: true,
    listingServices: ["lawyers"],
    tiles: [
      { title: "Set up a new business", img: "/images/svc-business-setup.jpg" },
      { title: "Licence acquisition", img: "/images/svc-licences.jpg" },
      { title: "Compliance services", img: "/images/svc-compliance.jpg" },
      { title: "Legal services", img: "/images/svc-licences.jpg" },
    ],
  },

  {
    key: "invest-ngos",
    name: "Invest & NGOs",
    line: "Opportunities to invest in, and organisations to support.",
    tiles: [
      { title: "Business partners", img: "/images/invest.jpg" },
      { title: "Solar & energy", img: "/images/invest-2.jpg" },
      { title: "Agriculture", img: "/images/invest-3.jpg" },
      { title: "Impact organisations", img: "/images/invest-4.jpg" },
    ],
  },
  {
    key: "emergency",
    name: "Emergency",
    line: "Hospitals, police, fire and embassies by city.",
    tiles: [
      { title: "Ambulance", img: "/images/emergency.jpg" },
      { title: "Hospitals & clinics", img: "/images/emergency-2.jpg" },
      { title: "Pharmacies", img: "/images/emergency-3.jpg" },
      { title: "Police", img: "/images/emergency-4.jpg" },
    ],
  },
  {
    key: "classifieds",
    name: "Classifieds",
    line: "Phones, fashion, vehicles and furniture from verified sellers.",
    tiles: [
      { title: "Markets & sellers", img: "/images/classifieds.jpg" },
      { title: "Phones & electronics", img: "/images/classifieds-2.jpg" },
      { title: "Clothing", img: "/images/classifieds-3.jpg" },
      { title: "Cars", img: "/images/classifieds-4.jpg" },
    ],
  },
];

export type Listing = {
  name: string;
  kind: string;
  area: string;
  img: string;
  rating: string;
  reviews: number;
};

export const POPULAR: Listing[] = [
  { name: "Airport Residential Apartments", kind: "Furnished apartment", area: "Airport, Accra", img: "/images/rentals-2.jpg", rating: "4.9", reviews: 38 },
  { name: "Efua Relocation Partners", kind: "Relocation advisor", area: "Osu, Accra", img: "/images/portrait-efua.jpg", rating: "5.0", reviews: 21 },
  { name: "Gold Coast Chauffeurs", kind: "Private driver", area: "Cantonments, Accra", img: "/images/chauffeur.jpg", rating: "4.8", reviews: 64 },
  { name: "Labone Kitchen", kind: "Restaurant", area: "Labone, Accra", img: "/images/dining.jpg", rating: "4.7", reviews: 112 },
  { name: "Bright Minds Academy", kind: "School", area: "East Legon, Accra", img: "/images/education.jpg", rating: "4.9", reviews: 17 },
  { name: "Talent Bridge Ghana", kind: "Recruitment agency", area: "Ridge, Accra", img: "/images/jobs.jpg", rating: "4.8", reviews: 29 },
];

export const FIND_PLACEHOLDERS = [
  "a flat in East Legon",
  "a school nearby",
  "a reliable driver",
  "a cleaner for this week",
  "a recruiter",
  "dinner tonight",
];

export const getCat = (key: string) => CATS.find((c) => c.key === key);

/** True for categories The Plug delivers itself through the concierge (issue #36). */
export const isConciergeCat = (key: string) => getCat(key)?.concierge === true;

/** Categories that hold business listings: Explore filters, the business form and the waitlist. */
export const LISTING_CATS = CATS.filter((c) => c.key !== "emergency" && (!c.concierge || !!c.listingServices?.length));

/**
 * Whether a service lists businesses (true) or is delivered by The Plug itself (false). Every service in a listing
 * category lists businesses; in a concierge category, only its `listingServices` do (issue #132).
 */
export function listsBusinesses(category: string, service: string) {
  const c = getCat(category);
  return !!c && (!c.concierge || !!c.listingServices?.includes(service));
}
