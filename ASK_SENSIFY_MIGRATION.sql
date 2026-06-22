-- ============================================================
-- Ask Sensify — meal log table
-- Stores what users log via the conversational assistant.
-- Structured so it can later feed drift detection + token rewards.
-- ============================================================

create table if not exists meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_at timestamptz not null default now(),
  log_date date not null default (now() at time zone 'utc')::date,
  -- The raw thing the user said, e.g. "eggs and toast for breakfast"
  raw_text text,
  -- Parsed foods: [{ name, mapStatus, mapTier }] where mapStatus is
  -- 'safe' | 'limit' | 'avoid' | 'unknown' (not on their map)
  foods jsonb not null default '[]'::jsonb,
  -- Any flags surfaced at log time (e.g. ate an Avoid food)
  flagged boolean not null default false,
  meal_type text, -- optional: breakfast | lunch | dinner | snack
  created_at timestamptz not null default now()
);

create index if not exists meal_logs_user_date_idx on meal_logs (user_id, log_date desc);

-- Conversation history for the assistant (so chats persist)
create table if not exists ask_sensify_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null, -- 'user' | 'assistant'
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists ask_sensify_user_time_idx on ask_sensify_messages (user_id, created_at);

-- ============================================================
-- RLS — users see and write only their own rows
-- ============================================================
alter table meal_logs enable row level security;
alter table ask_sensify_messages enable row level security;

drop policy if exists "Users manage own meal logs" on meal_logs;
create policy "Users manage own meal logs" on meal_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Admins view all meal logs" on meal_logs;
create policy "Admins view all meal logs" on meal_logs
  for select using (is_admin_check());

drop policy if exists "Users manage own ask messages" on ask_sensify_messages;
create policy "Users manage own ask messages" on ask_sensify_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
