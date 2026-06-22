-- ============================================================
-- Maintain — symptom logs table
-- Post-program symptom reporting. Pairs with meal_logs to power
-- drift detection and trends. Deliberately NOT tied to token rewards
-- (so reports stay honest).
-- ============================================================

create table if not exists symptom_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_at timestamptz not null default now(),
  log_date date not null default (now() at time zone 'utc')::date,
  symptom text not null,            -- e.g. 'Bloating', 'Headache', 'Fatigue'
  severity text not null,           -- 'mild' | 'moderate' | 'severe'
  note text,                        -- optional free text
  created_at timestamptz not null default now()
);

create index if not exists symptom_logs_user_date_idx on symptom_logs (user_id, log_date desc);

alter table symptom_logs enable row level security;

drop policy if exists "Users manage own symptom logs" on symptom_logs;
create policy "Users manage own symptom logs" on symptom_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Admins view all symptom logs" on symptom_logs;
create policy "Admins view all symptom logs" on symptom_logs
  for select using (is_admin_check());
