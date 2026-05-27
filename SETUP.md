# Sensify Setup Guide

## Step 1: Supabase Database Setup

Go to your Supabase project → SQL Editor → New query
Paste this SQL and click Run:

```sql
create table profiles (
  id uuid references auth.users on delete cascade,
  full_name text,
  symptoms text[],
  baseline_bloating int,
  baseline_energy int,
  program_phase text default 'awaiting_results',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (id)
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create table lab_results (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  foods jsonb,
  submitted_at timestamp with time zone default timezone('utc'::text, now()),
  status text default 'pending_review'
);

alter table lab_results enable row level security;

create policy "Users can view own lab results"
  on lab_results for select
  using (auth.uid() = user_id);

create policy "Users can insert own lab results"
  on lab_results for insert
  with check (auth.uid() = user_id);
```

## Step 2: Install Dependencies

In your terminal, navigate to the sensify folder and run:
```
npm install
```

## Step 3: Test Locally

```
npm start
```

This opens the app at http://localhost:3000

## Step 4: Build for Netlify

```
npm run build
```

This creates a `build` folder. Drag that folder to Netlify.

## Step 5: Netlify Settings

After deploying, go to Netlify → Site Settings → Build & Deploy
Add this redirect rule so React routing works:
- From: /*
- To: /index.html
- Status: 200

## Done!

Your app is live with real login at your Netlify URL.

## Additional Supabase Tables (run these too)

```sql
create table weekly_checkins (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  week_number int,
  answers jsonb,
  submitted_at timestamp with time zone default timezone('utc'::text, now())
);

alter table weekly_checkins enable row level security;

create policy "Users can manage own checkins"
  on weekly_checkins for all
  using (auth.uid() = user_id);

create table reintroduction_results (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  food text,
  cycle_number int,
  answers jsonb,
  trigger_belief text,
  confidence int,
  verdict text,
  submitted_at timestamp with time zone default timezone('utc'::text, now())
);

alter table reintroduction_results enable row level security;

create policy "Users can manage own reintroduction results"
  on reintroduction_results for all
  using (auth.uid() = user_id);

create table food_map (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  food text,
  verdict text,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, food)
);

alter table food_map enable row level security;

create policy "Users can manage own food map"
  on food_map for all
  using (auth.uid() = user_id);
```

## Profile Table Updates (run these too)

```sql
alter table profiles 
  add column if not exists latest_insight text,
  add column if not exists latest_insight_week int,
  add column if not exists last_checkin_at timestamp with time zone,
  add column if not exists current_week int default 1,
  add column if not exists current_day int default 0,
  add column if not exists streak int default 0,
  add column if not exists food_frequency jsonb,
  add column if not exists intake_completed_at timestamp with time zone,
  add column if not exists current_reintro_food text,
  add column if not exists current_reintro_day int,
  add column if not exists reintro_cycle int default 1;
```

## Daily Compliance & Audit Tables (run these too)

```sql
create table daily_compliance (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  date date not null,
  response text,
  slip_up_foods text[],
  slip_up_reason text,
  logged_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, date)
);

alter table daily_compliance enable row level security;

create policy "Users can manage own compliance"
  on daily_compliance for all
  using (auth.uid() = user_id);

create table compliance_audit (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade,
  triggered_at timestamp with time zone default timezone('utc'::text, now()),
  hardest_parts text[],
  branch_responses jsonb,
  ai_acknowledgment text,
  status text default 'pending_admin_review',
  admin_outcome text,
  admin_note text,
  responded_at timestamp with time zone
);

alter table compliance_audit enable row level security;

create policy "Users can view own audits"
  on compliance_audit for select
  using (auth.uid() = user_id);

create policy "Users can insert own audits"
  on compliance_audit for insert
  with check (auth.uid() = user_id);

alter table profiles
  add column if not exists phone_number text,
  add column if not exists text_time_preference text,
  add column if not exists sms_opted_in boolean default false;
```
