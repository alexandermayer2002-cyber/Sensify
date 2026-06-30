-- ============================================================
-- Add email to profiles so the admin can disambiguate users with
-- the same/common name (email lives in auth.users, not readable from
-- a normal admin client, so we copy it onto the profile at signup).
-- ============================================================

alter table profiles add column if not exists email text;

-- Backfill existing profiles from auth.users (run once; safe to re-run).
update profiles p
set email = u.email
from auth.users u
where p.id = u.id and (p.email is null or p.email = '');
