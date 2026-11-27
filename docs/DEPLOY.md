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
2. **Cloudflare plan:** **Workers Paid** (about $5/month; done 2026-11-09). The app's size (about 2.4 MiB compressed) fits the free plan's 3 MiB, but the free plan allows only 10 ms of CPU per request, which server-rendered pages often exceed, and caps Hyperdrive at 100,000 queries a day.
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
   Then open the configuration › **Settings** › **Caching** and turn it **off**. With caching on, Hyperdrive answers reads from a copy up to about a minute old, so the admin shows old values right after a change: a toggle flips back, a cancelled membership still says Active (issue #122). The site's reads are small and fast without it.
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

5. **Runtime secret** (Settings › **Runtime variables and secrets** (top of the page; not *Variables and secrets* under Builds, which only exist during the build)), used by the live site:

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
| Build variable `NEXT_PUBLIC_SITE_URL` | `https://theplugafrica.org` once the domain is connected (Part G); until then `https://theplugafrica.kennethbilson1989.workers.dev` |
| Build secrets `DATABASE_URL`, `DIRECT_URL` | the same Session pooler string as staging |
| Runtime secret `AUTH_SECRET` | a **new** value, different from staging's |

The Worker is served on its custom domain only: `workers_dev` and `preview_urls` are off in `wrangler.jsonc` (Part G). No seeding is needed: the database is shared. The hosted admin account is the same on both sites.

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

## Part G: Connect the domain, theplugafrica.org (issue #5)

The domain is registered at **Namecheap**. Its DNS will run on **Cloudflare**, in Kenneth's account, so the Workers can serve it with automatic HTTPS.

| Address | Serves |
|---|---|
| `theplugafrica.org` | production (the `theplugafrica` Worker) |
| `www.theplugafrica.org` | redirects to `theplugafrica.org` |
| `staging.theplugafrica.org` | staging (the `theplugafrica-staging` Worker) |

**1. Add the domain to Cloudflare** (Kenneth's account):
1. Select **Add a domain**, enter `theplugafrica.org`, and choose to scan DNS records automatically.
2. Pick the **Free** plan for the domain. This is separate from Workers Paid, and nothing more is needed.
3. Review the imported records and **delete Namecheap's parking records**: an `A` record on `theplugafrica.org` and a `CNAME` `www` → `parkingpage.namecheap.com`. They would block the Worker addresses in step 3. Keep any `MX` or `TXT` records you recognise (for example, existing email).
4. Cloudflare then shows **two nameservers** (like `xxx.ns.cloudflare.com`). Keep the page open.

**2. Point Namecheap at Cloudflare:**
1. Go to Namecheap › **Domain List** › `theplugafrica.org` › **Manage**.
2. If **DNSSEC** is on (Advanced DNS tab), turn it off first.
3. Under **Nameservers**, choose **Custom DNS**, enter the two Cloudflare nameservers, and save with the green tick.
4. Back in Cloudflare, select **Check nameservers**. The domain usually shows **Active** within an hour; it can take up to 24 hours. Cloudflare emails Kenneth when it's active.

**3. Attach the Workers** (once the domain is Active), under Workers & Pages › the Worker › Settings › **Domains & Routes** › **Add** › **Custom domain**:
- On `theplugafrica`, add `theplugafrica.org`, then `www.theplugafrica.org`.
- On `theplugafrica-staging`, add `staging.theplugafrica.org`.

Cloudflare creates the DNS records and the HTTPS certificates itself. The certificates take a few minutes.

**4. Redirect www.** Go to the domain › Rules › **Redirect Rules** › **Create rule** › template **"Redirect from WWW to root"**, then Deploy.

**5. Update the site address and rebuild.** The address is built into the pages, so change these build variables (Settings › Build), then go to Deployments › latest › **Retry build** on each Worker:

| Worker | `NEXT_PUBLIC_SITE_URL` |
|---|---|
| `theplugafrica` | `https://theplugafrica.org` |
| `theplugafrica-staging` | `https://staging.theplugafrica.org` |

This address goes into share previews, the sitemap, invite links and the admin links in emails.

**6. Recommended:**
- **Always use HTTPS:** SSL/TLS › Edge Certificates › **Always Use HTTPS** on.
- **Keep staging private:** go to Zero Trust › Access › Applications › **Add** › Self-hosted, for `staging.theplugafrica.org`, with a policy allowing the team's email addresses. `wrangler.jsonc` already sets `"workers_dev": false` and `"preview_urls": false` for both Workers, so the old addresses can't get round it (the dashboard toggles are reset by every deploy). **Decided 2026-11-09:** the live site is also behind Access (application `The Plug – pre-launch`) until the owner launches; on launch day delete that application.
- **Turnstile:** if a widget exists, add the three hostnames to it.
- **DNSSEC:** turn it on in Cloudflare (DNS › Settings) and add the DS record it shows at Namecheap (Advanced DNS › DNSSEC).

**7. Email on the domain** (decided 2026-11-09; all free; Zoho's free plan wasn't offered):
- **Website's own emails, Resend:** Resend › Domains › **Add domain** › `theplugafrica.org`, then add the records it lists (on `send` and `resend._domainkey`) in Cloudflare › DNS as **DNS only**. Make two API keys, `Website` (for `RESEND_API_KEY`) and `Gmail` (below). Set `EMAIL_FROM` and `NOTIFY_EMAIL` (see "Email notifications" below).
- **Receiving, Cloudflare Email Routing:** Compute › Email Service › Email Routing › onboard the domain, verify Kenneth's Gmail as a destination, and route `hello@` to it.
- **Replying as hello@, Gmail "Send mail as":** Gmail › Settings › Accounts and Import › Send mail as › add `hello@theplugafrica.org` via SMTP `smtp.resend.com`, port 587 (TLS), username `resend`, password = the `Gmail` key. Set "Reply from the same address the message was sent to".
- **DMARC:** a `TXT` on `_dmarc`: `v=DMARC1; p=none; rua=mailto:hello@theplugafrica.org`.
- Replies reach the right place: visitor confirmations come from `hello@`, which forwards to Gmail; every request, waitlist and message alert sets the visitor as reply-to.

**Check it:**
- `https://theplugafrica.org` loads, with a padlock and no "Staging site" banner.
- `www.theplugafrica.org` lands on `theplugafrica.org`.
- `https://theplugafrica.org/robots.txt` lists `Sitemap: https://theplugafrica.org/sitemap.xml`.
- A share preview (WhatsApp, for example) shows the new address.

## Troubleshooting

- **"A DNS record already exists" when adding a custom domain:** delete that record in Cloudflare › DNS (usually a Namecheap parking record), then add the domain again.

- **"The name in your Wrangler configuration file must match the name of your Worker":** the dashboard name must be `theplugafrica` (production) or `theplugafrica-staging` (staging, deployed with `--env staging`). Workers Builds may open a pull request to fix the name; don't merge it if the names above are right.
- **GitHub already linked to another Cloudflare account:** each GitHub account can point to one Cloudflare account. On GitHub › Settings › Applications › Cloudflare Workers & Pages, check which repositories it can see; ask Claude before changing an install other projects rely on.
- **Database errors in the logs:** check the Hyperdrive config uses the Session pooler string with the right password, and that the staging Worker's `wrangler.jsonc` entry has the right Hyperdrive ID.

## Local testing of the Cloudflare build

`npm run preview` builds the Worker and runs it in Wrangler on http://localhost:8787, reading secrets from `.dev.vars` (git ignores it). Staging has a Hyperdrive binding, so for local runs point it at the local database first: set the shell variable `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE` to the local `DATABASE_URL` (Wrangler uses it instead of the real Hyperdrive). Docker Desktop must be running for the local database. This computer's Wrangler is signed in to Reginald's own Cloudflare account, so never run `wrangler deploy` from here.

## Error alerts (issue #8)

When the site hits a server error (a page, a form or a button fails), the team gets an email with the page, the first line of the error and an **error ID**. It never includes what visitors typed or the address's query string. The same error on the same page is emailed once an hour, and at most 10 alerts go out an hour.

It uses the email setup below, so it starts working once `RESEND_API_KEY` is set. Alerts go to `ALERT_EMAIL` (comma-separated; add it as a **secret**, see below) if set on the Worker, otherwise to `NOTIFY_EMAIL`.

To see the full error: Cloudflare › Workers & Pages › the Worker › **Logs**, and search for the error ID. These logs also show requests Cloudflare itself stopped (for example error 1102, CPU limit exceeded), which the site can't email about because the Worker was cut off.

## Spam protection (issue #7)

Every public form has a hidden honeypot, a "too fast" check (bots submit instantly) and a limit of 6 saved submissions per visitor per form per hour; admin sign-in allows 5 failed tries per 15 minutes. These counters live in the database (`RateLimit`), keyed by a salted one-way hash of the visitor's IP, so they work across all Cloudflare isolates.

**Cloudflare Turnstile (optional, recommended before launch):** in Kenneth's Cloudflare › Turnstile › Add widget, add the site's hostnames, then set on **both Workers**:

| Name | Where | Type |
|---|---|---|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Settings › Build › Variables (it's needed at build time) | variable |
| `TURNSTILE_SECRET_KEY` | Settings › **Runtime variables and secrets** (top of the page; not *Variables and secrets* under Builds, which only exist during the build) | secret |

Redeploy; the check then appears above each form's send button. Without these, the forms work as before.

## Email notifications (issue #6)

The site emails the team about every new concierge request, business request, waitlist sign-up and contact message, confirms to visitors who gave an email, and forwards business requests to the business when it has an email address. It's off until a Resend key is set; forms work the same either way, and a failed email never breaks a form.

Set on **both Workers** (Settings › **Runtime variables and secrets** (top of the page; not *Variables and secrets* under Builds, which only exist during the build)):

| Name | Type | Value |
|---|---|---|
| `RESEND_API_KEY` | secret | from Resend › API Keys (in Kenneth's Resend account) |
| `NOTIFY_EMAIL` | secret | team address(es) for alerts, comma-separated (Kenneth's Gmail) |
| `EMAIL_FROM` | secret | `The Plug Africa <hello@theplugafrica.org>` once the domain is verified in Resend (Part G, step 7) |

Add all of these as **Secret**, even the ones that aren't secret: each deploy from GitHub replaces the Worker's plain-text variables with those in `wrangler.jsonc` (Wrangler's `keep_vars` is off), so text variables set in the dashboard disappear. Secrets are kept.

**Before the domain is verified,** leave `EMAIL_FROM` unset (it defaults to Resend's test sender `onboarding@resend.dev`) and set `NOTIFY_EMAIL` to the Resend account's own address: Resend only delivers test-sender mail to that address, so customer confirmations and business emails start working once the domain is verified.

## Concierge membership: Paystack (issue #83)

The membership costs **$8 a month**, charged in cedis through **Paystack**. Stripe doesn't accept Ghana-registered businesses. Paystack is only ever used for The Plug's own fees. Until the two secrets below are set, the membership page says "Membership opens soon" and nobody can be charged.

**1. Paystack account (Kenneth).** Sign up at paystack.com as a Ghana business and complete the business verification. Live payments need it; test mode works at once.

**2. The plan.** In Paystack › **Plans** › **Create plan**, set:
- Name: `Concierge membership`
- Interval: **Monthly**
- Currency: GHS
- Amount: the cedi price shown next to $8

Copy the **plan code** (`PLN_…`). The site reads the price from the plan, so changing it in Paystack updates the page within the hour. Create the plan in **test mode** first; live mode has its own plan with its own code.

**3. Webhook.** In Paystack › Settings › **API Keys & Webhooks**, set the webhook URL. Test and live each have their own:

| Mode | Webhook URL |
|---|---|
| Test | `https://staging.theplugafrica.org/api/paystack/webhook` |
| Live | `https://theplugafrica.org/api/paystack/webhook` |

**4. Secrets** on each Worker, under Settings › **Runtime variables and secrets**, both as type **Secret**:

| Name | Staging | Production |
|---|---|---|
| `PAYSTACK_SECRET_KEY` | the **test** secret key (`sk_test_…`) | the test key while checking, the **live** key (`sk_live_…`) at launch |
| `PAYSTACK_PLAN_CODE` | the test plan's code | the matching plan's code (test or live) |

**5. Cloudflare Access must let Paystack through.** While the site is behind Access (Part G), Paystack can't sign in, so its webhook would be blocked. In Zero Trust › Access controls › Applications, add a self-hosted application named `Paystack webhook` with:
- hostnames `theplugafrica.org` and `staging.theplugafrica.org`, path `api/paystack/webhook`
- a policy with action **Bypass**, rule *Include* › **Everyone**

The webhook is still safe without Access: the site checks Paystack's signature on every call and refuses anything unsigned.

**Test it** in test mode, with Paystack's test card (on Paystack's "Test payments" page):
1. Sign in on staging and join at `/membership`.
2. Pay with the test card.
3. You come back to "Welcome, you're a member".
4. Your account shows the membership, and Admin › Members lists you.
5. Cancel from the account; the status changes to cancelled, with benefits until the paid month ends.

Staging and production share one database, so test memberships show in both admins. Delete them from Paystack's test dashboard and ask Claude to clear the rows.

**Concierge fees (#84)** use the same Paystack account and webhook, with no plan: they're one-off payments in cedis. Only `PAYSTACK_SECRET_KEY` is needed for them. Until it's set, pay links show the fee but can't take payment, and the team marks fees paid when they're settled another way.

**How it works:** `src/lib/paystack.ts` (API calls, signature check), `src/lib/fees.ts` and `src/lib/fee-server.ts` (fees), `src/lib/membership.ts` (webhook events, confirming checkout), `src/lib/membership-plan.ts` (price, benefits, who counts as a member). Deleting an account cancels its subscription with Paystack first.
