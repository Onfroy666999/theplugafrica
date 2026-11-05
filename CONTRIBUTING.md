# Working on The Plug Africa

How we collaborate on this codebase. It applies to everyone who changes the code, human or AI.

**Roles.** The owner (Kenneth Ato Bilson-Ogoe, GitHub `@Onfroy666999`) decides on product, design and priorities, and is the only person who merges into `develop` and `main`. Contributors (developers, Claude) do the work on branches and open pull requests for review.

---

## 1. Every change starts with an issue

All work is tracked in [GitHub Issues](../../issues) and on the project board.

- Check that an issue exists before you start. If it doesn't, open one with the **Feature** or **Bug** template.
- An issue states the problem, what "done" looks like (acceptance criteria), and anything still undecided.
- Labels: one `type:*`, one or more `area:*`, one `priority:*`. Milestones group issues by phase.
- Decisions belong to the owner. If an issue needs a product, brand or pricing decision, label it `needs-decision` and ask; don't guess.

## 2. Branches

| Branch | Purpose | Who writes to it |
|---|---|---|
| `main` | What is (or will be) live. Always releasable. | Owner only, by merging a release PR |
| `develop` | Integration of finished, reviewed work | Owner only, by merging feature PRs |
| `feature/<issue#>-<short-name>` | New work, e.g. `feature/12-postgres-migration` | The contributor doing the issue |
| `fix/<issue#>-<short-name>` | Bug fixes | The contributor doing the issue |

- Branch from an up-to-date `develop`.
- Never commit directly to `develop` or `main`, and never force-push them.
- One issue per branch. Keep branches short-lived and pull in `develop` if it moves.

## 3. Commits

- Write in the imperative, with a short subject line: "Add concierge email notification", not "added stuff".
- Use the body to explain *why* when it isn't obvious.
- Commit messages carry no co-author or tool-attribution trailers.
- Never commit secrets. `.env`, `prisma/*.db` and `public/uploads/` are gitignored, and `.env.example` documents the variables.

## 4. Pull requests

1. Push your branch and open a PR **into `develop`** using the template.
2. Link the issue with `Closes #N` so it closes when the PR merges.
3. Fill in what changed, how you tested it, screenshots for UI changes, and any risks or follow-ups.
4. **CI must pass** (lint, type-check, schema check, production build).
5. The **owner reviews**. Comments are answered with a fix or a reply, never silently ignored.
6. **The owner merges** with "Create a merge commit" so the feature stays visible in the history. The contributor then deletes the branch.

A PR does one thing. If you notice something unrelated, open an issue for it instead of adding it to the PR.

## 5. Definition of done

A change is done when:

- [ ] It meets the issue's acceptance criteria.
- [ ] CI is green: lint, type-check, Prisma schema valid, production build succeeds.
- [ ] It has been tested in the browser: desktop and phone width for UI work, the real flow for forms and admin.
- [ ] It follows the design system: tokens in `globals.css` / `src/lib/motion.ts`, components from `src/components/ui/`. No hard-coded colours, durations or native `<select>`.
- [ ] It doesn't invent statistics, ratings, testimonials or prices; examples are labelled.
- [ ] Database changes come with a migration, and data that exists today keeps working.
- [ ] Docs are updated where behaviour changed (`CLAUDE.md`, `.env.example`, this file).

## 6. Releases

1. When `develop` holds a set of finished work, the contributor opens a PR **`develop` → `main`** titled `Release vX.Y.Z`, listing the included PRs.
2. The owner reviews and merges it.
3. Tag the merge commit (`vX.Y.Z`) and add a section to [CHANGELOG.md](CHANGELOG.md).
4. Versions follow [Semantic Versioning](https://semver.org): `MINOR` for new features, `PATCH` for fixes. We stay on `0.x` until public launch.

## 7. Security and data

- Treat customer and business details (names, phones, emails) as personal data: don't copy them into issues, PRs, screenshots or logs.
- Report security problems to the owner privately, not in a public issue.
- Admin credentials and secrets live only in `.env` (local) and the hosting provider's environment settings.

## 8. Running the project

Needs Node 22 and Docker Desktop (for the local Postgres database).

```bash
npm install
cp .env.example .env      # then fill in values
npm run db:up             # start local Postgres in Docker (port 5433)
npm run db:deploy         # apply migrations
npm run db:seed           # admin account + example businesses
npm run dev               # develop (Turbopack, hot reload)
npm run serve             # use it: production build, fast
npm run admin:password    # change the admin password
npm run db:migrate -- --name <change>   # after editing prisma/schema.prisma; commit the migration
```
