-- ============================================================
-- SENSIFY DATABASE STATE CHECK — paste the whole thing into the
-- Supabase SQL editor and run. Each row reports one expectation:
-- OK = present, MISSING = that migration (named in the row) never
-- ran or didn't finish. Read-only; changes nothing.
-- ============================================================

select * from (
  -- Tables that must exist
  select 1 as ord, 'table: paid_sessions (PAID_SESSIONS migration)' as check,
    case when exists (select 1 from information_schema.tables where table_name = 'paid_sessions') then 'OK' else 'MISSING' end as status
  union all
  select 2, 'table: tickets (SUPPORT_SYSTEM migration)',
    case when exists (select 1 from information_schema.tables where table_name = 'tickets') then 'OK' else 'MISSING' end
  union all
  select 3, 'table: ticket_messages (SUPPORT_SYSTEM migration)',
    case when exists (select 1 from information_schema.tables where table_name = 'ticket_messages') then 'OK' else 'MISSING' end
  union all
  select 4, 'table: daily_factors (LAYER1_FACTORS migration)',
    case when exists (select 1 from information_schema.tables where table_name = 'daily_factors') then 'OK' else 'MISSING' end
  union all
  -- Table that must be GONE
  select 5, 'old messages table dropped (HOUSEKEEPING migration)',
    case when exists (select 1 from information_schema.tables where table_name = 'messages') then 'STILL EXISTS — run HOUSEKEEPING' else 'OK' end
  union all
  -- Profiles columns
  select 6, 'profiles.is_admin (SECURITY_HARDENING)',
    case when exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'is_admin') then 'OK' else 'MISSING' end
  union all
  select 7, 'profiles.email (ADD_EMAIL migration)',
    case when exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'email') then 'OK' else 'MISSING' end
  union all
  select 8, 'profiles.food_frequency (intake/reintro engine)',
    case when exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'food_frequency') then 'OK' else 'MISSING' end
  union all
  select 9, 'profiles.baseline_avg_sleep (LAYER1_FACTORS)',
    case when exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'baseline_avg_sleep') then 'OK' else 'MISSING' end
  union all
  select 10, 'profiles.maintain_opt_in (MAINTAIN_OPTIN or MAINTAIN_PROTECTION)',
    case when exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'maintain_opt_in') then 'OK' else 'MISSING' end
  union all
  select 11, 'profiles.maintain_active (MAINTAIN_OPTIN or MAINTAIN_PROTECTION)',
    case when exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'maintain_active') then 'OK' else 'MISSING' end
  union all
  -- Security machinery
  select 12, 'function is_admin_check (SECURITY_HARDENING)',
    case when exists (select 1 from pg_proc where proname = 'is_admin_check') then 'OK' else 'MISSING' end
  union all
  select 13, 'function protect_is_admin (SECURITY_HARDENING)',
    case when exists (select 1 from pg_proc where proname = 'protect_is_admin') then 'OK' else 'MISSING' end
  union all
  select 14, 'trigger protect_is_admin_trigger on profiles (SECURITY_HARDENING)',
    case when exists (select 1 from pg_trigger where tgname = 'protect_is_admin_trigger') then 'OK' else 'MISSING' end
  union all
  select 15, 'trigger covers maintain columns (MAINTAIN_PROTECTION)',
    case when exists (select 1 from pg_proc where proname = 'protect_is_admin' and prosrc like '%maintain_active%') then 'OK' else 'MISSING — run MAINTAIN_PROTECTION' end
) checks
order by ord;
