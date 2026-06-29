-- ============================================================
-- Two-way admin <-> user messaging
-- A simple thread per user (admin and user exchange messages).
-- ============================================================

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,  -- the user the thread belongs to
  sender text not null check (sender in ('admin', 'user')),           -- who sent this message
  subject text,                                                       -- optional, mainly for the first admin message
  body text not null,
  read boolean default false,                                          -- has the *recipient* read it
  created_at timestamptz default now()
);

create index if not exists messages_user_idx on messages (user_id, created_at);

alter table messages enable row level security;

-- Users can read messages in their own thread and send (as 'user').
drop policy if exists "Users read own thread" on messages;
create policy "Users read own thread" on messages
  for select using (auth.uid() = user_id);

drop policy if exists "Users send in own thread" on messages;
create policy "Users send in own thread" on messages
  for insert with check (auth.uid() = user_id and sender = 'user');

-- Users can mark messages in their thread as read (update read flag).
drop policy if exists "Users update own thread read" on messages;
create policy "Users update own thread read" on messages
  for update using (auth.uid() = user_id);

-- NOTE: the admin reads/writes across all threads via the service role
-- (admin dashboard uses elevated access), so no public admin policy here.
