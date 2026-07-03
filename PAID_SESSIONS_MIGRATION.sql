-- ============================================================
-- PAID SESSIONS — durable record of verified Stripe payments.
--
-- THE GAP: proof of payment lived only in the ?session_id URL param.
-- If someone paid and closed the tab before creating their account,
-- the payment evaporated from our system — money taken, no account,
-- and no way for us to even see it happened.
--
-- THE FIX: verify-payment records every confirmed-paid session here
-- (server-side, service role). Recovery then works two ways:
--   1) Self-serve: "Paid but never finished? Continue here" on the
--      login page checks this table (via resume-paid-signup) and
--      re-opens signup for that email.
--   2) Admin visibility: the admin dashboard lists paid sessions with
--      no matching profile ("paid, no account") so Alex can reach out.
--
-- No user-facing policies: writes come from Netlify functions using the
-- service role (bypasses RLS). Only the admin account can read.
-- ============================================================

create table if not exists paid_sessions (
  session_id text primary key,          -- Stripe checkout session id
  email text not null,
  amount integer,                        -- cents, informational
  created_at timestamptz default now()
);

create index if not exists paid_sessions_email_idx on paid_sessions (email);

alter table paid_sessions enable row level security;

-- Admin (Alex's account) may read, for the "paid, no account" list.
drop policy if exists "admin reads paid sessions" on paid_sessions;
create policy "admin reads paid sessions" on paid_sessions
  for select using (auth.uid() = '826ea0a1-148b-4a2b-8e3f-2d40e1023d4b');

-- No insert/update/delete policies: service role only.
