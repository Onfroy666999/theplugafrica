# Backups and recovery

Supabase Free has no backups. A GitHub Actions workflow (`.github/workflows/backup.yml`) takes one every night at 02:30 UTC and keeps it for 30 days. On Supabase Pro, Supabase's own daily backups add a second safety net.

**What's in a backup:** every app table (businesses, services, credentials, enquiries, concierge requests, waitlist, messages, admin accounts) and the migration history. **Not included:** photos in Supabase Storage.

Backups contain personal data, so each file is encrypted with a passphrase before it's stored, and the repository is private.

## Turn it on (once)

GitHub › the repo › **Settings › Secrets and variables › Actions**:

1. **Secrets** › New repository secret:
   - `BACKUP_DATABASE_URL`: the Supabase **Session pooler** string (port 5432).
   - `BACKUP_PASSPHRASE`: a long random passphrase. Save it in a password manager too: **without it, no backup can be opened.**
2. **Variables** › New repository variable: `BACKUPS_ENABLED` = `true`.
3. **Actions › Database backup › Run workflow** to take the first backup now. It should finish green in about a minute.

## Get a backup

**Actions › Database backup** › pick a run › **Artifacts** › download. You get a zip containing `theplugafrica-<date>.dump.gpg`.

## Restore

Only restore after deciding what to replace: restoring over the live database overwrites newer data. When in doubt, restore into a new, empty database first and copy back what's needed.

1. Decrypt (asks for the passphrase):
   ```
   gpg --output backup.dump --decrypt theplugafrica-<date>.dump.gpg
   ```
2. Restore into an **empty** Postgres database (a new Supabase project, or a local one):
   ```
   docker run --rm -it -v "$PWD:/in" postgres:17 pg_restore --no-owner --no-privileges --dbname="<connection string>" /in/backup.dump
   ```
   One warning, `schema "public" already exists`, is expected and harmless.
3. Point the site at it if needed (Hyperdrive config, or `DATABASE_URL`), and check the admin.

The restore steps were tested on 2026-11-06 with a dump of the local database restored into a fresh database: every table came back with the same row counts.

## Error alerts

Workers logs are on (`observability` in `wrangler.jsonc`): Cloudflare › Workers & Pages › the Worker › **Observability** shows errors with their time and page. Logs never include form contents, passwords or connection strings. For email alerts on errors, add a notification in Cloudflare › Notifications once the account has the plan that offers it.
