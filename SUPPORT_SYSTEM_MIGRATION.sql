-- ============================================================
-- Support / correspondence system (tickets + messages)
-- Replaces the flat "messages" table. Models support tickets:
-- each ticket is one subject/conversation; messages are the replies.
--
-- KEY FIX vs the first attempt: the admin dashboard runs as a normal
-- authenticated user (the admin's account), NOT service role. So RLS
-- must grant the ADMIN account explicit cross-thread access, or admin
-- sends are silently blocked. That's what broke before.
-- ============================================================

-- ---- TICKETS ------------------------------------------------
create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  status text not null default 'awaiting' check (status in ('awaiting','replied','resolved')),
  -- denormalized for fast inbox rendering & sorting:
  last_message_at timestamptz default now(),
  last_message_preview text,
  last_sender text,                        -- 'admin' | 'user' (who sent the last message)
  unread_for_admin boolean default true,   -- a new user request starts unread for admin
  unread_for_user boolean default false,   -- becomes true when admin replies
  created_at timestamptz default now(),
  initiated_by text not null default 'user' check (initiated_by in ('user','admin'))
);

create index if not exists tickets_user_idx on tickets (user_id, last_message_at desc);
create index if not exists tickets_inbox_idx on tickets (last_message_at desc);

-- ---- MESSAGES (within a ticket) -----------------------------
create table if not exists ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,  -- the ticket owner (for RLS)
  sender text not null check (sender in ('admin','user')),
  body text not null,
  created_at timestamptz default now()
);

create index if not exists ticket_messages_ticket_idx on ticket_messages (ticket_id, created_at);

-- ============================================================
-- RLS
-- ============================================================
alter table tickets enable row level security;
alter table ticket_messages enable row level security;

-- The admin user id. (Single admin — if more admins are added later,
-- switch this to a profiles.is_admin lookup via a SECURITY DEFINER fn.)
-- 826ea0a1-148b-4a2b-8e3f-2d40e1023d4b

-- ---- TICKETS policies ----
drop policy if exists "user reads own tickets" on tickets;
create policy "user reads own tickets" on tickets
  for select using (auth.uid() = user_id);

drop policy if exists "user creates own tickets" on tickets;
create policy "user creates own tickets" on tickets
  for insert with check (auth.uid() = user_id);

drop policy if exists "user updates own tickets" on tickets;
create policy "user updates own tickets" on tickets
  for update using (auth.uid() = user_id);

drop policy if exists "admin all tickets" on tickets;
create policy "admin all tickets" on tickets
  for all
  using (auth.uid() = '826ea0a1-148b-4a2b-8e3f-2d40e1023d4b')
  with check (auth.uid() = '826ea0a1-148b-4a2b-8e3f-2d40e1023d4b');

-- ---- TICKET_MESSAGES policies ----
drop policy if exists "user reads own ticket messages" on ticket_messages;
create policy "user reads own ticket messages" on ticket_messages
  for select using (auth.uid() = user_id);

drop policy if exists "user sends own ticket messages" on ticket_messages;
create policy "user sends own ticket messages" on ticket_messages
  for insert with check (auth.uid() = user_id and sender = 'user');

drop policy if exists "admin all ticket messages" on ticket_messages;
create policy "admin all ticket messages" on ticket_messages
  for all
  using (auth.uid() = '826ea0a1-148b-4a2b-8e3f-2d40e1023d4b')
  with check (auth.uid() = '826ea0a1-148b-4a2b-8e3f-2d40e1023d4b');
