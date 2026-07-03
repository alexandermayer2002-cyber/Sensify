-- ============================================================
-- SECURITY HARDENING — closes the privilege-escalation hole.
--
-- THE HOLE: "Users can update own profile" has no column restrictions,
-- and admin access keys off profiles.is_admin. So any user could run
--   supabase.from('profiles').update({ is_admin: true }).eq('id', <their id>)
-- from the browser console and grant themselves admin.
--
-- THE FIX: a trigger that blocks any change to is_admin unless the
-- request comes from the service role (server-side only). Applies to
-- both UPDATE (flipping it) and INSERT (creating a profile pre-flagged).
--
-- Also commits the is_admin_check() definition to the repo so the
-- database's security rules aren't invisible to the codebase.
-- ============================================================

-- Ensure the column exists (no-op if it does)
alter table profiles add column if not exists is_admin boolean default false;

-- The admin check used by RLS policies across tables.
-- SECURITY DEFINER so it can read profiles regardless of caller's RLS.
create or replace function is_admin_check()
returns boolean
language sql
security definer
stable
as $$
  select coalesce((select is_admin from profiles where id = auth.uid()), false);
$$;

-- Trigger: only the service role may set or change is_admin.
create or replace function protect_is_admin()
returns trigger
language plpgsql
security definer
as $$
declare
  jwt_role text;
begin
  -- service role requests carry role=service_role in the JWT; browser
  -- clients carry 'authenticated' (or 'anon'). Only service role may touch is_admin.
  jwt_role := coalesce(auth.jwt() ->> 'role', '');

  if tg_op = 'INSERT' then
    if coalesce(new.is_admin, false) = true and jwt_role <> 'service_role' then
      new.is_admin := false;  -- silently strip; the row still inserts
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.is_admin is distinct from old.is_admin and jwt_role <> 'service_role' then
      raise exception 'is_admin can only be changed server-side';
    end if;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_is_admin_trigger on profiles;
create trigger protect_is_admin_trigger
  before insert or update on profiles
  for each row execute function protect_is_admin();
