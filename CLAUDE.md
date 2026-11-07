# The Plug Africa — Project Brief for Claude Code

Owner: Bilson (Group BD, Accra, Ghana). Goal: a durable, passive-income business that serves international clients and expats. Working name and domain: **The Plug Africa**, **ThePlugAfrica.com**.

Status legend used below: **[Decided]** the owner chose it. **[Proposed]** my suggestion, not yet approved. **[Open]** unresolved or unverified.

---

## 1. What we are building

A one-stop platform and directory that connects people to verified businesses and services across Africa. It targets people who have a need and do not know where to turn: expats, returnees, investors, researchers, businesses, young and old.

**[Decided] Operating model**
- Self-service and **non-custodial**. The Plug never handles anyone's money.
- Every business is uploaded with its credentials and accreditations, a rating, and a comments section.
- Contact between customer and business is direct. A disclaimer shows when someone contacts a business.
- **Special Service** is the only tab where The Plug involves itself: concierge, mediation and follow-up. It is paid.
- The Plug must be able to tell a business that an enquiry came from The Plug, so commercial collections (commission) can be clarified.
- At the start, the team enters the data. Later, businesses pay to be listed.
- **[Decided]** Masked-contact routing and similar tools will be added where needed. The owner called this very important.
- Being a startup, we cannot dictate terms at first. We connect, watch how business goes, then follow up.

## 2. Categories (tabs)

**[Decided] Owner's priorities:** Entertainment, Special Services (including car services), Investments (NGOs fall here), Emergency contacts, Rentals, Education, and Human Resources (added later as "very important").

| Category | Notes |
|---|---|
| Jobs & HR | Recruiters, employers, talent, payroll, relocation support |
| Rentals | Homes and stays from verified owners |
| Education | Schools, tutors, training |
| Entertainment | Events, nightlife, dining, culture |
| Special Services | Car services, trades, personal concierge, mediation (paid, hands-on) |
| Invest & NGOs | Opportunities and impact organisations |
| Emergency | Police, fire, ambulance, embassies, hospitals per city |
| Classifieds | Affordable items: electronics, clothes, cars |

Food and professional services were in the original pitch and fold into the above (Entertainment, Special Services).

**[Proposed] Phasing**
1. Phase 1: Classifieds, Rentals, Entertainment, Education.
2. Phase 2: HR, Special Services.
3. Phase 3: Emergency, NGOs, Investment.
This sequencing is from the partner deck. The owner's stated priority list is broader, so confirm before locking.

## 3. Revenue model

**[Proposed in deck, not finalised]** listing fees and featured placement, business subscriptions, pay-per-lead, affiliate commissions, concierge fees (Special Service), and commission on introductions through The Plug. No pricing is set. Do not invent numbers in the product; use placeholders.

## 4. Trust, legal and risk

- Verified, rated listings with credentials. Comments and ratings on every listing.
- Disclaimer shown before direct contact: The Plug is a directory, does not handle payments or guarantee outcomes, and users should verify credentials.
- Key risks to design for: **disintermediation/leakage** (parties move off-platform after the intro), fake listings, review abuse, liability for outcomes. Masked contact routing (Twilio-style) and recorded introductions address leakage.
- **[Open]** Emergency numbers: only 112 appears in the prototype and it is not verified per country. Verified numbers per city must be sourced before launch.
- **[Open]** Data protection and consumer-law review for Ghana and each launch country.

## 5. Brand

**Name:** The Plug Africa (chosen after "Bills Plug" / "The Plug" had naming conflicts).
**Near-collisions to be aware of:** plugzafrica.com (Ghana entertainment/events brand) and plugafrica.co.za (pan-African deals). Test saying both names aloud to check for confusion.

**[Decided] Logo: "Linked Mark" (concept #4), the ORIGINAL flat version. Do NOT use the "enhanced" version.**
Two interlocked rounded rings, navy and gold. Core geometry (viewBox about 0 0 210 160):
```
<rect x="20" y="40" width="80" height="68" rx="34" fill="none" stroke="#14173A" stroke-width="9"/>
<rect x="96" y="40" width="80" height="68" rx="34" fill="none" stroke="#B4913F" stroke-width="9"/>
```
Original source: `/home/claude/logo/v2/c4_link.svg` and lockup `c4_lockup.svg` (wordmark "THE PLUG" in a bold serif, "AFRICA" spaced sans in gold, a thin vertical divider). On dark backgrounds the prototype uses cream `#F3EEDF` and light gold `#D9BE7A` for the two rings.

**Palette (brand core):** Navy `#14173A`, Gold `#B4913F`, Cream `#FAF7F0`, line `#E4DDCB`, muted `#6E7180`.
**Dark-site palette used in the prototype:** bg `#0A0C21`, bg2 `#10133A`, card `#15184A`, line `#2A2E5E`, fg `#F3EEDF`, light gold `#D9BE7A`, ember `#C8501F`, ok-green `#7FD1A0`.
**Type in the prototype:** Fraunces (display, light weight, italic for emphasis words) and Inter (body). The earlier website used Lora and Work Sans. The owner disliked that first UI.

Voice: calm, plain, trustworthy, a little hospitality. Avoid hype and invented statistics.

## 6. Website — current state

The owner disliked the first website UI and asked for premium, animated, human-feeling design. We produced five homepage directions on a design canvas (A Editorial Luxury, B Search-First Marketplace, **C Dark Concierge**, D Clean Trust Platform, E Afro-Modern Bold). **[Decided] The owner chose C** to try first, then asked for animation, then for real human and business photos.

**Deliverables (published as private Claude artifacts; owner-only until shared):**
- Design canvas with the five directions.
- Working site, direction C, calmer: `/home/claude/site/c_site.html`.
- Animated version of C: `/home/claude/site/c_anim.html` (the current best). The earlier plain v1 is `/home/claude/site/index.html` (disliked, superseded).

**Features of the animated prototype (front-end only, single HTML file):**
- Hero with aurora background, word-by-word headline reveal, rotating "Find ..." phrase, hero search (what + city), quick chips, count-up stats.
- Marquee of the eight categories; bento category grid with cursor spotlight and tilt; clicking a category filters the directory.
- Directory: category chips, search, city filter, sort, 17 clearly-labelled **example** listings with verified badge, rating, price, credentials, sample reviews.
- Listing detail sheet with disclaimer; "Contact via The Plug" generates a reference code (demo of recorded introduction); "Ask a concierge to mediate" pre-fills the concierge form.
- Concierge request form (success state with reference code), trust section, emergency block (112 only), business waitlist form.
- Mobile nav, scroll progress bar, magnetic buttons, spring modal, `prefers-reduced-motion` support.
- Animation library: Motion (`motion@11.11.13` from jsDelivr, the engine behind Framer Motion). 21st.dev components were **not** used: they are React/Tailwind and the build environment could not fetch them. Effects were recreated by hand.

**Nothing is wired to a backend.** Forms, waitlist, reference codes, listings and reviews are all demo data in JavaScript.

**Next UI work the owner wants:** real photography (human portraits, business and city images). Photos must be supplied by the owner or licensed; the build environment cannot download images. Plan: hero imagery, category card images, directory card photos, listing sheet images, and a "Stories" strip of real people with quotes (example text until real testimonials exist), with the same animation treatment.

### 6a. Rebuild (Next.js, this repo) — 2026-11-04

- **[Decided] Direction D "Marketplace" is the chosen design.** The owner rejected the dark/editorial directions A–C (Cinematic, Editorial, Stories). D and E were built after studying Airbnb, Thumbtack, Fresha, TaskRabbit, Checkatrade, GetYourGuide, InterNations, Quintessentially, Jiji and Meqasa. The owner "loved both D and E" and chose D.
- D pattern: white, airy page; a rounded photo hero that cross-fades between categories, with a white search card on top; trust chips beside the search; icon category tabs that swap photo tiles; example listing rows; a quiet navy concierge band; a floating "Ask a concierge" button.
- Type: headings in **Plus Jakarta Sans** (bold). Fraunces is kept only for the logo wordmark. Body text is Inter. The brand palette is unchanged.
- Motion: quick and subtle (fade-ups, sliding tab underline, hover lift), following Emil Kowalski's rules (skills in `C:\Projects\grc-deal-flow\.agents\skills\`).
- Photos: Unsplash (free licence), each one matching its subject, credited in `public/images/CREDITS.md`. **Never use Pinterest** (re-shared, unlicensed).
- **UI consistency rules (the owner asked for this explicitly; don't break them):**
  - Design values live in one place: CSS tokens in `src/app/globals.css` (`@theme`) and scripted-motion values in `src/lib/motion.ts`. Don't hard-code durations, curves, shadows, radii or hex colours in components.
  - Use the kit in `src/components/ui/`: `Button`/`LinkButton` (cva variants: primary, secondary, gold, light, outlineLight, ghost; sizes sm 40px, md 48px, lg 56px), `Select` (Base UI; variants field, pill, bare; no native `<select>`), `Switch`, `ChipGroup` (single-select filters with a sliding highlight), `Sheet` (the only dialog: bottom sheet on phones, centred card on desktop). Form fields are in `src/components/market/Form.tsx`.
  - Motion: enter with EASE.out, move on screen with EASE.inOut, exits faster than entries, one SPRING for indicators, a STAGGER of 0.05. Every card image uses the `.media-zoom` hover. Pressables use `.press`. Respect reduced motion.
  - Radii: pills for controls; `rounded-card`/`rounded-field` 16px; `rounded-panel` 24px; `rounded-hero` 28px. Shadows: `shadow-card`, `shadow-pop`, `shadow-float`, `shadow-header`.
### 6c. Collaboration rules (decided 2026-11-04; full text in CONTRIBUTING.md)

- **[Decided]** Every change starts from a GitHub Issue → `feature/<issue#>-<slug>` branch off `develop` → PR into `develop` with the template and `Closes #N` → CI green → **the owner reviews and merges**. Releases are a PR `develop` → `main` that the owner merges, then a tag and a CHANGELOG entry.
- Claude never merges or pushes directly to `develop` or `main`, and adds no co-author or attribution trailers.
- The backlog lives in GitHub Issues with labels (`type:*`, `area:*`, `priority:*`, `needs-decision`), phase milestones and a project board.
- The repo is private on GitHub Free, so branch protection isn't available; the rules are conventions, checked by CI (`.github/workflows/ci.yml`).

### 6d. Hosting stack (decided by the owner on 2026-11-05)

- **[Decided]** **Supabase** for the database and photo storage (London region). **Cloudflare** hosts the Next.js app on Workers via `@opennextjs/cloudflare`, and serves DNS. **ThePlugAfrica.com** is registered at a registrar other than Cloudflare (the owner will choose which), with its nameservers pointed to Cloudflare. This replaces the earlier Vercel + Neon + Vercel Blob proposal.
- Costs: Cloudflare Workers paid plan (about $5/month, likely needed for bundle size). Supabase Free is fine for staging, but **production must be on Supabase Pro (about $25/month)** because free projects pause after a week of inactivity.
- What the Workers runtime means for the code (issues #3 and #4): photo uploads and the photo library move to Supabase Storage (no local disk); the Prisma connection must work on Workers; `next/image` needs a Cloudflare- or Supabase-compatible loader.
- Accounts are created by the owner (Claude can't create accounts). Secrets go into Cloudflare/Supabase settings, never into chat or the repo.
- **[Decided 2026-11-05] Whose accounts:** the site is hosted on **Kenneth's** Cloudflare and Supabase accounts. The developer is **Reginald** (GitHub `Onfroy666999`, which owns the repo); he works through membership of Kenneth's accounts. This computer's Wrangler is signed in to Reginald's own Cloudflare account for other projects: never deploy from it and never log it out.
- **[Decided 2026-11-05] How it deploys:** Cloudflare **Workers Builds** (Git integration) in Kenneth's account builds from the GitHub repo. Two Workers: `theplugafrica-staging` from `develop` and `theplugafrica` from `main`, using the environments in `wrangler.jsonc`. No Cloudflare token is stored in GitHub. Step-by-step setup: `docs/DEPLOY.md`.
- Bundle size measured 2026-11-05: **about 2.4 MiB gzipped**, under the free plan's 3 MiB limit (it was 3.1 MiB until the share card became a fixed image, which removed `next/og`). Most of it is the Next.js runtime, our pages, Prisma's query engine, Motion and Base UI. Keep an eye on it: avoid `next/og` and other heavy server-side libraries. Workers Paid (about $5/month) is still needed: the free plan allows 10 ms CPU per request, which server-rendered pages often exceed.

### 6b. Admin and backend (feature/admin, 2026-11-04)

- **Admin user:** the owner, Kenneth Ato Bilson-Ogoe. Sign in at `/admin/login`. The account is seeded from `.env` (`ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD`; the file is gitignored). Change the password with `npm run admin:password`.
- **Team accounts (#18):** roles are Owner (everything, including deleting, the team and the activity log), Editor (adds and edits, uploads photos, works the inboxes; can't delete or manage the team) and Viewer (read only); defined in `src/lib/roles.ts`. Every admin action checks the role on the server with `requireAdmin(permission)`; screens hide what a role can't use (`useCan`). Owners invite people at `/admin/team`: the single-use link (7 days, only its hash stored) is emailed when email is on and can always be copied to send by WhatsApp. There's no self-service "forgot password": an owner sends a password link, and setting a new password signs out every other session. The team always keeps at least one owner. `/admin/activity` lists who changed what (`src/lib/audit.ts`; call `audit()` in any new admin action).
- **Stack:** Prisma 6 + **PostgreSQL** (issue #2). Locally the database runs in Docker (`docker-compose.yml`, host port **5433**, because 5432 belongs to another local project). Staging and production use **Supabase** Postgres in the **London** region (pooled URL on port 6543 with `?pgbouncer=true` as `DATABASE_URL`, direct URL on 5432 as `DIRECT_URL`). Schema changes go through migrations in `prisma/migrations` (`npm run db:migrate -- --name <change>`); deploys run `npm run db:deploy`. `DATABASE_URL` is the pooled URL and `DIRECT_URL` the direct one (they are the same locally). Sessions are signed JWT cookies (jose, `AUTH_SECRET`), checked in `src/middleware.ts` and again by `requireAdmin()` in every admin page and action. Passwords use bcrypt; sign-in is throttled to 5 attempts per 15 minutes.
- **Admin sections:** Dashboard; Businesses (add, edit, photos, credentials checklist, status Draft → In review → Verified → Hidden; Verified is blocked until every credential is Checked); Enquiries (reference codes from "Contact this business"); Concierge requests; Business waitlist; Messages (from the Contact page, #29). Each inbox has a status and private notes.
- **Public site** reads businesses from the database (`src/lib/data.ts`); only In review and Verified are public. The forms and the contact sheet save to the database (`src/app/actions.ts`). The 16 design examples are seeded with `isExample` and labelled "Example".
- **Setup:** `npm install` → `npm run db:up` (Docker) → `npm run db:deploy` → `npm run db:seed`. To **use** the site/admin: `npm run serve` (production build; pages respond in about 0.2–1 s). To **develop**: `npm run dev` (Turbopack; the first visit to each page compiles slowly on this machine, 10–30 s). Development mode made the admin feel unresponsive (5–36 s per page with webpack), so the owner should use `npm run serve`.
- **Windows gotcha:** stopping a background `npx next ...` task can leave the real `node ... next` process alive, still holding the port. Before restarting, check `netstat -ano | findstr :3000` and stop the leftover node process (confirm its command line is this project's Next.js first).
- **[Open] Before hosting:** photo uploads go to `public/uploads` (local only), so cloud storage is needed for hosting; move the database to Postgres; set real `AUTH_SECRET` and admin credentials in the host's environment.
- Performance note: the Claude-in-Chrome test tab renders every rich page at about 1 fps (Airbnb included), probably because of Grammarly desktop. Judge motion in an Incognito window.

## 7. Suggested path to a production build (for Claude Code)

**[Proposed]**
1. Convert the prototype to a real stack, e.g. Next.js (App Router) + TypeScript + Tailwind, with Framer Motion (`framer-motion`) and 21st.dev / shadcn-style components now that npm is available.
2. Data model: `Business` (name, category, city, description, credentials[], verification status, contact channels, owner), `Listing`, `Review`, `Enquiry` (reference code, source=ThePlug, timestamps, status), `ConciergeRequest`, `EmergencyContact` (country, city, service, number, verifiedAt, source).
3. Backend: Postgres + auth. Admin panel for the team to enter and verify businesses (the owner said the team enters data first).
4. Masked contact: relay email first, then masked phone/WhatsApp via a telephony provider. Every enquiry gets a reference code that is stored.
5. Verification workflow: document upload, manual review, badge states (In review, Verified).
6. Reviews with moderation. Search with filters by city and category. SEO pages per city and category.
7. Payments only for The Plug's own fees (subscriptions, featured listings, concierge), never for the underlying transactions between users and businesses.
8. Analytics and leakage tracking on introductions.

## 8. Other deliverables already produced

- Partner presentation (PowerPoint, 12 slides) and business overview (Word, 8 pages), both rebranded to The Plug Africa. They contain an unverified phrase, "domain secured at ThePlugAfrica.com"; correct it once the owner confirms purchase.
- Logo exploration: v1 plug-prong "A" mark, v2 five concepts, enhanced #4 (rejected for use).
- Comparable platforms were reviewed; the owner found "quite some lapses" in them, which is the opening for The Plug.

## 9. Open items and next steps

1. **Domain:** confirm ThePlugAfrica.com is actually registered. Check the registrar, and nic.gh if a .com.gh is wanted.
2. **Trademark:** search and file for "The Plug Africa" in Ghana (Registrar General) and priority export markets.
3. **Photos:** owner to supply or license images; then integrate (see section 6).
4. **Backend:** real forms, waitlist, database, admin panel.
5. **Emergency data:** collect and verify numbers per country and city.
6. **Pricing and commission terms:** decide listing tiers, lead fees and concierge fees.
7. **Legal:** terms, privacy policy, directory disclaimer review per market.
8. **Pilot data:** seed real businesses in one city (likely Accra) to test the loop.
9. Optionally replace the logo in the deck and doc with the chosen Linked Mark.

## 10. Working preferences observed

- The owner wants to see work and react, not to read plans. Show options and let them choose.
- The owner decides on look and brand; do not substitute a different logo or palette.
- Premium, world-class quality is the bar ("worth 10,000 USD to build"). Avoid generic, templated design.
- Never present made-up statistics, ratings or testimonials as real. Mark examples clearly.
