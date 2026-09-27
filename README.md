# NKDON Global Logistics

Production platform for shipment management, public tracking, and operations.

This repository’s default branch still contains the previous static tracking site and is intentionally unchanged. New work lives on `nkdon-global-logistics-rebuild`.

## Stack

- Next.js (App Router) and TypeScript
- Tailwind CSS
- Zod validation
- Supabase PostgreSQL for the production database
- Supabase Auth for production administrator sign-in
- Supabase Storage bucket `shipment-evidence` for proof and documents
- Deploy target: Vercel, with `NEXT_PUBLIC_SITE_URL` set to the public domain

The embedded database used when `DATABASE_URL` is absent is a **local development fallback only**. It is disabled when `NODE_ENV=production`. It is not the production backend.

## Supabase configuration

Create a Supabase project, then set these server environment variables (see `.env.example`). Do not commit real values.

| Name | Where it is used |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. Safe to expose. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe anon key. Table access is denied by RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only. Auth admin API and Storage uploads. |
| `DATABASE_URL` | Supabase Postgres connection string, used by the Next.js server. |
| `SETUP_TOKEN` | One-time secret required to create the first super admin. |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for links and QR codes. |

After the variables are set, apply migrations and storage rules:

```bash
# From the Supabase SQL editor, or: supabase db push
# Files:
#   supabase/migrations/0001_init.sql
#   supabase/migrations/0002_rls.sql
#   supabase/storage-policies.sql
```

The app also creates the private `shipment-evidence` bucket on startup when the service role key is present.

## Authentication

Production administrators are created in Supabase Auth. A matching row in `admin_users` stores the role (`super_admin`, `admin`, `operations`, `support`, `viewer`). The browser never receives the service role key.

Sign-in checks the password with Supabase Auth, then issues an httpOnly session cookie backed by `admin_sessions`. Roles are enforced on every admin API. Login attempts are rate-limited and written to `login_attempts` and `admin_activity`.

The first account is created at `/admin/setup` and only while `admin_users` is empty. It requires `SETUP_TOKEN`. There is no default production password.

If Supabase Auth is not configured, a local password hash can be used for development only. That path is not the production design.

## What is in this branch so far

Foundation, schema, auth, and the server API for shipments, events, evidence, facilities, settings, and users. The public site and operations screens are the next stage. Legacy files `index.html`, `tracking.html`, and `text.txt` are still in the tree so the previous site is not removed.

## Scripts

```bash
npm install
npm run dev
npm run typecheck
npm run build
```
