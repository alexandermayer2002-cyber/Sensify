-- ============================================================
-- Layer 1 (Capture): lifestyle baselines + daily factor logging
-- ============================================================

-- --- Intake lifestyle baselines (the personal "normal") --------------------
alter table profiles add column if not exists gender text;                      -- 'female' | 'male' | 'undisclosed'
alter table profiles add column if not exists baseline_avg_sleep text;          -- 'under6' | '6-7' | '7-8' | '8plus'
alter table profiles add column if not exists baseline_avg_stress text;         -- 'low' | 'moderate' | 'high'
alter table profiles add column if not exists baseline_avg_hydration text;      -- 'under3' | '3-5' | '6-8' | '8plus'
alter table profiles add column if not exists drinks_alcohol boolean;
alter table profiles add column if not exists baseline_avg_drinks_week text;    -- '1-3' | '4-7' | '8-14' | '15plus'

-- --- Daily factor log (one row per user per day) ---------------------------
-- Captures the day's actual values, recorded when recall is accurate ("last
-- night", "today"). These roll up into accurate weekly averages later (Layer 2)
-- and feed divergence detection. This is capture only; no analysis yet.
create table if not exists daily_factors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null default (now() at time zone 'utc')::date,
  followed_protocol boolean,        -- the compliance answer (Y/N)
  sleep text,                       -- last night, same bands as baseline
  stress text,                      -- today
  hydration text,                   -- today
  cycle_phase text,                 -- optional, women only (e.g. 'period','follicular','luteal','none')
  drinks integer,                   -- number of drinks, optional
  created_at timestamptz default now(),
  unique (user_id, log_date)
);

alter table daily_factors enable row level security;

drop policy if exists "Users manage own daily factors" on daily_factors;
create policy "Users manage own daily factors" on daily_factors
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
