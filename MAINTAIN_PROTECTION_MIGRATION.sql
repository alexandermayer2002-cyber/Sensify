-- ============================================================
-- MAINTAIN PROTECTION — closes the subscription privilege hole.
--
-- THE HOLE: the Maintain build added maintain_active,
-- maintain_subscription_id, and stripe_customer_id to profiles.
-- "Users can update own profile" has no column restrictions, so a
-- console-savvy user could run
--   supabase.from('profiles').update({ maintain_active: true })
-- and grant themselves Maintain without ever paying. Same species
-- as the is_admin hole.
--
-- THE FIX: extend the protection trigger to cover the privileged
-- Maintain columns. Only the service role (server-side functions:
-- verify-maintain-setup, activate-maintain) may set them.
--
-- maintain_opt_in stays client-writable ON PURPOSE: the
-- cancel-reservation flow legitimately sets it false from the
-- browser, and setting it TRUE without a saved card is self-defeating
-- (activation finds no payment method and refuses).
--
-- Replaces protect_is_admin() in place; the existing trigger
-- (protect_is_admin_trigger) picks up the new body automatically.
-- Column adds below make this safe to run in any order (idempotent,
-- and the trigger would error on missing columns otherwise).
-- ============================================================

alter table profiles add column if not exists maintain_opt_in boolean default false;
alter table profiles add column if not exists stripe_customer_id text;
alter table profiles add column if not exists maintain_active boolean default false;
alter table profiles add column if not exists maintain_subscription_id text;

create or replace function protect_is_admin()
returns trigger
language plpgsql
security definer
as $$
declare
  jwt_role text;
begin
  jwt_role := coalesce(auth.jwt() ->> 'role', '');

  if tg_op = 'INSERT' then
    if coalesce(new.is_admin, false) = true and jwt_role <> 'service_role' then
      new.is_admin := false;  -- silently strip; the row still inserts
    end if;
    if coalesce(new.maintain_active, false) = true and jwt_role <> 'service_role' then
      new.maintain_active := false;
    end if;
    if new.maintain_subscription_id is not null and jwt_role <> 'service_role' then
      new.maintain_subscription_id := null;
    end if;
    if new.stripe_customer_id is not null and jwt_role <> 'service_role' then
      new.stripe_customer_id := null;
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.is_admin is distinct from old.is_admin and jwt_role <> 'service_role' then
      raise exception 'is_admin can only be changed server-side';
    end if;
    if new.maintain_active is distinct from old.maintain_active and jwt_role <> 'service_role' then
      raise exception 'maintain_active can only be changed server-side';
    end if;
    if new.maintain_subscription_id is distinct from old.maintain_subscription_id and jwt_role <> 'service_role' then
      raise exception 'maintain_subscription_id can only be changed server-side';
    end if;
    if new.stripe_customer_id is distinct from old.stripe_customer_id and jwt_role <> 'service_role' then
      raise exception 'stripe_customer_id can only be changed server-side';
    end if;
    return new;
  end if;

  return new;
end;
$$;

-- Trigger already exists from SECURITY_HARDENING; recreate defensively
-- in case that migration hasn't run yet.
drop trigger if exists protect_is_admin_trigger on profiles;
create trigger protect_is_admin_trigger
  before insert or update on profiles
  for each row execute function protect_is_admin();
