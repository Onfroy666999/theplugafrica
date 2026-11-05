// Example data for the design options. Everything here is a placeholder and is labelled "Example" in the UI.

export type CatKey =
  | "rentals"
  | "jobs-hr"
  | "education"
  | "entertainment"
  | "special-services"
  | "invest-ngos"
  | "emergency"
  | "classifieds";

export type Tile = { title: string; img: string };

export const CATS: { key: CatKey; name: string; tiles: Tile[] }[] = [
  {
    key: "rentals",
    name: "Rentals",
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
  },
  {
    key: "invest-ngos",
    name: "Invest & NGOs",
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
