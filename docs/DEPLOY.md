# Deploying The Plug Africa

The site runs on **Cloudflare Workers** (via OpenNext) with a **Supabase** Postgres database, both in **Kenneth's** accounts. Cloudflare **Workers Builds** builds and deploys straight from the GitHub repository, so no Cloudflare token is stored in GitHub. Workers reach Supabase through **Cloudflare Hyperdrive**, which pools and keeps the database connections warm.

| | Staging | Production |
|---|---|---|
| Cloudflare Worker | `theplugafrica-staging` | `theplugafrica` |
| Git branch | `develop` | `main` |
| Deploy command | `npx opennextjs-cloudflare deploy --env staging` | `npx opennextjs-cloudflare deploy` |
| Supabase project | **one shared project** ("Plug Africa Project", Free) | same project |
| Hyperdrive config | `theplugafrica-staging-db` | same config |
| Example businesses | shown | hidden (`SITE_ENV=production`) |
| Search engines | blocked, "Staging site" banner | allowed |

**Never** paste a password, connection string or token into chat, an issue, a commit or a repo file. They go only into the Cloudflare and Supabase dashboards, or into `.env.staging` / `.dev.vars` on your computer (git ignores both).

---

## Part A: Access and plan (Kenneth)

1. **Cloudflare members:** Manage Account › **Members** › **Invite members**. Enter Reginald's email, scope **the entire account**, and choose a role that can manage Workers and Hyperdrive (Workers Platform Admin, or Administrator). Select **Invite members**; Reginald accepts from the email.
2. **Cloudflare plan:** switch to **Workers Paid** (about $5/month). The app's size (about 2.4 MiB compressed) fits the free plan's 3 MiB, but the free plan allows only 10 ms of CPU per request, which server-rendered pages often exceed, and caps Hyperdrive at 100,000 queries a day.
3. **Supabase members:** Organization › **Team** › **Invite**, role **Developer**.

## Part B: Supabase (Reginald, in Kenneth's organisation)

1. Open the staging project. Note the **database password** set when it was created (reset it under Project Settings › Database if unknown).
2. Select **Connect** (top bar) and copy two strings, replacing `[YOUR-PASSWORD]`:
   - **Session pooler** (port **5432**): for Hyperdrive and for migrations. It works over IPv4 and IPv6. Don't use "Direct connection", which is IPv6-only and may be unreachable from build machines.
   - **Transaction pooler** (port **6543**): a fallback only, if you skip Hyperdrive.
3. Keep them in a password manager. Do not commit them.

## Part C: Hyperdrive (Reginald, in Kenneth's Cloudflare account)

Check the **account switcher** (top left) shows Kenneth's account before every step from here on.

1. Storage & Databases › **Hyperdrive** › **Create configuration**.
2. Name `theplugafrica-staging-db`; paste the **Session pooler** string; **Create**.
3. Copy the configuration **ID** (it isn't secret; it's also the last part of the page address) and send it to Claude, who adds it to `wrangler.jsonc` under `env.staging.hyperdrive` and merges that into `develop`. Repeat for production later with `theplugafrica-db`.

## Part D: Create the Workers from GitHub (Reginald, in Kenneth's Cloudflare account)

1. Workers & Pages › **Create** › **Import a repository** › GitHub.
2. GitHub asks to install **Cloudflare Workers & Pages**: install it on the `Onfroy666999` account, choose **Only select repositories** and pick `theplugafrica`. (A GitHub account can be linked to only one Cloudflare account; if it's already linked to Reginald's own account, the existing install must be shared or moved, see "Troubleshooting".)
3. Configure the staging Worker:

| Field | Value |
|---|---|
| Project / Worker name | `theplugafrica-staging` |
| Branch (production branch) | `develop` |
| Build command | `npx prisma migrate deploy && npx opennextjs-cloudflare build` |
| Deploy command | `npx opennextjs-cloudflare deploy --env staging` |
| Non-production branch builds | off |
| Root directory | leave empty |

4. **Build variables and secrets** (Settings › Build), available only while building:

| Name | Type | Value |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | variable | the Worker's address, e.g. `https://theplugafrica-staging.<your-subdomain>.workers.dev` |
| `DATABASE_URL` | secret | the **Session pooler** string (migrations) |
| `DIRECT_URL` | secret | the same Session pooler string |

The Node version comes from `.nvmrc` (22); dependencies are installed automatically.

5. **Runtime secret** (Settings › Variables & Secrets), used by the live site:

| Name | Type | Value |
|---|---|---|
| `AUTH_SECRET` | secret | a new random value, different for staging and production. Generate with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `DATABASE_URL` | secret | only if you are **not** using Hyperdrive: the Transaction pooler string |

`SITE_ENV` comes from `wrangler.jsonc`; don't set it.

6. Select **Save and Deploy**, or push to `develop`. Watch the build log under the Worker's **Deployments**.

**Decided 2026-11-06:** staging and production share one Supabase project and one Hyperdrive config for now, to keep things simple while there are no real users. The live site hides the example businesses. Give staging its own database (Supabase Pro branching, or a second project) once real businesses and users arrive.

### Production Worker

After a release PR merges `develop` into `main`, create a second Worker the same way as staging, with these differences:

| Field | Value |
|---|---|
| Worker name | `theplugafrica` |
| Branch | `main` |
| Build command | `npx prisma migrate deploy && npx opennextjs-cloudflare build` (same) |
| Deploy command | `npx opennextjs-cloudflare deploy` (no `--env`) |
| Build variable `NEXT_PUBLIC_SITE_URL` | `https://theplugafrica.kennethbilson1989.workers.dev` until the domain is connected (#5) |
| Build secrets `DATABASE_URL`, `DIRECT_URL` | the same Session pooler string as staging |
| Runtime secret `AUTH_SECRET` | a **new** value, different from staging's |

Then enable **workers.dev** under Settings › Domains & Routes. No seeding is needed: the database is shared. The hosted admin account is the same on both sites.

## Part E: First data load (once per Supabase project)

The build applies migrations but doesn't seed. To load the starting services, the example businesses and the hosted admin account:

1. In the project folder, create `.env.staging` (git ignores it):
   ```
   DATABASE_URL="<Session pooler string>"
   DIRECT_URL="<Session pooler string>"
   ADMIN_EMAIL="<admin email>"
   ADMIN_NAME="<admin name>"
   ADMIN_PASSWORD="<a new password for the hosted admin>"
   ```
2. Ask Claude to run the seed against it (Claude reads the file without showing the values), or run it yourself: `npx dotenv-cli -e .env.staging -- npx prisma db seed`.

## Part F: Check it

- The staging address shows the gold "Staging site" banner and Explore lists businesses.
- `/robots.txt` shows `Disallow: /`.
- `/admin/login` signs in with the hosted admin details.
- Photo uploads in the admin show "not available on the hosted site yet" until Supabase Storage (issue #3); choose library photos meanwhile.

## Troubleshooting

- **"The name in your Wrangler configuration file must match the name of your Worker":** the dashboard name must be `theplugafrica` (production) or `theplugafrica-staging` (staging, deployed with `--env staging`). Workers Builds may open a pull request to fix the name; don't merge it if the names above are right.
- **GitHub already linked to another Cloudflare account:** each GitHub account can point to one Cloudflare account. On GitHub › Settings › Applications › Cloudflare Workers & Pages, check which repositories it can see; ask Claude before changing an install other projects rely on.
- **Database errors in the logs:** check the Hyperdrive config uses the Session pooler string with the right password, and that the staging Worker's `wrangler.jsonc` entry has the right Hyperdrive ID.

## Local testing of the Cloudflare build

`npm run preview` builds the Worker and runs it in Wrangler on http://localhost:8787, reading secrets from `.dev.vars` (git ignores it). Staging has a Hyperdrive binding, so for local runs point it at the local database first: set the shell variable `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` to the local `DATABASE_URL` (Wrangler uses it instead of the real Hyperdrive). Docker Desktop must be running for the local database. This computer's Wrangler is signed in to Reginald's own Cloudflare account, so never run `wrangler deploy` from here.

## Spam protection (issue #7)

Every public form has a hidden honeypot, a "too fast" check (bots submit instantly) and a limit of 6 saved submissions per visitor per form per hour; admin sign-in allows 5 failed tries per 15 minutes. These counters live in the database (`RateLimit`), keyed by a salted one-way hash of the visitor's IP, so they work across all Cloudflare isolates.

**Cloudflare Turnstile (optional, recommended before launch):** in Kenneth's Cloudflare › Turnstile › Add widget, add the site's hostnames, then set on **both Workers**:

| Name | Where | Type |
|---|---|---|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Settings › Build › Variables (it's needed at build time) | variable |
| `TURNSTILE_SECRET_KEY` | Settings › Variables & Secrets | secret |

Redeploy; the check then appears above each form's send button. Without these, the forms work as before.

## Email notifications (issue #6)

The site emails the team about every new concierge request, business request, waitlist sign-up and contact message, confirms to visitors who gave an email, and forwards business requests to the business when it has an email address. It's off until a Resend key is set; forms work the same either way, and a failed email never breaks a form.

Set on **both Workers** (Settings › Variables & Secrets):

| Name | Type | Value |
|---|---|---|
| `RESEND_API_KEY` | secret | from Resend › API Keys (in Kenneth's Resend account) |
| `NOTIFY_EMAIL` | text | team address(es) for alerts, comma-separated |
| `EMAIL_FROM` | text | `The Plug Africa <hello@theplugafrica.com>` once the domain is verified in Resend |

**Before the domain is verified,** leave `EMAIL_FROM` unset (it defaults to Resend's test sender `onboarding@resend.dev`) and set `NOTIFY_EMAIL` to the Resend account's own address: Resend only delivers test-sender mail to that address, so customer confirmations and business emails start working once the domain is verified.
