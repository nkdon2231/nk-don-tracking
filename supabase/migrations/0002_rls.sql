-- Ensure API roles exist so revokes are valid on a plain Postgres instance.
-- On Supabase these roles already exist and are left untouched.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end $$;

-- Row Level Security for Supabase.
-- The Next.js server connects with the database owner / service role, which
-- bypasses RLS. The anon and authenticated API roles get no policies, so the
-- browser cannot read operational tables with the anon key.
-- FORCE is intentionally not used: forcing RLS would also block the trusted
-- server connection that owns these tables.

alter table admin_users enable row level security;
alter table admin_sessions enable row level security;
alter table login_attempts enable row level security;
alter table facilities enable row level security;
alter table shipments enable row level security;
alter table shipment_events enable row level security;
alter table shipment_evidence enable row level security;
alter table admin_activity enable row level security;
alter table company_settings enable row level security;
alter table inquiries enable row level security;
alter table rate_limits enable row level security;
alter table tracking_counters enable row level security;

revoke all on table admin_users from anon, authenticated;
revoke all on table admin_sessions from anon, authenticated;
revoke all on table login_attempts from anon, authenticated;
revoke all on table facilities from anon, authenticated;
revoke all on table shipments from anon, authenticated;
revoke all on table shipment_events from anon, authenticated;
revoke all on table shipment_evidence from anon, authenticated;
revoke all on table admin_activity from anon, authenticated;
revoke all on table company_settings from anon, authenticated;
revoke all on table inquiries from anon, authenticated;
revoke all on table rate_limits from anon, authenticated;
revoke all on table tracking_counters from anon, authenticated;
