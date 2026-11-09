// EXAMPLE DATA ONLY. Every business, rating and review below is invented for the design
// and is labelled "Example" in the UI. Replace with real, verified businesses before launch.

import type { CatKey } from "./directory";

export type Review = { name: string; when: string; rating: number; text: string };

export type Listing = {
  slug: string;
  name: string;
  cat: CatKey;
  kind: string;
  city: string;
  area: string;
  images: string[];
  blurb: string;
  about: string;
  credentials: { label: string; state: "verified" | "in-review" }[];
  status: "verified" | "in-review";
  rating: number;
  reviewCount: number;
  price: string;
  responds: string;
  languages: string[];
  /** Design placeholder rather than a real business. Shown with an "Example" label. */
  isExample?: boolean;
  /** Services (sub-categories) the business offers, in display order. Filled from the database. */
  services?: { slug: string; name: string }[];
};

/**
 * What a listing card and the Explore search need (issue #76). Pages send only this to the browser, not full listings
 * with descriptions, credentials and every photo: that data was most of the work on phones.
 */
export type CardListing = Pick<Listing, "slug" | "name" | "cat" | "kind" | "city" | "area" | "blurb" | "status" | "rating" | "reviewCount" | "isExample" | "images">;

/** A listing trimmed for cards and search: the fields above, and only the first photo. */
export const toCardListing = (l: Listing): CardListing => ({
  slug: l.slug, name: l.name, cat: l.cat, kind: l.kind, city: l.city, area: l.area, blurb: l.blurb, status: l.status,
  rating: l.rating, reviewCount: l.reviewCount, isExample: l.isExample, images: l.images.slice(0, 1),
});

const REVIEWS: Record<CatKey, Review[]> = {
  rentals: [
    { name: "Example reviewer", when: "2 weeks ago", rating: 5, text: "Exactly as shown in the photos. The owner met us on time and walked us through everything." },
    { name: "Example reviewer", when: "1 month ago", rating: 4, text: "Good location and quiet at night. Water pressure could be better, but the owner fixed it quickly." },
  ],
  "jobs-hr": [
    { name: "Example reviewer", when: "3 weeks ago", rating: 5, text: "They understood what we needed and sent a shortlist within a week. Clear about fees from the start." },
    { name: "Example reviewer", when: "2 months ago", rating: 5, text: "Made the move to Accra far less stressful. Practical advice and they always picked up." },
  ],
  education: [
    { name: "Example reviewer", when: "1 month ago", rating: 5, text: "Our children settled in quickly. Teachers are patient and communicate well with parents." },
    { name: "Example reviewer", when: "3 months ago", rating: 4, text: "Strong on maths and reading. Admissions took a while but the staff were helpful." },
  ],
  entertainment: [
    { name: "Example reviewer", when: "1 week ago", rating: 5, text: "Great food, generous portions and a lovely atmosphere on a Friday evening." },
    { name: "Example reviewer", when: "1 month ago", rating: 4, text: "Book ahead at weekends. Service was friendly even when it was busy." },
  ],
  "special-services": [
    { name: "Example reviewer", when: "2 weeks ago", rating: 5, text: "Always on time, clean car, and he knew the quickest routes around the city." },
    { name: "Example reviewer", when: "2 months ago", rating: 5, text: "Explained the problem clearly and quoted before starting. Fair price." },
  ],
  "invest-ngos": [
    { name: "Example reviewer", when: "1 month ago", rating: 5, text: "Transparent reporting and site visits arranged without fuss." },
    { name: "Example reviewer", when: "4 months ago", rating: 4, text: "Professional team. Due diligence documents were ready when we asked." },
  ],
  emergency: [],
  "new-business": [], // concierge only: no listings, so no reviews
  classifieds: [
    { name: "Example reviewer", when: "1 week ago", rating: 5, text: "Item was exactly as described and the seller let me test it before paying." },
    { name: "Example reviewer", when: "1 month ago", rating: 4, text: "Fair prices and happy to negotiate. Arrived a little late to meet." },
  ],
};

// Home-care businesses sit in Special Services but need their own example reviews (issue #24).
const HOME_CARE_REVIEWS: Review[] = [
  { name: "Example reviewer", when: "1 week ago", rating: 5, text: "Thorough, punctual and trustworthy. The house has never been this clean, and they brought their own supplies." },
  { name: "Example reviewer", when: "1 month ago", rating: 5, text: "They matched us with a nanny who is patient and kind with our two children. References were checked before she started." },
];
const HOME_CARE = /clean|housekeep|maid|nann|laundry|home care/i;

const HIRE_REVIEWS: Review[] = [
  { name: "Example reviewer", when: "2 weeks ago", rating: 5, text: "Everything arrived on time and in good condition. Set-up and collection were handled without any fuss." },
  { name: "Example reviewer", when: "1 month ago", rating: 4, text: "Fair prices and clear terms. Ask for the deposit details up front." },
];

export const reviewsFor = (l: Listing) =>
  l.cat === "special-services" && HOME_CARE.test(`${l.kind} ${l.blurb}`)
    ? HOME_CARE_REVIEWS
    : l.cat === "rentals" && /car|event|equipment/i.test(l.kind)
      ? HIRE_REVIEWS
      : REVIEWS[l.cat];

const C = {
  reg: (s: Listing["credentials"][number]["state"] = "verified") => ({ label: "Business registration (Registrar-General)", state: s }),
  id: (s: Listing["credentials"][number]["state"] = "verified") => ({ label: "Owner identity checked", state: s }),
  addr: (s: Listing["credentials"][number]["state"] = "verified") => ({ label: "Address visited by our team", state: s }),
};

export const LISTINGS: Listing[] = [
  {
    slug: "airport-residential-apartments",
    name: "Airport Residential Apartments",
    cat: "rentals", kind: "Furnished apartment", city: "Accra", area: "Airport Residential",
    images: ["/images/rentals-2.jpg", "/images/rentals.jpg", "/images/rentals-4.jpg"],
    blurb: "Two-bedroom furnished apartments with backup power and 24-hour security.",
    about: "Bright two-bedroom apartments ten minutes from the airport. Each unit has a fitted kitchen, backup generator, water storage and secure parking. Monthly and long-stay terms available directly with the owner.",
    credentials: [C.reg(), C.id(), C.addr(), { label: "Title documents seen", state: "verified" }],
    isExample: true, status: "verified", rating: 4.9, reviewCount: 38, price: "Price on request", responds: "Usually replies within a few hours", languages: ["English", "Twi"],
  },
  {
    slug: "east-legon-garden-house",
    name: "East Legon Garden House",
    cat: "rentals", kind: "Family home", city: "Accra", area: "East Legon",
    images: ["/images/rentals-3.jpg", "/images/rentals.jpg", "/images/rentals-4.jpg"],
    blurb: "Four-bedroom house with a pool and garden on a quiet street.",
    about: "A four-bedroom family house with a private pool, mature garden and staff quarters. Close to international schools. Viewings by appointment with the owner's agent.",
    credentials: [C.reg(), C.id(), C.addr("in-review")],
    isExample: true, status: "verified", rating: 4.8, reviewCount: 12, price: "Price on request", responds: "Usually replies within a day", languages: ["English"],
  },
  {
    slug: "accra-drive-car-rentals",
    name: "Accra Drive Car Rentals",
    cat: "rentals", kind: "Car rental", city: "Accra", area: "Airport",
    images: ["/images/special-4.jpg", "/images/classifieds-4.jpg"],
    blurb: "Saloon cars and SUVs to rent by the day or week, with or without a driver.",
    about: "A rental company with insured, well-serviced saloon cars, SUVs and minibuses. Airport delivery and collection available. Drivers can be added for any booking.",
    credentials: [C.reg(), C.id(), { label: "Vehicle insurance and roadworthy certificates seen", state: "verified" }],
    isExample: true, status: "verified", rating: 4.7, reviewCount: 33, price: "Daily rates on request", responds: "Usually replies within a few hours", languages: ["English", "Twi"],
  },
  {
    slug: "royal-canopy-events",
    name: "Royal Canopy Events",
    cat: "rentals", kind: "Event rentals", city: "Accra", area: "Tema",
    images: ["/images/svc-event-rentals.jpg"],
    blurb: "Canopies, tents, chairs, tables, sound systems and lighting for any event.",
    about: "Event hire for weddings, funerals, parties and corporate events: canopies and marquee tents, chairs and tables with covers, PA systems and speakers, lighting and generators. Delivery, set-up and collection included.",
    credentials: [C.reg(), C.id("in-review")],
    isExample: true, status: "in-review", rating: 4.6, reviewCount: 18, price: "Packages on request", responds: "Usually replies within a day", languages: ["English", "Twi", "Ga"],
  },
  {
    slug: "efua-relocation-partners",
    name: "Efua Relocation Partners",
    cat: "jobs-hr", kind: "Relocation advisor", city: "Accra", area: "Osu",
    images: ["/images/portrait-efua.jpg", "/images/jobs-2.jpg"],
    blurb: "Help with permits, housing searches and settling in for families and staff.",
    about: "Practical relocation support for individuals, families and companies moving staff to Ghana: residence permits, housing shortlists, school visits, bank accounts and orientation days.",
    credentials: [C.reg(), C.id(), { label: "Professional references checked", state: "verified" }],
    isExample: true, status: "verified", rating: 5.0, reviewCount: 21, price: "Quote after first call", responds: "Usually replies within a few hours", languages: ["English", "French", "Twi"],
  },
  {
    slug: "talent-bridge-recruitment",
    name: "Talent Bridge Recruitment",
    cat: "jobs-hr", kind: "Recruitment agency", city: "Accra", area: "Ridge",
    images: ["/images/jobs.jpg", "/images/jobs-3.jpg", "/images/jobs-2.jpg"],
    blurb: "Recruiters for finance, tech and operations roles across Ghana.",
    about: "A recruitment team placing mid and senior hires in finance, technology and operations. Also offers payroll set-up and HR policy support for companies opening a local office.",
    credentials: [C.reg(), C.id(), C.addr()],
    isExample: true, status: "verified", rating: 4.8, reviewCount: 29, price: "Fee agreed per role", responds: "Usually replies within a day", languages: ["English"],
  },
  {
    slug: "bright-minds-academy",
    name: "Bright Minds Academy",
    cat: "education", kind: "Primary school", city: "Kumasi", area: "Ahodwo",
    images: ["/images/education.jpg", "/images/education-4.jpg"],
    blurb: "Primary school with small classes and a strong reading programme.",
    about: "A primary school offering a British-aligned curriculum with Ghanaian languages and culture. Small class sizes, after-school clubs and a school bus on main routes.",
    credentials: [C.reg(), { label: "Ghana Education Service licence", state: "verified" }, C.addr()],
    isExample: true, status: "verified", rating: 4.9, reviewCount: 17, price: "Fees on request", responds: "Usually replies within a day", languages: ["English", "Twi"],
  },
  {
    slug: "home-tutors-collective",
    name: "Home Tutors Collective",
    cat: "education", kind: "Private tutors", city: "Accra", area: "Cantonments",
    images: ["/images/education-2.jpg", "/images/education-4.jpg"],
    blurb: "Vetted tutors for maths, sciences, languages and exam preparation.",
    about: "A group of qualified tutors offering home and online lessons for primary to university level, including IGCSE, WASSCE and IB preparation.",
    credentials: [C.reg("in-review"), C.id(), { label: "Tutor qualifications checked", state: "in-review" }],
    isExample: true, status: "in-review", rating: 4.7, reviewCount: 9, price: "Hourly rates on request", responds: "Usually replies within a few hours", languages: ["English", "French"],
  },
  {
    slug: "labone-kitchen",
    name: "Labone Kitchen",
    cat: "entertainment", kind: "Restaurant", city: "Accra", area: "Labone",
    images: ["/images/dining.jpg", "/images/entertainment-4.jpg"],
    blurb: "Modern Ghanaian dishes, fresh juices and a relaxed terrace.",
    about: "A neighbourhood restaurant serving modern takes on Ghanaian and West African dishes. Terrace seating, private dining for groups and catering for events.",
    credentials: [C.reg(), { label: "Food hygiene certificate", state: "verified" }, C.addr()],
    isExample: true, status: "verified", rating: 4.7, reviewCount: 112, price: "Menu on request", responds: "Usually replies within a few hours", languages: ["English"],
  },
  {
    slug: "coastline-beach-bar",
    name: "Coastline Beach Bar",
    cat: "entertainment", kind: "Beach bar", city: "Takoradi", area: "Busua",
    images: ["/images/entertainment-3.jpg", "/images/entertainment-2.jpg"],
    blurb: "Sea views, grilled fish and live drumming on Saturdays.",
    about: "A beachfront bar and grill with shaded seating, fresh seafood and live music at weekends. Takes group bookings and private events.",
    credentials: [C.reg(), C.addr("in-review")],
    isExample: true, status: "in-review", rating: 4.6, reviewCount: 44, price: "Menu on request", responds: "Usually replies within a day", languages: ["English", "Fante"],
  },
  {
    slug: "gold-coast-chauffeurs",
    name: "Gold Coast Chauffeurs",
    cat: "special-services", kind: "Private driver", city: "Accra", area: "Cantonments",
    images: ["/images/chauffeur.jpg", "/images/special-4.jpg"],
    blurb: "Licensed drivers for airport runs, daily hire and events.",
    about: "Professional chauffeurs with insured, well-kept vehicles for airport transfers, daily or weekly hire, and events. Drivers are licensed and background-checked.",
    credentials: [C.reg(), C.id(), { label: "Driver licences and insurance seen", state: "verified" }],
    isExample: true, status: "verified", rating: 4.8, reviewCount: 64, price: "Day rates on request", responds: "Usually replies within an hour", languages: ["English", "Ga", "Twi"],
  },
  {
    slug: "kwesi-auto-workshop",
    name: "Kwesi Auto Workshop",
    cat: "special-services", kind: "Mechanic", city: "Accra", area: "Abossey Okai",
    images: ["/images/special-2.jpg", "/images/special-4.jpg"],
    blurb: "Diagnostics, servicing and repairs. Quote before any work starts.",
    about: "An independent garage handling servicing, diagnostics, brakes, suspension and air-conditioning for most makes. Collection and drop-off available in central Accra.",
    credentials: [C.reg(), C.id(), C.addr()],
    isExample: true, status: "verified", rating: 4.7, reviewCount: 31, price: "Quote after inspection", responds: "Usually replies within a day", languages: ["English", "Twi"],
  },
  {
    slug: "brightspark-electrical",
    name: "BrightSpark Electrical",
    cat: "special-services", kind: "Electrician", city: "Kumasi", area: "Adum",
    images: ["/images/special-3.jpg"],
    blurb: "Wiring, solar back-up and safety checks for homes and offices.",
    about: "Certified electricians for new wiring, repairs, inverter and solar back-up installation, and safety inspections for landlords and businesses.",
    credentials: [C.reg(), { label: "Energy Commission certification", state: "in-review" }],
    isExample: true, status: "in-review", rating: 4.6, reviewCount: 14, price: "Quote after visit", responds: "Usually replies within a day", languages: ["English", "Twi"],
  },
  {
    slug: "sparkle-home-cleaning",
    name: "Sparkle Home Cleaning",
    cat: "special-services", kind: "Cleaning service", city: "Accra", area: "East Legon",
    images: ["/images/homecare-cleaning.jpg", "/images/homecare-cleaning-2.jpg", "/images/homecare-laundry-2.jpg"],
    blurb: "Regular and deep cleaning for homes and apartments, with supplies included.",
    about: "A trained cleaning team for weekly, fortnightly or one-off deep cleans, move-in and move-out cleans, and post-renovation cleaning. Cleaners bring their own equipment and eco-friendly supplies.",
    credentials: [C.reg(), C.id(), { label: "Staff background checks", state: "verified" }],
    isExample: true, status: "verified", rating: 4.9, reviewCount: 41, price: "Quote after a short call", responds: "Usually replies within a few hours", languages: ["English", "Twi", "Ga"],
  },
  {
    slug: "trusted-hands-home-care",
    name: "Trusted Hands Home Care",
    cat: "special-services", kind: "Housekeepers, maids & nannies", city: "Accra", area: "Airport Residential",
    images: ["/images/homecare-housekeeper.jpg", "/images/homecare-nanny.jpg", "/images/homecare-laundry.jpg"],
    blurb: "Vetted housekeepers, maids, nannies and laundry help, live-in or daily.",
    about: "An agency placing housekeepers, maids, nannies and laundry and ironing help with families and expats. Every placement starts with a trial week, references are checked, and replacements are arranged if it isn't the right fit.",
    credentials: [C.reg(), C.id(), { label: "Staff references and background checks", state: "in-review" }],
    isExample: true, status: "in-review", rating: 4.8, reviewCount: 26, price: "Monthly and daily rates on request", responds: "Usually replies within a day", languages: ["English", "Twi", "French"],
  },
  {
    slug: "sunharvest-energy",
    name: "SunHarvest Energy",
    cat: "invest-ngos", kind: "Solar investment", city: "Accra", area: "Spintex",
    images: ["/images/invest-2.jpg", "/images/invest-3.jpg"],
    blurb: "Commercial solar projects looking for co-investors and partners.",
    about: "A developer of rooftop and mini-grid solar projects for businesses and rural communities. Shares project documents and site visits with qualified investors.",
    credentials: [C.reg(), C.id(), { label: "Audited accounts seen", state: "in-review" }],
    isExample: true, status: "in-review", rating: 4.8, reviewCount: 6, price: "Investment terms on request", responds: "Usually replies within a day", languages: ["English"],
  },
  {
    slug: "harvest-hands-foundation",
    name: "Harvest Hands Foundation",
    cat: "invest-ngos", kind: "Agriculture NGO", city: "Tamale", area: "Northern Region",
    images: ["/images/invest-3.jpg", "/images/invest-4.jpg"],
    blurb: "Training and tools for smallholder farmers. Volunteers and donors welcome.",
    about: "A registered non-profit supporting smallholder farmers with training, seeds and market access. Publishes annual impact reports and hosts volunteer programmes.",
    credentials: [C.reg(), { label: "NGO registration (Department of Social Welfare)", state: "verified" }],
    isExample: true, status: "verified", rating: 4.9, reviewCount: 11, price: "Donations and partnerships", responds: "Usually replies within a few days", languages: ["English", "Dagbani"],
  },
  {
    slug: "osu-phone-hub",
    name: "Osu Phone Hub",
    cat: "classifieds", kind: "Phones & electronics", city: "Accra", area: "Osu",
    images: ["/images/classifieds-2.jpg"],
    blurb: "New and certified used phones, laptops and accessories.",
    about: "A shop selling new and certified pre-owned phones, laptops and accessories, with a short warranty on used devices and repairs on site.",
    credentials: [C.reg(), C.addr()],
    isExample: true, status: "verified", rating: 4.5, reviewCount: 57, price: "Prices in store", responds: "Usually replies within a few hours", languages: ["English"],
  },
  {
    slug: "makola-fashion-house",
    name: "Makola Fashion House",
    cat: "classifieds", kind: "Clothing", city: "Accra", area: "Makola",
    images: ["/images/classifieds-3.jpg", "/images/classifieds.jpg"],
    blurb: "Ready-to-wear and made-to-measure clothing in local fabrics.",
    about: "A family tailoring business offering ready-to-wear pieces and made-to-measure outfits in kente, batik and wax prints. Orders usually ready in a week.",
    credentials: [C.reg("in-review"), C.id()],
    isExample: true, status: "in-review", rating: 4.7, reviewCount: 23, price: "Prices on request", responds: "Usually replies within a day", languages: ["English", "Ga"],
  },
  {
    slug: "accra-auto-sales",
    name: "Accra Auto Sales",
    cat: "classifieds", kind: "Used cars", city: "Accra", area: "Spintex",
    images: ["/images/classifieds-4.jpg", "/images/special-4.jpg"],
    blurb: "Inspected used cars with full documents and test drives.",
    about: "A dealership selling inspected used cars with complete customs and registration papers. Test drives and independent inspections welcome.",
    credentials: [C.reg(), C.id(), C.addr()],
    isExample: true, status: "verified", rating: 4.4, reviewCount: 19, price: "Prices on request", responds: "Usually replies within a day", languages: ["English", "Twi"],
  },
];

export const getListing = (slug: string) => LISTINGS.find((l) => l.slug === slug);

// LISTINGS seeds the database (prisma/seed.ts). Pages read businesses from the database via src/lib/data.ts.
export const CITIES = ["Accra", "Kumasi", "Takoradi", "Tamale"];
