-- ============================================================
-- Layer 2 — confound observation log (auditability)
-- Records what the confound engine noticed and when, so the thresholds
-- can be tuned from evidence later (did it fire too often / too rarely).
-- ============================================================

create table if not exists confound_observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  week_start date,                 -- the week this observation relates to
  engine text,                     -- 'absolute' | 'divergence'
  factor text,                     -- 'sleep' | 'stress' | 'hydration' | 'alcohol'
  direction text,                  -- 'up' | 'down' (divergence only)
  repeats integer,                 -- divergence: how many times the pattern recurred
  confidence text,                 -- 'stated' | 'lived' | 'moderate' | 'strong'
  surfaced boolean default false,  -- did it actually get shown to the user this week
  sufficiency text,                -- 'none' | 'insufficient' | 'sufficient' at time of run
  detail jsonb                     -- raw observation object for later analysis
);

alter table confound_observations enable row level security;

-- Users can read their own; only the app (service role) writes.
drop policy if exists "Users read own confound observations" on confound_observations;
create policy "Users read own confound observations" on confound_observations
  for select using (auth.uid() = user_id);

drop policy if exists "Users insert own confound observations" on confound_observations;
create policy "Users insert own confound observations" on confound_observations
  for insert with check (auth.uid() = user_id);
