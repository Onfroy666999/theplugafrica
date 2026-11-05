// Starting list of services (sub-categories) per category, approved by the owner on 2026-11-05 (issue #26).
// This only SEEDS the database: after that, services are managed in the admin (/admin/services).
// Re-running the seed creates missing services but never overwrites admin edits.

import type { CatKey } from "./directory";

export type ServiceSeed = { slug: string; name: string; description: string; image: string };

export const SERVICE_SEED: Partial<Record<CatKey, ServiceSeed[]>> = {
  rentals: [
    { slug: "homes", name: "Homes & apartments", description: "Houses and apartments to rent from verified owners and agents.", image: "/images/rentals.jpg" },
    { slug: "short-stays", name: "Short stays", description: "Furnished places by the night, week or month.", image: "/images/rentals-2.jpg" },
    { slug: "cars", name: "Cars", description: "Car rental with or without a driver.", image: "/images/special-4.jpg" },
    { slug: "event-rentals", name: "Event rentals", description: "Canopies, tents, chairs, tables, sound and lighting for events.", image: "/images/svc-event-rentals.jpg" },
    { slug: "equipment", name: "Equipment", description: "Generators, tools and machinery to hire.", image: "/images/svc-equipment.jpg" },
    { slug: "office-space", name: "Office space", description: "Offices, desks and meeting rooms.", image: "/images/svc-office-space.jpg" },
  ],
  "special-services": [
    { slug: "chauffeurs", name: "Chauffeurs", description: "Licensed private drivers for airport runs, daily hire and events.", image: "/images/chauffeur.jpg" },
    { slug: "mechanics", name: "Mechanics", description: "Car servicing, diagnostics and repairs.", image: "/images/special-2.jpg" },
    { slug: "electricians-plumbers", name: "Electricians & plumbers", description: "Wiring, solar back-up, plumbing and repairs.", image: "/images/special-3.jpg" },
    { slug: "housekeepers-maids", name: "Housekeepers & maids", description: "Vetted housekeepers and maids, live-in or daily.", image: "/images/homecare-housekeeper.jpg" },
    { slug: "cleaning", name: "Cleaning services", description: "Regular, deep and move-in cleans for homes and offices.", image: "/images/homecare-cleaning.jpg" },
    { slug: "nannies-childcare", name: "Nannies & childcare", description: "Nannies and childminders with checked references.", image: "/images/homecare-nanny.jpg" },
    { slug: "laundry-ironing", name: "Laundry & ironing", description: "Washing, ironing and dry cleaning, with pick-up.", image: "/images/homecare-laundry.jpg" },
    { slug: "errands-concierge", name: "Errands & concierge", description: "Deliveries, errands and personal assistance.", image: "/images/svc-errands.jpg" },
  ],
  // Fully concierge: The Plug does the work itself (issue #36).
  "new-business": [
    { slug: "business-setup", name: "Set up a new business", description: "Company registration, tax and social security numbers, a business bank account and an office address, handled for you.", image: "/images/svc-business-setup.jpg" },
    { slug: "licences", name: "Licence acquisition", description: "The permits and licences your trade needs, from the right agencies, applied for and followed up on your behalf.", image: "/images/svc-licences.jpg" },
    { slug: "compliance", name: "Compliance services", description: "Annual returns, tax filings, renewals and statutory deadlines kept on track, so your business stays in good standing.", image: "/images/svc-compliance.jpg" },
  ],
  "jobs-hr": [
    { slug: "recruitment", name: "Recruitment agencies", description: "Recruiters for local and international roles.", image: "/images/jobs.jpg" },
    { slug: "relocation", name: "Relocation support", description: "Permits, housing searches and settling in.", image: "/images/portrait-efua.jpg" },
    { slug: "payroll-hr", name: "Payroll & HR services", description: "Payroll, contracts and HR policy for companies.", image: "/images/jobs-3.jpg" },
  ],
  education: [
    { slug: "schools", name: "Schools", description: "Nursery, primary and secondary schools.", image: "/images/education.jpg" },
    { slug: "tutors", name: "Private tutors", description: "Home and online tutoring, including exam preparation.", image: "/images/education-2.jpg" },
    { slug: "universities", name: "Universities", description: "Universities and colleges.", image: "/images/education-3.jpg" },
    { slug: "training-courses", name: "Training & courses", description: "Professional and vocational training.", image: "/images/education-4.jpg" },
    { slug: "language-classes", name: "Language classes", description: "English, French, Twi and other languages.", image: "/images/svc-language-classes.jpg" },
  ],
  entertainment: [
    { slug: "restaurants", name: "Restaurants", description: "Places to eat, from local dishes to fine dining.", image: "/images/dining.jpg" },
    { slug: "bars-nightlife", name: "Bars & nightlife", description: "Bars, lounges and clubs.", image: "/images/svc-bars-nightlife.jpg" },
    { slug: "events-concerts", name: "Events & concerts", description: "Live music, festivals and shows.", image: "/images/entertainment-2.jpg" },
    { slug: "beaches-resorts", name: "Beaches & resorts", description: "Beach bars, resorts and days out by the sea.", image: "/images/entertainment-3.jpg" },
    { slug: "tours-culture", name: "Tours & culture", description: "Guided tours, heritage sites and cultural experiences.", image: "/images/svc-tours-culture.jpg" },
  ],
  "invest-ngos": [
    { slug: "business-opportunities", name: "Business opportunities", description: "Partnerships and businesses looking for investors.", image: "/images/invest.jpg" },
    { slug: "energy-solar", name: "Energy & solar", description: "Solar and energy projects.", image: "/images/invest-2.jpg" },
    { slug: "agriculture", name: "Agriculture", description: "Farming and agribusiness opportunities.", image: "/images/invest-3.jpg" },
    { slug: "real-estate", name: "Real estate", description: "Property developments and land.", image: "/images/svc-real-estate.jpg" },
    { slug: "ngos-charities", name: "NGOs & charities", description: "Registered non-profits to support or volunteer with.", image: "/images/invest-4.jpg" },
  ],
  classifieds: [
    { slug: "phones-electronics", name: "Phones & electronics", description: "New and certified used phones, laptops and accessories.", image: "/images/classifieds-2.jpg" },
    { slug: "clothing-fashion", name: "Clothing & fashion", description: "Ready-to-wear, tailoring and local fabrics.", image: "/images/classifieds-3.jpg" },
    { slug: "vehicles", name: "Vehicles for sale", description: "Inspected used cars and motorbikes.", image: "/images/classifieds-4.jpg" },
    { slug: "furniture-home", name: "Furniture & home", description: "Furniture, appliances and home goods.", image: "/images/svc-furniture.jpg" },
  ],
};

/** Which services each example business belongs to (seed only). */
export const EXAMPLE_SERVICES: Record<string, string[]> = {
  "airport-residential-apartments": ["homes", "short-stays"],
  "east-legon-garden-house": ["homes"],
  "accra-drive-car-rentals": ["cars"],
  "royal-canopy-events": ["event-rentals", "equipment"],
  "efua-relocation-partners": ["relocation"],
  "talent-bridge-recruitment": ["recruitment", "payroll-hr"],
  "bright-minds-academy": ["schools"],
  "home-tutors-collective": ["tutors"],
  "labone-kitchen": ["restaurants"],
  "coastline-beach-bar": ["beaches-resorts", "bars-nightlife"],
  "gold-coast-chauffeurs": ["chauffeurs"],
  "kwesi-auto-workshop": ["mechanics"],
  "brightspark-electrical": ["electricians-plumbers"],
  "sparkle-home-cleaning": ["cleaning"],
  "trusted-hands-home-care": ["housekeepers-maids", "nannies-childcare", "laundry-ironing"],
  "sunharvest-energy": ["energy-solar"],
  "harvest-hands-foundation": ["agriculture", "ngos-charities"],
  "osu-phone-hub": ["phones-electronics"],
  "makola-fashion-house": ["clothing-fashion"],
  "accra-auto-sales": ["vehicles"],
};
