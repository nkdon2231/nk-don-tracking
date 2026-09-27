-- Staff must replace a temporary password before the desk will open.
-- Existing accounts stay as they are. Nothing is deleted.

alter table admin_users
  add column if not exists must_change_password boolean not null default false;
