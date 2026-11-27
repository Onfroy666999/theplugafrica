// Long-form copy for category and service pages (issue #38).
// Voice: calm, plain, welcoming. No invented numbers (fees, timelines, statistics) and no promises
// The Plug can't keep: agencies decide approvals, and The Plug never holds anyone's money.
// Requirements named here are typical for Ghana; a concierge confirms what applies to each case.

import type { CatKey } from "./directory";

export type Faq = { q: string; a: string };
export type Checklist = { title: string; items: string[] };

export type CategoryContent = {
  /** Large welcoming line under the category name. */
  welcome: string;
  intro: string[];
  image: string;
  imageAlt: string;
  /** Listing categories: what "verified" means here. Concierge categories: who it's for. */
  checks: Checklist;
  /** Listing categories: what to do before you commit. Concierge categories: unused (trust points are shared). */
  tips?: Checklist;
  faqs: Faq[];
};

export type ConciergeServiceContent = {
  welcome: string;
  intro: string;
  included: string[];
  /** Optional extra list, e.g. the licences we commonly help with. */
  examples?: Checklist;
  youNeed: string[];
  whoFor: string[];
  faqs: Faq[];
};

/* ---------------- Shared ---------------- */

const FAQ_PAYMENT: Faq = {
  q: "Does The Plug take my payment or deposit?",
  a: "No. You pay the business directly, on terms you agree with them. The Plug is a directory: we check businesses before they're listed and record every introduction, but we never hold your money.",
};
const FAQ_VERIFIED: Faq = {
  q: "What do “Verified” and “In review” mean?",
  a: "Verified means every check listed on this page has been completed by our team. In review means the business has passed our first checks and is listed while the rest are finished. We show which credentials have been checked on every listing.",
};
const FAQ_PROBLEM: Faq = {
  q: "What if something goes wrong?",
  a: "Tell us, and quote the reference code you got when you contacted the business. We'll follow up with them, and a business that doesn't hold up to what it told us loses its badge. We can't guarantee the outcome of any job, which is why the checks above matter.",
};
const FAQ_CONCIERGE: Faq = {
  q: "Can someone handle this for me?",
  a: "Yes. A Plug concierge can find the right business, check the details in person, negotiate and follow up for you. It's a paid service, and the fee is agreed with you before any work starts.",
};

/** Why people trust The Plug with services it delivers itself (concierge categories). */
export const CONCIERGE_TRUST: { title: string; body: string }[] = [
  { title: "One person, start to finish", body: "A Plug concierge is your single point of contact. You won't be passed between agencies, offices and middlemen." },
  { title: "Fee agreed before we start", body: "After a free first call we explain the steps and agree our fee with you in writing. No surprises later." },
  { title: "Official fees paid in your name", body: "Government and agency fees go directly to the agency, with official receipts in your name. The Plug never holds your money." },
  { title: "Professionals where the law requires them", body: "Where a lawyer, company secretary or chartered accountant must act, we bring in a licensed professional and tell you first." },
];

/* ---------------- Categories ---------------- */

export const CATEGORY_CONTENT: Partial<Record<CatKey, CategoryContent>> = {
  rentals: {
    welcome: "A place to live, a car to drive, kit for your event, from owners we've checked.",
    intro: [
      "Renting in a new city is where people most often get caught out: listings that don't exist, agents who disappear with a deposit, cars that aren't insured. Every owner and agent you find here has been checked by our team before they appear.",
      "Choose what you need below and contact the owner directly. If you'd rather someone viewed the place, negotiated and followed up for you, a Plug concierge can.",
    ],
    image: "/images/rentals.jpg",
    imageAlt: "A bright, furnished apartment living room",
    checks: {
      title: "What we check before a rental is listed",
      items: [
        "The owner's or agent's ID matches the person you'll deal with",
        "Proof they own the property or vehicle, or are authorised to rent it out",
        "Business registration for agencies and rental companies",
        "For cars: vehicle registration and valid insurance",
      ],
    },
    tips: {
      title: "Before you pay anything",
      items: [
        "View the place or the car in person, or send someone you trust",
        "Get a written agreement that states the rent, the deposit and what's included",
        "Pay into an account in the owner's or company's name, never a third party's",
        "Ask for a receipt for every payment",
      ],
    },
    faqs: [
      FAQ_PAYMENT,
      {
        q: "How much rent will I be asked to pay up front?",
        a: "Many landlords in Ghana ask for a year or more in advance, although the law limits rent advance to six months. Agree the amount, and what it covers, in writing before you pay.",
      },
      { q: "Can someone view a place for me before I arrive?", a: "Yes. A Plug concierge can view it for you, send photos and video, check the area and negotiate. It's a paid service, agreed up front." },
      FAQ_VERIFIED,
      FAQ_PROBLEM,
    ],
  },

  "jobs-hr": {
    welcome: "Hire, relocate and look after your team with partners you can rely on.",
    intro: [
      "Hiring your first employee in Ghana, moving your family here for a new role or setting up payroll all go faster with the right partner. The recruiters, relocation specialists and HR firms here have been checked by our team.",
      "Pick a service to see who offers it, and contact them directly. Every introduction carries a Plug reference code, so everyone knows where it started.",
    ],
    image: "/images/jobs.jpg",
    imageAlt: "Colleagues in a meeting around a table",
    checks: {
      title: "What we check before an HR business is listed",
      items: [
        "Business registration and the owner's ID",
        "A licence from the Labour Department for recruitment agencies",
        "References from businesses they've worked with",
        "A real office address we've confirmed",
      ],
    },
    tips: {
      title: "Before you sign",
      items: [
        "Agree the fee, what it covers and any replacement guarantee in writing",
        "If you're looking for work: genuine recruiters are paid by the employer, so be wary of anyone who asks you for a fee",
        "For staff coming from abroad, confirm who handles work and residence permits",
        "Keep copies of every contract and payslip",
      ],
    },
    faqs: [
      { q: "Can you help with work and residence permits?", a: "The relocation specialists listed here handle permits with the Ghana Immigration Service. A Plug concierge can coordinate the whole move if you'd like one person to manage it." },
      { q: "Do I have to pay to apply for a job?", a: "No. Genuine recruiters are paid by employers. If anyone asks you for a fee to get a job, don't pay, and tell us." },
      FAQ_VERIFIED,
      FAQ_PAYMENT,
      FAQ_PROBLEM,
    ],
  },

  education: {
    welcome: "Schools, tutors and training you can trust with the people who matter most.",
    intro: [
      "Choosing a school or a tutor is one of the biggest decisions a family makes, and harder in a new country. The schools, tutors and training centres here have been checked by our team, so you can start from a shortlist you can trust.",
      "Contact them directly to arrange a visit or a trial lesson. A Plug concierge can also visit schools with you, or for you, and compare the options.",
    ],
    image: "/images/education.jpg",
    imageAlt: "A pupil reading to her classmates",
    checks: {
      title: "What we check before a school or tutor is listed",
      items: [
        "Schools: registration and a licence from the education authorities",
        "Training centres: business registration and accreditation where it applies",
        "Tutors: ID, qualifications and references from families they've taught",
        "Anyone working with children: a police clearance",
      ],
    },
    tips: {
      title: "Before you enrol",
      items: [
        "Visit the school, or ask for a trial lesson with a tutor",
        "Ask which curriculum they follow and how they assess progress",
        "Get the full list of fees, including uniforms, books, transport and trips",
        "Ask how and when fees are paid, and get receipts",
      ],
    },
    faqs: [
      { q: "Are there schools with international curricula?", a: "Yes. Schools in Accra follow a range of curricula, including the Ghanaian national curriculum, Cambridge and the IB. Each listing says which one, and a concierge can help you compare them." },
      { q: "Can a tutor come to our home?", a: "Many tutors listed here teach at home or online. Agree the schedule, the fee and the subjects before the first lesson." },
      FAQ_VERIFIED,
      FAQ_PAYMENT,
      FAQ_CONCIERGE,
    ],
  },

  entertainment: {
    welcome: "Good food, good nights and memorable events, from places we've checked.",
    intro: [
      "Whether it's dinner tonight, a night out with friends or a wedding for two hundred, the places and people here have been checked by our team. Find something you'll enjoy, and book directly.",
      "Planning something bigger? A Plug concierge can bring the venue, caterer, decor and music together and keep everyone on schedule.",
    ],
    image: "/images/dining.jpg",
    imageAlt: "A woman smiling over lunch at a restaurant",
    checks: {
      title: "What we check before a venue or business is listed",
      items: [
        "Business registration and the owner's ID",
        "A permit from the local assembly for venues",
        "Food hygiene certification for restaurants and caterers where required",
        "A real address we've confirmed",
      ],
    },
    tips: {
      title: "Before you book an event",
      items: [
        "Get the quote in writing: what's included, guest numbers and timings",
        "Agree the deposit, the payment dates and the cancellation terms",
        "For outdoor events, ask about power, toilets and a rain plan",
        "Check noise and closing-time limits with the venue",
      ],
    },
    faqs: [
      { q: "Can The Plug plan an event for me?", a: "Yes. A Plug concierge can find and book the venue, caterer, rentals and entertainment, and coordinate on the day. It's a paid service, agreed up front." },
      FAQ_PAYMENT,
      FAQ_VERIFIED,
      FAQ_PROBLEM,
    ],
  },

  "special-services": {
    welcome: "Drivers, trades and help at home, from people we've checked.",
    intro: [
      "Letting someone into your home or your car takes trust. The drivers, tradespeople, housekeepers and nannies here have been checked by our team before they're listed, so you're not relying on a stranger's word.",
      "Choose a service, compare who offers it and contact them directly. For anything that needs more care, a Plug concierge can arrange, supervise and follow up.",
    ],
    image: "/images/chauffeur.jpg",
    imageAlt: "A uniformed chauffeur polishing a car",
    checks: {
      title: "What we check before someone is listed",
      items: [
        "ID that matches the person who'll turn up",
        "A police clearance for anyone working in your home or driving you",
        "References from previous clients or employers",
        "A driving licence for drivers, and trade certification where it exists",
      ],
    },
    tips: {
      title: "Before the work starts",
      items: [
        "Agree the job, the price and the timing before anyone starts",
        "For household staff, start with a trial day or week",
        "Put live-in and long-term arrangements in writing",
        "Pay on the terms you agreed, and keep a record",
      ],
    },
    faqs: [
      { q: "How do you check people who work in homes?", a: "We check their ID and police clearance, and speak to previous clients or employers before they're listed. Each listing shows which checks have been completed." },
      FAQ_PAYMENT,
      FAQ_VERIFIED,
      FAQ_CONCIERGE,
      FAQ_PROBLEM,
    ],
  },

  "invest-ngos": {
    welcome: "Opportunities and organisations you can look into with confidence.",
    intro: [
      "Investing or partnering in a new market depends on finding people who are who they say they are. The advisers, developers and organisations here have been checked by our team before they're listed.",
      "Use this as a starting point, not a recommendation. Contact them directly, take independent advice, and ask a Plug concierge if you'd like help with introductions and visits on the ground.",
    ],
    image: "/images/invest.jpg",
    imageAlt: "Two businessmen in conversation as they walk",
    checks: {
      title: "What we check before an organisation is listed",
      items: [
        "Registration with the relevant authority",
        "Licences where the law requires them, for example from the Securities and Exchange Commission for investment advisers",
        "The people in charge, and a real address",
        "For NGOs: registration and a record of their work",
      ],
    },
    tips: {
      title: "Before you commit money",
      items: [
        "Be wary of anyone who promises guaranteed returns",
        "For land and property, have a lawyer search the title at the Lands Commission",
        "Take independent legal and financial advice",
        "Put every agreement in writing and pay only into accounts in the organisation's name",
      ],
    },
    faqs: [
      { q: "Does The Plug give investment advice?", a: "No. We check that the organisations listed are real and registered. Decisions about investing are yours, and we recommend independent legal and financial advice." },
      { q: "How do I check land before buying?", a: "Have a lawyer carry out an official search at the Lands Commission to confirm who owns the land and whether there are disputes. A Plug concierge can introduce you to lawyers who do this." },
      FAQ_PAYMENT,
      FAQ_VERIFIED,
    ],
  },

  classifieds: {
    welcome: "Good things at fair prices, from sellers we've checked.",
    intro: [
      "Buying second-hand is a great way to furnish a home or find a car, as long as the seller is genuine. Shops and sellers here have been checked by our team before they're listed.",
      "Contact the seller directly, see the item before you pay, and if you're buying something big like a car, a concierge can arrange an inspection for you.",
    ],
    image: "/images/classifieds.jpg",
    imageAlt: "A market stall full of goods for sale",
    checks: {
      title: "What we check before a seller is listed",
      items: ["The seller's ID", "Business registration for shops and dealers", "A real address we've confirmed", "For car dealers: the vehicle's registration documents"],
    },
    tips: {
      title: "Before you pay",
      items: [
        "See and test the item before you pay for it",
        "Meet in a busy public place, or at the shop",
        "For cars, check the documents and have a mechanic inspect it",
        "Get a receipt that names the item and the price",
      ],
    },
    faqs: [
      FAQ_PAYMENT,
      { q: "Can someone inspect a car for me?", a: "Yes. A Plug concierge can arrange a mechanic to inspect it and check the documents before you buy." },
      FAQ_VERIFIED,
      FAQ_PROBLEM,
    ],
  },

  "new-business": {
    welcome: "Start and run your business in Ghana, without the runaround.",
    intro: [
      "Registering a company, getting the right licences and keeping up with filings can mean weeks of queues, forms and conflicting advice, especially if you're new to Ghana or running things from abroad. The Plug does that work for you, and brings in a licensed lawyer when you need one.",
      "You get one concierge who explains what your business needs, agrees the fee with you up front and deals with the agencies until it's done. You stay in control: applications are made in your name, and official fees are paid directly to the agency.",
    ],
    image: "/images/new-business.jpg",
    imageAlt: "Two colleagues celebrating at a desk",
    checks: {
      title: "Who it's for",
      items: [
        "First-time founders who want to do it properly from day one",
        "Diaspora and returnees starting something at home",
        "Foreign investors setting up a company in Ghana",
        "Existing businesses that need to formalise or catch up on filings",
      ],
    },
    faqs: [
      { q: "Is The Plug a law firm or an accounting firm?", a: "No. We coordinate the process and handle the paperwork and the agencies for you. Where the law requires a lawyer, company secretary or chartered accountant to act, we bring in a licensed professional and tell you before they start." },
      { q: "Can I do this from abroad?", a: "Usually, yes. Much of the process can be done online and documents can often be signed remotely. Where a visit in person or certified copies are needed, we tell you in the first call and plan around your travel." },
      { q: "What will it cost?", a: "There are two parts: official fees, which you pay directly to the agencies, and The Plug's fee, which we agree with you in writing after a free first call. Nothing is charged before you agree." },
      { q: "How long will it take?", a: "It depends on what your business needs and on the agencies involved. We give you an estimate for your case in the first call and keep you updated at each step." },
    ],
  },
};

/* ---------------- Business services (the category's web address is still /explore/new-business) ---------------- */

export const CONCIERGE_SERVICE_CONTENT: Record<string, ConciergeServiceContent> = {
  "new-business/business-setup": {
    welcome: "From an idea to a registered, bankable business.",
    intro:
      "Setting up properly from day one makes everything after it easier: opening a bank account, signing contracts, hiring staff and getting licensed. We help you choose the right structure, prepare every document and deal with the agencies until your business is ready to trade.",
    included: [
      "Advice on the right structure: sole proprietorship, partnership or limited company",
      "Name search, and registration with the Office of the Registrar of Companies",
      "Tax registration with the Ghana Revenue Authority",
      "Employer registration with SSNIT when you're ready to hire",
      "Registration with the Ghana Investment Promotion Centre if the business has foreign ownership",
      "Introductions to banks, and help with the paperwork to open a business account",
      "A business operating permit from your local assembly",
      "Help finding an office or a business address",
    ],
    youNeed: [
      "A Ghana Card for Ghanaian directors and shareholders, or a passport for foreign nationals",
      "Two or three name ideas for the business",
      "A short description of what the business will do",
      "Details of the directors, shareholders and company secretary (for a limited company)",
      "A business address in Ghana, or we'll help you find one",
    ],
    whoFor: ["First-time founders", "Diaspora and returnees", "Foreign investors", "Sole traders becoming a company"],
    faqs: [
      { q: "Which structure should I choose?", a: "It depends on who owns the business, how much risk you're taking on and whether you'll bring in investors. We explain the options in the first call and recommend one in writing. Where legal advice is needed, a licensed professional gives it." },
      { q: "Is there a minimum investment for foreign-owned businesses?", a: "Yes. The Ghana Investment Promotion Centre sets minimum capital requirements for businesses with foreign ownership, and they vary with the type of business and the share owned. We confirm what applies to you before you commit." },
      { q: "Do I need to be in Ghana?", a: "Not for most steps. We tell you in the first call if any step needs you in person, so you can plan around it." },
      { q: "What will it cost?", a: "Official fees go directly to the agencies in your name. The Plug's fee is agreed in writing after a free first call, before any work starts." },
    ],
  },

  "new-business/legal": {
    welcome: "Legal help for your business, from a licensed lawyer, without the chasing.",
    intro:
      "Most business problems that turn legal start small: a contract signed without being read properly, a lease with a clause nobody explained, a supplier who won't pay. We find a licensed lawyer who handles your kind of matter, agree the scope and the fees with you up front, and follow the work through until it's done. The Plug isn't a law firm and doesn't give legal advice itself: the lawyer does, and we keep things moving.",
    included: [
      "A first call to understand what you need, and whether it needs a lawyer at all",
      "Matching you with a licensed lawyer who handles that kind of matter",
      "Drafting or reviewing contracts: supply, service, employment, partnership and shareholder agreements",
      "Leases and property: checking a lease, a land title or a purchase before you sign",
      "Company matters: changes of directors or shareholders, resolutions and agreements between owners",
      "Debt recovery and disputes: demand letters, negotiation and, where needed, mediation or court",
      "Following up with the lawyer and keeping you informed at each step",
    ],
    youNeed: [
      "A short description of the matter and what you want to achieve",
      "Copies of any documents involved: contracts, leases, letters or emails",
      "Your company documents, if it concerns a registered business",
      "A Ghana Card or passport for whoever the lawyer will act for",
    ],
    whoFor: ["Small and growing businesses without a lawyer", "Diaspora and foreign investors", "Landlords and tenants with a business lease", "Anyone about to sign something important"],
    faqs: [
      { q: "Is The Plug a law firm?", a: "No. A licensed lawyer gives the advice and does the legal work. We find the right one for your matter, agree the scope and fees with you before they start, and follow up until it's done." },
      { q: "What will it cost?", a: "There are two parts: the lawyer's fee, which they set and you agree before any work starts, and The Plug's fee for arranging and coordinating it, which we agree with you in writing after a free first call." },
      { q: "Can I work with the lawyer from abroad?", a: "Usually, yes. Most matters can be handled by phone, video and email, and many documents can be signed remotely. We tell you early if anything needs you in person." },
      { q: "Is what I tell you kept private?", a: "Yes. We share your details only with the lawyer handling your matter, and only what they need. What you tell the lawyer is covered by their professional duty of confidentiality." },
    ],
  },

  "new-business/licences": {
    welcome: "The right licences, from the right agencies, without the guesswork.",
    intro:
      "Most businesses need more than registration to operate legally: a permit from the local assembly, approval for the products they sell, or a licence for their sector. Knowing which ones apply, and in what order, is half the work. We work it out with you, prepare the applications and follow them through.",
    included: [
      "A review of your business and a written list of the licences and permits it needs",
      "Applications prepared and submitted on your behalf",
      "Follow-up with each agency until there's a decision, including inspections",
      "A calendar of renewal dates, so nothing lapses",
    ],
    examples: {
      title: "Licences we often help with",
      items: [
        "Business operating permit from the Metropolitan, Municipal or District Assembly",
        "Food and Drugs Authority registration for food, drinks, cosmetics and medicines",
        "Environmental Protection Agency permits",
        "Ghana Tourism Authority licences for hotels, restaurants and travel businesses",
        "Fire safety certificate from the Ghana National Fire Service",
        "Registration with the Data Protection Commission",
      ],
    },
    youNeed: [
      "Your business registration documents and TIN",
      "Details of your premises: the address and the lease or title",
      "Product details, labels or samples, if the licence covers products",
      "Copies of any licences you already hold",
    ],
    whoFor: ["New businesses getting ready to open", "Restaurants, hotels and clinics", "Importers and manufacturers", "Businesses told a licence is missing"],
    faqs: [
      { q: "Which licences does my business need?", a: "It depends on what you do and where. After the first call we send you a written list of what applies to your business, in the order to get them." },
      { q: "Can you guarantee approval?", a: "No. The agency makes the decision. We make sure your application is complete and correct, prepare you for any inspection and follow up until there's an answer." },
      { q: "What will it cost?", a: "Agency fees are paid directly to the agency in your name. The Plug's fee is agreed in writing before any work starts." },
    ],
  },

  "new-business/compliance": {
    welcome: "Stay in good standing, all year round.",
    intro:
      "Once your business is running, the deadlines keep coming: annual returns, monthly tax and social security filings, licence renewals. Missing them leads to penalties and can stop you winning contracts or opening accounts. We keep the calendar, remind you in good time and handle the filings with you and your accountant.",
    included: [
      "A compliance calendar for your business, with reminders before each deadline",
      "Annual returns and updates to company details with the Office of the Registrar of Companies, including beneficial ownership",
      "Tax filings with the Ghana Revenue Authority, coordinated with your accountant or one we introduce",
      "Monthly SSNIT contributions for your employees",
      "Licence and permit renewals",
      "Tax and SSNIT clearance certificates when you need them, for example for tenders",
    ],
    youNeed: [
      "Your business registration documents and TIN",
      "Your filing records, or your accountant's contact details",
      "Payroll details, if you employ staff",
      "Copies of your current licences and permits",
    ],
    whoFor: ["Small businesses without an admin team", "Companies managed from abroad", "Businesses catching up on missed filings", "Firms bidding for contracts"],
    faqs: [
      { q: "Do you replace my accountant?", a: "No. We work alongside your accountant, or introduce one. Anything that must be prepared or signed by a chartered accountant is done by one." },
      { q: "I've missed some filings. Can you help?", a: "Yes. We find out what's outstanding, agree a plan to catch up and handle it with the agencies. Penalties are set by the agencies, and we'll tell you what to expect." },
      { q: "Is this a one-off or ongoing?", a: "Either. We can do a one-off catch-up, or look after your compliance month by month. We agree which, and the fee, before we start." },
    ],
  },
};
