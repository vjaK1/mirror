-- Session 4: money schema (BLUEPRINT §4). Balance and income are append-only
-- events (CLAUDE.md rule 3); current state is always derived from history.
-- price/fx snapshots are global rows written only by the daily-snapshot
-- edge function (service role) — authenticated users read, never write.

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  name text not null,
  type text not null check (type in ('hysa', 'brokerage', 'other')),
  currency text not null default 'AUD',
  apy numeric
);

alter table public.accounts enable row level security;

create policy "own accounts" on public.accounts
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Append-only: no update policy. Delete covers fat-fingered entries.
create table public.balance_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  account_id uuid not null references public.accounts on delete cascade,
  recorded_at timestamptz not null default now(),
  balance numeric not null
);

create index balance_events_account_time_idx
  on public.balance_events (account_id, recorded_at desc);

alter table public.balance_events enable row level security;

create policy "own balance events: select" on public.balance_events
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own balance events: insert" on public.balance_events
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own balance events: delete" on public.balance_events
  for delete to authenticated using (user_id = (select auth.uid()));

create table public.income_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  received_at timestamptz not null default now(),
  amount numeric not null,
  currency text not null default 'AUD',
  source text not null,
  from_recurring boolean not null default false
);

create index income_events_user_time_idx
  on public.income_events (user_id, received_at desc);

alter table public.income_events enable row level security;

create policy "own income events: select" on public.income_events
  for select to authenticated using (user_id = (select auth.uid()));
create policy "own income events: insert" on public.income_events
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own income events: delete" on public.income_events
  for delete to authenticated using (user_id = (select auth.uid()));

-- Updatable: next_date advances as occurrences materialize into income_events.
create table public.recurring_income (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  amount numeric not null,
  currency text not null default 'AUD',
  source text not null,
  cadence text not null check (cadence in ('weekly', 'fortnightly', 'monthly')),
  next_date date not null
);

alter table public.recurring_income enable row level security;

create policy "own recurring income" on public.recurring_income
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Current-state by design (manual share count, BLUEPRINT §4) — not an event log.
create table public.holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  symbol text not null,
  shares numeric not null,
  currency text not null default 'USD',
  unique (user_id, symbol)
);

alter table public.holdings enable row level security;

create policy "own holdings" on public.holdings
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Global snapshots: no user_id; written by daily-snapshot via service role.
create table public.price_snapshots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  symbol text not null,
  date date not null,
  close_price numeric not null,
  currency text not null default 'USD',
  unique (symbol, date)
);

alter table public.price_snapshots enable row level security;

create policy "price snapshots are readable" on public.price_snapshots
  for select to authenticated using (true);

create table public.fx_snapshots (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  date date not null,
  pair text not null default 'AUDUSD',
  rate numeric not null,
  unique (pair, date)
);

alter table public.fx_snapshots enable row level security;

create policy "fx snapshots are readable" on public.fx_snapshots
  for select to authenticated using (true);

-- Cron plumbing for daily-snapshot (job itself is registered post-deploy so
-- the shared secret never lands in the repo).
create extension if not exists pg_cron;
create extension if not exists pg_net;
