# NKDON Global Logistics

Shipment management, public tracking, and the operations desk for NKDON.

The Next.js application in this repository is the production app. The original static pages (`index.html`, `tracking.html`, `text.txt`) are kept and are not the live product.

## Stack

- Next.js App Router and TypeScript
- Tailwind CSS
- Zod validation
- Supabase PostgreSQL
- Supabase Auth for administrator sign-in when the URL and keys are set
- Private Supabase Storage bucket `shipment-evidence`
- Vercel, using the existing project and the existing Supabase integration

If `DATABASE_URL` (and the Postgres aliases) are absent and `NODE_ENV` is not production, the server can use a local preview database. That path is disabled in production. It is not the production backend.

## Environment names

Set these on the existing Vercel project. Do not commit values. The server reads either the original name or the current Vercel Supabase integration name.

| Purpose | Preferred name | Also accepted |
| --- | --- | --- |
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` | `SUPABASE_URL` |
| Publishable key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_ANON_KEY` |
| Secret key | `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_SECRET_KEY` |
| Postgres | `DATABASE_URL` | `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`, `POSTGRES_PRISMA_URL` |
| First administrator | `SETUP_TOKEN` | — |
| Public site URL | `NEXT_PUBLIC_SITE_URL` | `VERCEL_PROJECT_PRODUCTION_URL`, then `VERCEL_URL` |

`SETUP_TOKEN` and `NEXT_PUBLIC_SITE_URL` are not created by the Supabase integration. They must be set on Vercel by hand. Secret keys stay on the server. The browser never receives them.

The `pgbouncer` query parameter is stripped from the Postgres URL because the Node driver does not use it. Prefer the direct or session connection string if the transaction pooler rejects the session.

## Database and storage

Do not replace the schema. The files already in the repo are the schema:

- `supabase/migrations/0001_init.sql`
- `supabase/migrations/0002_rls.sql`
- `supabase/storage-policies.sql`

On startup the server applies any migration in `supabase/migrations` that is not already recorded in `schema_migrations`, then creates the private `shipment-evidence` bucket when the Supabase URL and secret key are present.

Do not paste `0001` and `0002` into the SQL editor if the app is going to apply them. A second run fails because the tables already exist while `schema_migrations` is still empty. Run `storage-policies.sql` only if the bucket was not created.

Row Level Security is enabled and `anon` / `authenticated` have no grants. The Next.js server uses the database owner connection, which bypasses RLS. There is no browser policy that can read operational tables with the publishable key.

Accepted evidence is JPG, JPEG, PNG, WEBP, and PDF. Images are limited to 10 MB and PDFs to 20 MB. The bucket is private. A file is served on the public tracking page only when staff mark it public.

## Authentication

`/admin/setup` creates the first super admin only while `admin_users` is empty, and only with `SETUP_TOKEN`. There is no default password. After that account exists, setup closes. Enter the name, email, and password on that page. Do not send the password in chat.

When the Supabase URL and secret key are set, setup also creates a confirmed user in Supabase Auth. Sign-in then checks the password with Supabase and stores an httpOnly `nkdon_session` cookie. The cookie can last up to 14 days, but the server ends it after 12 hours without use. Logout, a bad token, an inactive account, and expiry all fail closed. Changing your own password revokes older sessions and issues a new one.

Later accounts are created from Team by a super admin. Roles are `super_admin`, `admin`, `operations`, `support`, and `viewer`. Mutations from the browser also require a same-origin CSRF token. Staff sign-in does not use a browser OAuth redirect. In Supabase Auth, keep Email enabled. Site URL should be the production domain (`NEXT_PUBLIC_SITE_URL`). Extra redirect URLs are not required for this desk. The publishable key is used only for the password check. The secret key stays on the server.

Every `/admin` page except sign-in and setup is checked on the server. Admin APIs check the session again and the role in `admin_users`. The anon and authenticated Supabase roles cannot read those tables.

## What staff can do

- Book shipments and issue `NKD-YYYYMMDD-XXXX` tracking numbers
- Append tracking events. Events are not edited or deleted
- Upload evidence, mark it public, or delete it according to role
- Record facilities, review contact messages, and read the activity log
- Manage the team, company profile, and DEMO/TEST purge (super admin)

Public tracking shows status, route cities, events, and public files. It does not show sender or recipient names or internal notes.

Demonstration rows must be marked DEMO/TEST. Production does not seed them. `ALLOW_DEMO_SEED` is ignored when `NODE_ENV=production`.

## Scripts

```bash
npm install
npm run dev
npm run typecheck
npm run build
```
