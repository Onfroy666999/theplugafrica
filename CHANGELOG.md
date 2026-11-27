# Changelog

Notable changes to The Plug Africa. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [Semantic Versioning](https://semver.org).

## [Unreleased]

### Added
- Emergency: Ghana's national numbers, each checked on the service's own website on 27 Nov 2026: 112 (national emergency and ambulance), Police 191 and toll-free 18555, Fire 192, and the DOVVSU helpline 055 100 0900. NADMO's disaster lines are added but hidden until the team confirms them (#128). Added by the `ghana_emergency_numbers` migration, which skips any number already listed.

## [0.16.1] - 2026-11-20

### Fixed
- Toggles: the white knob is centred in its track instead of sitting against the top edge, on every toggle (fee form, Explore, Services, Emergency) (#118).
- Admin pages refresh their data when you come back to the tab, so a fee paid or a request sent in the meantime shows without reloading (#118).
- Admin › Concierge: "Record a deal" is a button instead of bold text that read like a label (#118).
- Account: after cancelling the concierge membership, the card says "Cancelled. Your benefits last until …" straight away instead of "Active" until the page is reloaded (#116).

## [0.16.0] - 2026-11-19

### Added
- Site photos (#112): **Admin › Directory › Site photos** changes the photos on the site without a developer:
  - the four home hero slides (with their captions);
  - the header photo of each category page;
  - the page headers (About, For businesses, Concierge, Emergency);
  - the concierge band and the "Run a business?" panel on the home page;
  - the four Emergency tiles on the home page.
  Each photo can be uploaded or picked from the library, given a description, and reset to the original. Changes show on the site straight away.

### Changed
- Admin › Services: the photo picker can upload a new photo, not only pick from the library (#112).
- "Delete unused uploaded photos" keeps photos used as site photos (#112).

## [0.15.1] - 2026-11-12

### Changed
- Sign-in code (#108):
  - **The email** shows the code large and on its own, and selects in one tap. It's worded as a "verification code", so Gmail offers its "Copy code" button and phones can suggest it.
  - **Notifications:** the subject still starts with the code, so it shows in the phone notification.
  - **The sign-in page** takes whatever is pasted (even the whole sentence from the email) and keeps just the 6-digit code. A Paste button reads the clipboard, and the page signs in on its own as soon as 6 digits are in.

## [0.15.0] - 2026-11-12

### Changed
- Admin menu (#104): 15 sidebar links become 6 sections, with each section's pages as tabs along the top:
  - Dashboard;
  - Directory: Businesses, Services, Emergency;
  - Inbox: Enquiries, Concierge, Waitlist, Messages, Reviews;
  - Money: Fees, Members;
  - People: Users, Team, Activity;
  - My account.

  Unread counts show on the section and its tabs. Page addresses are unchanged, so bookmarks and email links still work.

## [0.14.0] - 2026-11-11

### Fixed
- The rest of the debug session's follow-ups (#94):
  - **Team:**
    - Owners changing or removing each other at the same moment take turns, so the team always keeps an owner.
    - An invite link is only used up once the account exists. An email that already has an account gets a clear message.
  - **Businesses:**
    - A business and its credentials save together or not at all.
    - A status change waits for a save in progress.
    - A renamed business's old web address permanently redirects to the new one.
  - **Photos:**
    - A partly failed upload removes what it uploaded.
    - Owners can delete uploaded photos that nothing uses (more than a day old) from Admin › Businesses.
    - An oversized photo is named before uploading, and large selections upload in batches.
  - **Admin:**
    - An inbox page past the end goes to the last page.
    - Changing a filter right after searching no longer undoes it.
  - **Public site:**
    - Scroll-in sections are visible without JavaScript and appear after 3 seconds even if it never loads.
    - The Popular rail's arrows know when everything fits.
    - The category tabs are real tabs, with arrow keys and a linked panel.
    - Request forms use the visitor's own date for today.
  - **Reviews:** asking again for the same business's contact details within a day gives the same reference, so review codes can't be collected in bulk.
  - Migration `20261111112104_slug_aliases_and_reveal_reuse`.

## [0.13.2] - 2026-11-11

### Security
- Admin sign-in limit (#94):
  - **Counted first:** every attempt is counted in one database step before the password is checked, so parallel requests can't get extra guesses.
  - **Per connection:** 5 attempts per email from one connection every 15 minutes, as before.
  - **Per email:** a new limit of 20 wrong attempts per email per hour from anywhere, so changing IP address doesn't give unlimited guesses. The team gets an email the first time it trips.
  - **Normal use:** correct sign-ins never count, so normal use is unaffected.
  - **Forms too:** public form limits use the same one-step counter.

## [0.13.1] - 2026-11-11

### Fixed
- Debug session (#94): five review agents went through the code, and every finding was checked before fixing.
  - **Security:**
    - Business and service names in structured data could run as script on public pages (the `<` escaping did nothing).
    - A sign-in return link with a tab or newline could send people to another site.
    - Two admin pages didn't check the session themselves.
    - `/\host` was accepted as a local photo path.
  - **Money:**
    - An editor could cancel a fee by sending an unknown action.
    - Admin fee changes no longer overwrite a payment that lands at the same moment.
    - Reopening an old checkout link can't switch a cancelled membership back on.
    - An active membership lapses if renewals stop arriving.
    - A failed renewal with no recorded end date keeps the 3 days' grace.
    - Deleting an account is refused until Paystack has confirmed the subscription.
    - The team is alerted to a double subscription.
    - A payment for a fee that's no longer due is flagged "refund needed" and emailed to the team.
  - **Data:**
    - A business can't be Verified with no credentials.
    - Email fields on the concierge, business request and waitlist forms must be real addresses (junk bounced the team's alert).
    - Request actions respect the live site's hidden examples.
    - "Ask a concierge" from a real listing now links the request to that business.
  - **Forms:**
    - The time check uses the browser's own clock, so a phone with a fast clock is no longer refused.
    - It no longer causes a hydration mismatch.
    - Turnstile resets after each submit.
    - "Send a new code" works with Turnstile on.
  - **Admin:** inbox and status changes on a deleted entry or a bad value now say so, instead of "couldn't reach the server". Fractional page numbers no longer cause an error.
  - **Hearts:** the hearts reset when someone else signs in, and a failed load is retried.
  - **Buttons:** buttons that open Paystack work again after pressing Back. Cancelling a membership refreshes the page. Copying a link says when the browser refuses.
  - **Follow-ups:** the remaining findings are listed in #94.

## [0.13.0] - 2026-11-10

### Added
- Concierge fees (#84):
  - **The rate:** when the concierge closes a deal, The Plug's fee is 10% of the agreed price from the customer and 10% from the business. The member rate is a setting, also 10% for now.
  - **Recording a deal:** "Record deal" on a concierge request takes the business, what the deal is for and the agreed price (GHS), and shows both fees as you type. It can email each side its pay link.
  - **Paying:** each link opens `/pay/<link>`, which needs no account and shows what the fee is for. Paying goes through Paystack, by card or mobile money, in cedis. The payment is checked with Paystack on return and by the signed webhook: the right fee, the full amount, counted once. The team is emailed when a fee is paid.
  - **Admin › Fees** shows what's due, overdue (after 14 days) and paid. Editors copy or resend links and mark fees paid outside Paystack (for example mobile money). Owners waive or cancel fees and download a spreadsheet.
  - **Keeping the record:** a concierge request with a recorded deal can't be deleted.
  - **Customers see their fees:** visitors with an account see their own fees, with a Pay button.
  - **Wording:** the concierge page and the request confirmation now state the 10% fee.
  - Migration `20261110100409_concierge_fees`.

## [0.12.0] - 2026-11-09

### Added
- Concierge membership (#83):
  - **Price:** `/membership` offers it at $8 a month, charged in cedis through Paystack (the cedi price comes from the Paystack plan). It's optional and can be cancelled any time.
  - **Benefits** (proposed; one list, easy to edit): priority with the concierge, a check before you pay, two quick tasks a month, a direct line and members' offers.
  - **Joining:** Join opens Paystack's checkout, and the payment is checked with Paystack on the way back. A signed webhook keeps the status in step: renewals, failed payments (3 days' grace), and cancellations.
  - **The account page** shows the membership, with "Change card" (Paystack's page) and "Cancel". Cancelling keeps the benefits until the paid month ends.
  - **Deleting an account** cancels its subscription first.
  - **Members get priority:** their concierge requests are marked "Member" in the admin, listed first under New, and flagged in the team email.
  - **Admin › Members** lists members and their renewal dates.
  - **Links:** the concierge page and the footer link to the membership.
  - **Until Paystack is connected**, the page says "Membership opens soon" and nobody can be charged. Setup is in `docs/DEPLOY.md`.
  - Migration `20261109200552_concierge_membership`.

### Changed
- The footer and the contact sheet now say The Plug never handles payments *between you and a business*, rather than that it takes no payments at all: members pay The Plug's own fee.

## [0.11.0] - 2026-11-09

### Added
- Visitor accounts (#82):
  - **Sign in** in the header opens `/account/sign-in`. Visitors sign in with a 6-digit code sent to their email; there's no password, and the account is created on first sign-in.
  - **Code safety:** codes are stored only as hashes and work once, for 10 minutes, with 5 tries. Only the newest code works. At most 5 codes an hour go to one address, and 10 an hour to one visitor.
  - **`/account`** shows the visitor's requests with reference and progress (including earlier ones sent with the same email), their saved businesses and their details. They can sign out or delete the account; requests they already sent stay with the team.
  - **The heart** on listing cards now saves the business (it used to do nothing), and asks the visitor to sign in first.
  - **Linked requests:** concierge requests and requests to businesses sent while signed in are linked to the account.
  - **Admin › Users** lists accounts, read-only.
  - **Separate sessions:** visitor sessions use their own cookie and signing key, so they can never open the admin.
  - Migration `20261109183309_user_accounts`.

### Changed
- Domain (#5): the site now runs on **theplugafrica.org**, with HTTPS and DNSSEC.
  - `www` redirects to it, and staging is on `staging.theplugafrica.org`.
  - The workers.dev and preview addresses are switched off in `wrangler.jsonc`.
  - Email: Resend sends the site's emails from `hello@theplugafrica.org`, and mail to that address is forwarded to the team.
  - The setup is recorded in `docs/DEPLOY.md` Part G.
  - Workers Paid is now active.

## [0.10.0] - 2026-11-09

### Changed
- Faster on phones (#76). On a phone-speed CPU, the browser work on the home page fell from about 27 s to 9 s, and on Explore from 13 s to 6 s.
  - The home page is now built on the server. Only the slideshow, search, category tabs, popular rail, menu and floating button run in the browser. It used to be one big browser component that redrew the whole page every time the slideshow changed.
  - The slideshow pauses when it is off screen or the tab is hidden.
  - The header and slideshow captions no longer use a background blur, which was costly to redraw.
  - Explore's results grid fades in with CSS instead of a layout animation that measured every card.
  - Listing cards are sent only the fields they show and one photo, not every photo and detail.
- No visible change to the design.

### Fixed
- Explore and the admin inbox pages no longer show a hydration error on some loads (React #418). Unneeded loading placeholders were removed; they could arrive after the page and confuse React.
- The "Popular in Accra" row on phones lines up with the page margin instead of the screen edge.

## [0.9.0] - 2026-11-08

### Added
- Error alerts (#8): server errors email the team (`ALERT_EMAIL`, or `NOTIFY_EMAIL`) with the page, the first line of the error and an error ID to find it in Cloudflare's logs; never what visitors typed or query strings. The same error is emailed once an hour, at most 10 alerts an hour. Works on Cloudflare Workers (the alert is kept alive after the response with `waitUntil`, without which Cloudflare cancels it). Off until email is set up.

### Fixed
- Accessibility (#30): secondary text, small gold labels, and ember and amber text now meet WCAG AA contrast (faded navy raised to 65%; a deeper `gold-ink` for small gold text, with the brand gold kept for icons and the logo; ember and amber slightly deeper). "How it works" lists are valid lists for screen readers. With reduced motion, content shows straight away instead of staying invisible until scrolled into view. The first listing photos on Explore load straight away. Unused code removed.

## [0.8.0] - 2026-11-08

### Added
- Reviews (#14): "Write a review" on business pages now works (it did nothing before). A review needs the reference code from contacting that business through The Plug (or a concierge request about it), one review per code, and stays hidden until approved in Admin › Reviews, which shows how many are waiting. Ratings and counts are calculated from approved reviews only, and appear in search results data. The team can post a public reply; editors approve, reject and reply, owners delete; businesses can't change reviews. New reviews email the team. Example listings keep their example reviews. Migration `20261108191536_reviews`.
- Emergency numbers (#11): Admin › Emergency lists numbers for the whole of Ghana or a city, by service. A number appears on the public Emergency page only once someone marks it verified, which needs a note of where it was confirmed; the page shows that source and the date, with a Call button. Changing a number resets its verified date, and numbers verified more than 6 months ago are flagged to check again. National numbers show in every city. Editors add and check numbers; owners delete them. Migration `20261108185753_emergency_contacts`.
- Admin essentials (#67):
  - My account: everyone can change their own name and password (the current password is checked, and other sessions are signed out).
  - Inboxes can be filtered by status and month, searched by name, phone, email or reference, and are paged 50 at a time instead of showing the latest 200.
  - Owners can delete inbox entries (spam, tests) after confirming.
  - Concierge requests can be assigned to a team member, with an "Assigned to me" filter.
  - Waitlist entries have "Create business from this", which pre-fills the business form and marks the entry Listed once the business is created.
  - Owners can download any inbox as a spreadsheet with the current filters, for reconciling introductions and commission.
  - All of this is recorded in the activity log. Migration `20261107215723_concierge_assignment` adds the assignment.

### Fixed
- Enquiries: phone links work when the number has spaces (#67).
- When a request fails (for example when Cloudflare's free plan cuts it off with error 1102), the sign-in and invitation forms, inbox status and notes, business saves, services and team actions now say "We couldn't reach the server" instead of showing the "This page didn't load" page (#65). Failed sign-ins with an unknown email no longer hash a dummy password at runtime.
- Explore filters (category, city, Clear filters) update instantly in the browser instead of asking the server to render the page again, which took about a second on staging and cost Worker CPU (#63). The URL still changes, so filtered views can be shared.
- An end-to-end test could fail at random depending on which business the database returned first; it now picks one in a fixed order.

## [0.7.0] - 2026-11-07

### Added
- Team accounts (#18): owners invite people at Admin › Team as Owner, Editor or Viewer, change roles, send password links and remove accounts. Invitation and password links work once and expire after 7 days; they're emailed when email is on and can always be copied. Editors can't delete or manage the team; viewers can look but not change anything. The server checks the role on every action. Removing someone or changing their password signs them out at once.
- Activity log (#18): Admin › Activity shows who changed what, filterable by person: sign-ins, business edits (with the fields that changed), status changes, deletions, photo uploads, inbox updates, services and team changes.
- Automated tests (#9), run on every pull request: 42 unit tests of the rules (form validation, Verified needs every credential checked, search, roles, emails) with `npm test`, and 42 end-to-end tests that drive the production build against a real database with `npm run test:e2e`: pages, search, the contact sheet reference code, every form and its emails, spam protection, admin sign-in, adding and publishing a business, and team roles. Guide in `docs/TESTING.md`.
- Migration `20261106161552_team_accounts` adds roles to accounts (the existing account becomes an owner) and the `Invite` and `AuditLog` tables.

### Changed
- Form validation and search moved into shared modules (`src/lib/validation.ts`, `src/lib/search.ts`) so the app and the tests use one copy; the Verified rule is `canBeVerified` in `src/lib/status.ts`.

### Fixed
- `npm run lint` no longer scans the Cloudflare build output (`.open-next`, `.wrangler`), which made it run out of memory locally.

## [0.6.0] - 2026-11-06

### Added
- Nightly encrypted database backups (#8): a GitHub Actions workflow dumps the app tables from Supabase at 02:30 UTC, encrypts them with a passphrase and keeps them for 30 days. Off until `BACKUPS_ENABLED` and two secrets are set. Restore steps, tested, in `docs/BACKUPS.md`.
- Spam protection on every public form (#7): a hidden honeypot, a "too fast" check, and a limit of 6 submissions per visitor per form per hour. Visitors are identified by a salted one-way hash of their IP; the IP is never stored. Cloudflare Turnstile switches on when its two keys are set (`docs/DEPLOY.md`). Migration `20261106150859_rate_limits` adds the `RateLimit` table.
- Email notifications (#6): the team is emailed about every new concierge request, business request, waitlist sign-up and contact message; visitors who gave an email get a confirmation with their reference; business requests are forwarded to the business when it has an email address. Off until `RESEND_API_KEY` and `NOTIFY_EMAIL` are set; a failed email never breaks a form.

### Fixed
- The admin sign-in limit (5 failed tries per 15 minutes) now holds across all Cloudflare instances; it was kept in memory before, which Workers don't share.

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
