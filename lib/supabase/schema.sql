-- ============================================================
-- GolfDraw · Supabase Schema
-- Run this in Supabase SQL editor on a fresh project
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  charity_id uuid,
  charity_contribution_pct integer default 10 check (charity_contribution_pct >= 10 and charity_contribution_pct <= 100),
  role text default 'subscriber' check (role in ('subscriber', 'admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Admins can manage all profiles"
on public.profiles
for all
using (
  auth.jwt() ->> 'email' = 'admin@gmail.com'
);
-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
create table public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  plan text not null check (plan in ('monthly', 'yearly')),
  status text not null default 'active' check (status in ('active', 'inactive', 'cancelled', 'lapsed')),
  stripe_customer_id text,
  stripe_subscription_id text,
  amount_pence integer not null, -- in pence/cents
  renewal_date timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can view own subscription" on public.subscriptions
  for select using (auth.uid() = user_id);

create policy "Admins full access subscriptions" on public.subscriptions
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- CHARITIES
-- ============================================================
create table public.charities (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  description text,
  logo_url text,
  banner_url text,
  website_url text,
  is_featured boolean default false,
  is_active boolean default true,
  total_received numeric(12,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.charities enable row level security;

create policy "Anyone can view active charities" on public.charities
  for select using (is_active = true);

create policy "Admins full access charities" on public.charities
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- SCORES (max 5 per user, rolling)
-- ============================================================
create table public.scores (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  score_date date not null,
  stableford_score integer not null check (stableford_score >= 1 and stableford_score <= 45),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, score_date) -- one score per date per user
);

alter table public.scores enable row level security;

create policy "Users can manage own scores" on public.scores
  for all using (auth.uid() = user_id);

create policy "Admins can view all scores" on public.scores
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Function: enforce max 5 scores (rolling — delete oldest if > 5)
create or replace function enforce_rolling_scores()
returns trigger as $$
declare
  score_count integer;
  oldest_id uuid;
begin
  select count(*) into score_count from public.scores where user_id = NEW.user_id;
  if score_count >= 5 then
    select id into oldest_id from public.scores
      where user_id = NEW.user_id
      order by score_date asc
      limit 1;
    delete from public.scores where id = oldest_id;
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_rolling_scores
  before insert on public.scores
  for each row execute function enforce_rolling_scores();

-- ============================================================
-- DRAWS
-- ============================================================
create table public.draws (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  draw_month date not null, -- first day of the month
  draw_type text not null default 'random' check (draw_type in ('random', 'weighted')),
  status text not null default 'pending' check (status in ('pending', 'simulated', 'published')),
  winning_numbers integer[], -- 5 numbers drawn
  jackpot_amount numeric(12,2) default 0,
  pool_4match numeric(12,2) default 0,
  pool_3match numeric(12,2) default 0,
  total_subscribers integer default 0,
  jackpot_rolled_over boolean default false,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.draws enable row level security;

create policy "Anyone can view published draws" on public.draws
  for select using (status = 'published');

create policy "Admins full access draws" on public.draws
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- WINNERS
-- ============================================================
create table public.winners (
  id uuid default uuid_generate_v4() primary key,
  draw_id uuid references public.draws(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  match_type text not null check (match_type in ('5_match', '4_match', '3_match')),
  matched_numbers integer[],
  prize_amount numeric(12,2) default 0,
  proof_url text,
  verification_status text default 'pending' check (verification_status in ('pending', 'approved', 'rejected')),
  payout_status text default 'pending' check (payout_status in ('pending', 'paid')),
  verified_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.winners enable row level security;

create policy "Users can view own winnings" on public.winners
  for select using (auth.uid() = user_id);

create policy "Users can upload proof" on public.winners
  for update using (auth.uid() = user_id);

create policy "Admins full access winners" on public.winners
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- CHARITY CONTRIBUTIONS
-- ============================================================
create table public.charity_contributions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  charity_id uuid references public.charities(id) not null,
  subscription_id uuid references public.subscriptions(id) not null,
  amount numeric(12,2) not null,
  contribution_date date not null,
  created_at timestamptz default now()
);

alter table public.charity_contributions enable row level security;

create policy "Users can view own contributions" on public.charity_contributions
  for select using (auth.uid() = user_id);

create policy "Admins full access contributions" on public.charity_contributions
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- SEED: Sample Charities
-- ============================================================
insert into public.charities (name, slug, description, is_featured) values
  ('Golf Foundation', 'golf-foundation', 'Helping young people access golf and develop life skills through sport.', true),
  ('Cancer Research UK', 'cancer-research-uk', 'The world''s leading cancer research charity, funding scientists and nurses.', false),
  ('Macmillan Cancer Support', 'macmillan', 'Providing medical, emotional, and financial support to people living with cancer.', false),
  ('British Heart Foundation', 'bhf', 'Funding research into heart and circulatory diseases.', false),
  ('Age UK', 'age-uk', 'Supporting older people to live fulfilling, independent, and dignified lives.', false);

-- ============================================================
-- TRIGGER: auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name
  )
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

-- ============================================================
-- RPC: Increment charity total (called from webhook after each payment)
-- WHY: Atomic increment avoids race conditions from concurrent payments
-- ============================================================
create or replace function increment_charity_total(charity_uuid uuid, amount_to_add numeric)
returns void as $$
begin
  update public.charities
  set total_received = total_received + amount_to_add,
      updated_at = now()
  where id = charity_uuid;
end;
$$ language plpgsql security definer;

-- ============================================================
-- DRAW ENTRIES VIEW — users entered in a draw (have active sub + 3+ scores)
-- WHY: Useful for admin to see eligible participants per draw
-- ============================================================
create or replace view public.draw_eligible_users as
  select
    p.id,
    p.email,
    p.full_name,
    count(s.id) as score_count
  from public.profiles p
  join public.subscriptions sub on sub.user_id = p.id and sub.status = 'active'
  left join public.scores s on s.user_id = p.id
  group by p.id, p.email, p.full_name
  having count(s.id) >= 3;

-- ============================================================
-- ANALYTICS VIEW — for admin reports page
-- WHY: Pre-aggregates key metrics so the reports page runs fast
-- ============================================================
create or replace view public.platform_stats as
  select
    (select count(*) from public.profiles) as total_users,
    (select count(*) from public.subscriptions where status = 'active') as active_subscribers,
    (select coalesce(sum(total_received), 0) from public.charities) as total_charity_raised,
    (select count(*) from public.draws where status = 'published') as total_draws_run,
    (select count(*) from public.winners) as total_winners,
    (select coalesce(sum(prize_amount), 0) from public.winners where payout_status = 'paid') as total_prizes_paid,
    (select coalesce(sum(prize_amount), 0) from public.winners where payout_status = 'pending' and verification_status = 'approved') as prizes_outstanding;

-- ============================================================
-- CHARITY EVENTS TABLE — upcoming golf days and charity events (PRD §08)
-- WHY: PRD requires charity profiles to show upcoming events (e.g. golf days)
-- ============================================================
create table public.charity_events (
  id uuid default uuid_generate_v4() primary key,
  charity_id uuid references public.charities(id) on delete cascade not null,
  title text not null,
  description text,
  event_date date not null,
  location text,
  registration_url text,
  created_at timestamptz default now()
);

alter table public.charity_events enable row level security;

create policy "Anyone can view charity events" on public.charity_events
  for select using (true);

create policy "Admins manage charity events" on public.charity_events
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- INDEPENDENT DONATIONS TABLE (PRD §08 — not tied to gameplay)
-- WHY: PRD requires users to be able to donate independently
-- ============================================================
create table public.independent_donations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  charity_id uuid references public.charities(id) not null,
  amount numeric(12,2) not null,
  ls_order_id text, -- LemonSqueezy order reference
  status text default 'pending' check (status in ('pending', 'completed', 'failed')),
  donated_at timestamptz default now()
);

alter table public.independent_donations enable row level security;

create policy "Users view own donations" on public.independent_donations
  for select using (auth.uid() = user_id);

create policy "Admins full access donations" on public.independent_donations
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- EMAIL NOTIFICATIONS LOG — tracks sent notifications (PRD §13)
-- WHY: Prevents duplicate notifications and gives audit trail
-- ============================================================
create table public.notification_log (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null, -- 'draw_result', 'winner_alert', 'subscription_renewal' etc.
  sent_at timestamptz default now(),
  success boolean default true,
  reference_id text -- draw_id, winner_id etc.
);

-- ============================================================
-- STORAGE BUCKETS — run these in Supabase SQL editor
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('proofs', 'proofs', true);
-- insert into storage.buckets (id, name, public) values ('charity-media', 'charity-media', true);

-- Storage RLS for proofs bucket:
-- create policy "Users upload own proofs" on storage.objects for insert
--   with check (bucket_id = 'proofs' and auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "Proofs are public" on storage.objects for select
--   using (bucket_id = 'proofs');
-- create policy "Admins manage all proofs" on storage.objects for all
--   using (bucket_id = 'proofs' and exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));


drop policy if exists "Admins can view all profiles" on public.profiles;

drop policy if exists "Admins can manage all profiles" on public.profiles;

update public.profiles
set role = 'admin'
where email = 'admin@gmail.com';

select role from public.profiles where id = auth.uid();

alter table subscriptions
rename column stripe_customer_id to lemonsqueezy_customer_id;

alter table subscriptions
rename column stripe_subscription_id to lemonsqueezy_subscription_id;