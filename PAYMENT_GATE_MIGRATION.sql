-- ============================================================
-- PAYMENT GATE — server-side enforcement that new accounts paid.
-- (QA 2026-10-21 finding #2: the $399 gate was client-side routing
-- only — Google OAuth or a direct supabase.auth.signUp() call created
-- a fully working free account.)
--
-- WHAT THIS DOES: a BEFORE INSERT trigger on auth.users refuses any
-- new account whose email (a) is not recorded in paid_sessions (written
-- server-side by verify-payment after Stripe confirms), and (b) is not
-- a test account (+fable / +qa / +robot tag). Every signup path funnels
-- through this insert — password signup, OAuth, API calls — so the gate
-- cannot be bypassed from the client.
--
-- WHAT THIS DOES NOT TOUCH: existing accounts (the trigger fires only
-- on INSERT), sign-ins, password resets.
--
-- RUN THIS in the Supabase SQL editor after reading it. To undo:
--   drop trigger if exists require_payment_on_signup on auth.users;
--
-- COMPANION SETTING (not SQL — do it in the dashboard): turn ON
-- Authentication → Providers → Email → "Confirm email".
-- resume-paid-signup.js's own security note depends on it (QA
-- 2026-10-21 #3): with it off, anyone who learns a buyer's email can
-- claim that buyer's paid-but-unfinished program.
-- ============================================================

create or replace function public.enforce_paid_signup()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Test accounts: the same server-side pattern test-approve-lab uses.
  if new.email ~* '\+(fable|qa|robot)' then
    return new;
  end if;

  -- Paid buyers: recorded by verify-payment (service role) at checkout.
  if exists (select 1 from public.paid_sessions where lower(email) = lower(new.email)) then
    return new;
  end if;

  raise exception 'No Sensify purchase found for this email. Complete checkout first, or use "Paid but never finished? Continue here" on the sign-in page.';
end;
$$;

drop trigger if exists require_payment_on_signup on auth.users;
create trigger require_payment_on_signup
  before insert on auth.users
  for each row execute function public.enforce_paid_signup();
