# The Plug Africa

A directory of verified businesses and services across Africa, for expats, returnees, investors and locals. Visitors find a business, check its credentials and contact it directly; a paid concierge handles things for them when they'd rather not. The Plug never handles customers' money.

Private repository. Owner: Kenneth Ato Bilson-Ogoe.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Motion · Base UI · Prisma + PostgreSQL (Docker locally, Supabase when hosted) · Cloudflare hosting

## Getting started

```bash
npm install
cp .env.example .env      # fill in values
npm run db:up && npm run db:deploy && npm run db:seed   # needs Docker
npm run dev               # develop with hot reload
npm run serve             # production build, for day-to-day use
```

- Public site: http://localhost:3000
- Admin: http://localhost:3000/admin

## Working on the project

- **How we collaborate** (issues, branches, pull requests, reviews, releases): [CONTRIBUTING.md](CONTRIBUTING.md)
- **Product brief, decisions and design rules**: [CLAUDE.md](CLAUDE.md)
- **What changed in each version**: [CHANGELOG.md](CHANGELOG.md)
- **Photo licences**: [public/images/CREDITS.md](public/images/CREDITS.md)
