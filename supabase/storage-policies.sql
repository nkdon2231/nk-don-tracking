-- Run in the Supabase SQL editor after the bucket exists.
-- The application also creates the private bucket from the server when
-- SUPABASE_SERVICE_ROLE_KEY is configured.
-- Service-role uploads bypass these policies. Browser clients cannot read objects.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'shipment-evidence',
  'shipment-evidence',
  false,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set public = false,
    file_size_limit = 20971520;

-- No select/insert/update/delete policies for anon or authenticated.
-- Absence of a policy denies access under RLS.
alter table storage.objects enable row level security;
