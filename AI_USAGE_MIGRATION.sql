-- ============================================================
-- Ask Sensify — daily usage counter for per-user rate limiting
-- One row per user per day; incremented on each Ask Sensify message.
-- Keeps the AI bill safe from abuse (cap is enforced server-side).
-- ============================================================

create table if not exists ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default (now() at time zone 'utc')::date,
  count integer not null default 0,
  primary key (user_id, usage_date)
);

alter table ai_usage enable row level security;

-- Users may read their own count (so the UI can show "X left today" if desired).
drop policy if exists "Users read own usage" on ai_usage;
create policy "Users read own usage" on ai_usage
  for select using (auth.uid() = user_id);

-- Writes happen only via the service role in the proxy, so no insert/update policy
-- is granted to users. (Service role bypasses RLS.)

-- Atomic increment + read helper. Returns the new count for today.
create or replace function increment_ai_usage(p_user_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  new_count integer;
begin
  insert into ai_usage (user_id, usage_date, count)
  values (p_user_id, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, usage_date)
  do update set count = ai_usage.count + 1
  returning count into new_count;
  return new_count;
end;
$$;
