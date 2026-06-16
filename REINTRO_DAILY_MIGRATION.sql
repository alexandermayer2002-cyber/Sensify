-- ============================================================
-- Reintroduction daily logging — run in Supabase SQL Editor
-- ============================================================

-- Daily log: one row per day of an active reintro cycle
create table if not exists reintro_daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  reintro_id uuid references reintroduction_results(id),
  food text not null,
  log_date date not null,
  phase text not null,                    -- 'exposure' | 'washout'
  ate_food boolean,                       -- exposure days: did they eat it
  exposure_number int,                    -- 1,2,3 = which real exposure day (null if skipped/washout)
  had_symptoms boolean default false,
  symptoms jsonb default '[]'::jsonb,      -- [{ name, intensity }] intensity: 'mild'|'moderate'|'severe'
  stopped_early boolean default false,     -- severe reaction off-ramp fired
  created_at timestamptz default now(),
  unique (user_id, reintro_id, log_date)
);

-- Track exposure progress + floating schedule on the cycle itself
alter table reintroduction_results add column if not exists exposure_days_completed int default 0;
alter table reintroduction_results add column if not exists washout_started_at date;
alter table reintroduction_results add column if not exists verdict_due_date date;
alter table reintroduction_results add column if not exists restart_count int default 0;
alter table reintroduction_results add column if not exists stopped_early boolean default false;
alter table reintroduction_results add column if not exists verdict_reason text;
alter table reintroduction_results add column if not exists food_briefing text;

-- RLS
alter table reintro_daily_logs enable row level security;

drop policy if exists "Users manage own reintro logs" on reintro_daily_logs;
create policy "Users manage own reintro logs"
on reintro_daily_logs for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Admins read all reintro logs" on reintro_daily_logs;
create policy "Admins read all reintro logs"
on reintro_daily_logs for select
using (is_admin_check());
