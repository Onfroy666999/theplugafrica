# Changelog

Notable changes to The Plug Africa. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [Semantic Versioning](https://semver.org).

## [Unreleased]

### Added
- Nightly encrypted database backups (#8): a GitHub Actions workflow dumps the app tables from Supabase at 02:30 UTC, encrypts them with a passphrase and keeps them for 30 days. Off until `BACKUPS_ENABLED` and two secrets are set. Restore steps, tested, in `docs/BACKUPS.md`.

## [0.5.0] - 2026-11-06

### Added
- Better requests (#50): concierge requests and a new "Send a request" on every listing ask where the service happens (at my place, at their location, somewhere else, online or by phone; choices depend on the category), the city and area (neighbourhood lists for Accra, Kumasi, Takoradi and Tamale, with "Other"), a landmark or Ghana Post GPS address, and a preferred date and time of day. Requests to a business are stored as enquiries with a reference code; the admin shows the details in Enquiries and Concierge.

### Fixed
- Filter chips inside a form no longer submit the form.

## [0.4.1] - 2026-11-06

### Added
- Photo uploads in Supabase Storage (#3): admin uploads go to the public `business-photos` bucket and appear in the photo library; each file is checked for type, the 6 MB limit and real image content before anything is saved. Uploaded photos are optimised like the site's own. Upload requests may now be up to 25 MB (several photos at once); Next.js previously capped them at 1 MB.

### Fixed
- On phones the menu showed "List your business" twice; the header copy now hides below tablet width, and the menu copy hides from tablet width up (#46).

## [0.4.0] - 2026-11-06

### Added
- Production setup (#4): the live Worker uses the same Supabase database and Hyperdrive config as staging for now; the live site hides the example businesses (staging keeps them). Supabase CLI added as a dev dependency (`npx supabase`).
- Cloudflare hosting setup (#4): OpenNext build for Cloudflare Workers, staging and production Workers in `wrangler.jsonc`, deploys by Cloudflare Workers Builds from `develop` and `main` (no tokens in GitHub), setup guide in `docs/DEPLOY.md`. The staging site shows a banner and blocks search engines.
- New Business category (#36), delivered fully by The Plug's concierge: Set up a new business, Licence acquisition and Compliance services. Each service page explains the steps and has a request form pre-set to that service; requests arrive in Admin › Concierge labelled with the service. New Business is in the header, homepage tabs, footer and sitemap, and is kept out of business listings.
- Richer category and service pages (#38): every category opens with a welcome and an introduction, then its services, what we check before a business is listed, what to do before you commit, common questions and a concierge band. New Business service pages explain what's included, what you'll need, who it's for and why to trust The Plug, with the other services shown as cards further down. New accordion component for questions.

### Changed
- The homepage hides the "Popular in Accra" strip when there are no businesses to show.
- The database client connects through the `pg` driver adapter, with a fresh connection per request on Workers.
- The admin photo library is listed at build time; photo uploads show a "not available yet" message on the hosted site until Supabase Storage (#3).
- The share card is a fixed image (`public/images/share-card.png`) instead of being drawn on request.

## [0.3.0] - 2026-11-05

### Added
- Services inside categories (#26): each category page (`/explore/rentals`) lists its services, and each service page (`/explore/rentals/cars`) lists the businesses offering it. 36 starting services, breadcrumbs on category, service and listing pages, and homepage category tabs built from the services.
- Admin Services page: add, edit, hide, reorder and delete services per category. The business form now asks which services (one or more) a business offers.
- Example businesses for car rental and event rentals.
- About and Contact pages (#29). The Contact form saves to a new admin **Messages** inbox (status and notes like the others) and gives the sender a reference code. Footer links to both.
- Search engines (#13): sitemap.xml, robots.txt (admin and design options excluded), canonical links, a branded share card and per-page share previews, service-by-city pages (`/explore/rentals/cars/accra`), and structured data for breadcrumbs and real businesses. Example listings, and service pages without a real business, are kept out of search results. Set `NEXT_PUBLIC_SITE_URL` in each environment.
- Home care in Special Services (#24): housekeepers and maids, cleaning services, nannies and childcare, laundry and ironing, with two example home-care businesses.
- Collaboration setup: contributing guide, issue and pull request templates, code owners, CI checks on every pull request, consistent line endings.

### Fixed
- The header and mobile menu no longer show a Sign in button that went nowhere; "List your business" takes its place until customer accounts arrive (#28).
- Unknown addresses and missing listings show a branded "page not found" page with search and categories; failed pages show a branded error page whose "Try again" reloads from the server (#28).

### Changed
- Car hire moved from Special Services to Rentals → Cars.
- Explore search matches word roots, so "cleaner" finds cleaning services and "nanny" finds nannies.
- Database moved from SQLite to PostgreSQL with versioned migrations (#2). Local development uses Docker on port 5433. CI applies migrations to a fresh Postgres, checks they match the schema, and runs the seed.

## [0.2.1] - 2026-11-04

### Fixed
- Admin pages felt unresponsive in development mode. Added `npm run serve` for daily use (0.2–1.3 s per page) and switched development to Turbopack.
- The login timing-protection hash is now created on first use instead of at import.

## [0.2.0] - 2026-11-04

### Added
- Admin panel at `/admin`: sign-in, dashboard, businesses (add/edit, photos, credentials checklist, status workflow), and inboxes for enquiries, concierge requests and the business waitlist.
- Database (Prisma + SQLite locally) with seed data. The public site reads published businesses from it, and the forms save real records with reference codes.

## [0.1.0] - 2026-11-04

### Added
- Marketplace site (design direction D): homepage, Explore directory, listing pages with contact sheet, concierge, for-businesses and emergency pages.
- Shared design system: tokens, Button, Select, Switch, ChipGroup and Sheet components.
