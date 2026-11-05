# Changelog

Notable changes to The Plug Africa. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [Semantic Versioning](https://semver.org).

## [Unreleased]

### Added
- Services inside categories (#26): each category page (`/explore/rentals`) lists its services, and each service page (`/explore/rentals/cars`) lists the businesses offering it. 36 starting services, breadcrumbs on category, service and listing pages, and homepage category tabs built from the services.
- Admin Services page: add, edit, hide, reorder and delete services per category. The business form now asks which services (one or more) a business offers.
- Example businesses for car rental and event rentals.
- Home care in Special Services (#24): housekeepers and maids, cleaning services, nannies and childcare, laundry and ironing, with two example home-care businesses.
- Collaboration setup: contributing guide, issue and pull request templates, code owners, CI checks on every pull request, consistent line endings.

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
