# Deploying The Plug Africa

The site runs on **Cloudflare Workers** (via OpenNext) with a **Supabase** Postgres database, both in **Kenneth's** accounts. Cloudflare builds and deploys straight from the GitHub repository (Workers Builds), so no Cloudflare token is stored in GitHub.

| | Staging | Production |
|---|---|---|
| Worker | `theplugafrica-staging` | `theplugafrica` |
| Branch | `develop` | `main` |
| Supabase project | staging (Free) | production (Pro, so it never pauses) |
| Search engines | blocked, with a "Staging site" banner | allowed |

Never paste a password, connection string or token into chat, an issue, a commit or a file in the repo. They go only into the Cloudflare and Supabase dashboards (and, for local testing, into `.dev.vars` or `.env.staging`, which git ignores).

## 1. Access (Kenneth)

1. **Cloudflare:** Manage Account › Members › Invite Reginald, with a role that can manage Workers (for example *Workers Platform Admin*), plus *Billing* if he should change the plan.
2. **Cloudflare plan:** switch to **Workers Paid** (about $5/month). The app is about 3.1 MiB compressed; the free plan allows 3 MiB.
3. **Supabase:** Organization settings › Team › Invite Reginald with the *Developer* role.

## 2. Supabase connection strings (Reginald)

In the Supabase project: **Connect** (top bar) › **Connection string**.

- **Transaction pooler** (port **6543**): the app's `DATABASE_URL` at runtime.
- **Session pooler** (port **5432**): used to run migrations during the build. Use the pooler rather than "Direct connection", which is IPv6-only and unreachable from Cloudflare's build machines.

Replace `[YOUR-PASSWORD]` with the database password from project settings.

## 3. Create the Workers from the repository (Reginald, in Kenneth's Cloudflare account)

Make sure the account switcher shows **Kenneth's account**, then Workers & Pages › Create › **Import a repository** › GitHub. When GitHub asks, install the Cloudflare app on the `Onfroy666999` account and give it access to **only** the `theplugafrica` repository.

Create two Workers from the same repository:

| Setting | Staging Worker | Production Worker |
|---|---|---|
| Worker name | `theplugafrica-staging` | `theplugafrica` |
| Branch | `develop` | `main` |
| Build command | `npx prisma migrate deploy && npx opennextjs-cloudflare build` | same |
| Deploy command | `npx opennextjs-cloudflare deploy --env staging` | `npx opennextjs-cloudflare deploy --env production` |
| Non-production branch builds | off | off |

**Build variables and secrets** (Settings › Build), used only while building:

| Name | Type | Value |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | variable | the site's address, e.g. `https://theplugafrica-staging.<subdomain>.workers.dev` for now |
| `DATABASE_URL` | secret | Session pooler string (port 5432), for migrations |
| `DIRECT_URL` | secret | the same Session pooler string |

**Runtime variables and secrets** (Settings › Variables & Secrets), used by the live site:

| Name | Type | Value |
|---|---|---|
| `DATABASE_URL` | secret | Transaction pooler string (port 6543) |
| `AUTH_SECRET` | secret | a new random value of at least 32 characters, different for staging and production (generate with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`) |

`SITE_ENV` comes from `wrangler.jsonc`; don't set it by hand.

## 4. First data load (once per Supabase project)

The build applies migrations, but the starting services and the admin account come from the seed. Run it once from this computer:

1. Create `.env.staging` in the project folder (git ignores it) with `DATABASE_URL` and `DIRECT_URL` set to the **Session pooler** string, plus `ADMIN_EMAIL`, `ADMIN_NAME` and a **new** `ADMIN_PASSWORD` for the hosted admin.
2. Run: `npx dotenv-cli -e .env.staging -- npx prisma db seed`
   (or ask Claude to run it; it reads the file without showing the values).

The seed also loads the example businesses, which are labelled "Example" and kept out of search results.

## 5. Check it

- Open the staging address: the gold "Staging site" banner shows, Explore lists businesses, `/robots.txt` says `Disallow: /`.
- Sign in at `/admin/login` with the hosted admin details.
- Photo uploads in the admin show a "not available yet" message until Supabase Storage is added (issue #3); choose photos from the library meanwhile.

## Local testing of the Cloudflare build

`npm run preview` builds the Worker and runs it in Wrangler on http://localhost:8787, reading secrets from `.dev.vars` (git ignores it). Docker Desktop must be running for the local database. This computer's Wrangler is signed in to a different Cloudflare account, so never run `wrangler deploy` or the `deploy:*` scripts from here.
