# Testing

Two kinds of automated tests run on every pull request (GitHub Actions, `.github/workflows/ci.yml`). A red check means don't merge.

## Unit tests: `npm test`

Fast checks of the rules, with no database or server. They live in `tests/unit/`:

| File | What it checks |
|---|---|
| `validation.test.ts` | Every public form's rules: required fields, the meeting place for "somewhere else", "Other" areas, dates, a way to reply on the Contact page, reference code format |
| `status.test.ts` | Verified needs every credential Checked; only In review and Verified are public |
| `search.test.ts` | Explore search: word roots ("cleaner" finds cleaning), filters, sorting |
| `requests-roles-site.test.ts` | Request summaries in the admin and emails, team roles, city pages |
| `email.test.ts` | Emails escape what visitors type, skip empty rows, and never break a form when the provider fails |

The rules they test live in plain modules (`src/lib/validation.ts`, `src/lib/status.ts`, `src/lib/search.ts`, `src/lib/roles.ts`) so the app and the tests share one copy.

## End-to-end tests: `npm run test:e2e`

These drive the real production build over HTTP, against a real database, the way a browser does: pages, server actions, sign-in cookies. Emails go to a stand-in provider that the tests read. They live in `tests/e2e/`:

| File | What it checks |
|---|---|
| `public.test.ts` | Key pages load; search; the contact sheet's reference code; concierge, business request, waitlist and contact forms save and send the right emails; spam protection (too fast, honeypot, 6 per hour) |
| `admin.test.ts` | Sign-in (wrong password, throttle after 5 tries); adding a business; Verified blocked until credentials are checked; publishing; deleting; the activity log |
| `team.test.ts` | Invitations, roles (editor can't delete, viewer can't change anything), password links signing out old sessions, removing a member |

**To run them locally:**

1. Docker Desktop running and the local database up: `npm run db:up`, `npm run db:deploy`, `npm run db:seed`.
2. `npm run build`.
3. `npm run test:e2e`.

The tests start the build on port 3100 and the email stand-in on port 4599, so stop anything using those ports first. They sign in as the seeded owner (`ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`).

**Safety:** they create and delete their own rows (names starting "E2E", addresses `@example.test`, and activity entries written during the run). They refuse to run unless `DATABASE_URL` points to `localhost`, so they can't touch the hosted database.

**How the action calls work:** `tests/e2e/helpers.ts` looks up each action's ID in `.next/server/server-reference-manifest.json` and encodes the arguments with React's own encoder from the Next.js package. This relies on Next.js internals; if a Next.js upgrade breaks it, the helper is the one place to fix.

## Adding tests

- A new rule (validation, permissions, pricing): put it in a plain module under `src/lib/` and add a unit test.
- A new form or admin action: add an end-to-end test that calls it, checks what was saved, and cleans up after itself.
