-- Session 2: diet schema (BLUEPRINT §4) + logical_day helper (CLAUDE.md rule 2).

create extension if not exists pg_trgm;

-- The logical day ends at 03:00 Australia/Melbourne: convert to local time,
-- shift back 3 hours, take the date. A meal at 00:30 belongs to the previous
-- day; 03:30 belongs to the current day. Marked immutable so it can be
-- indexed; tzdata rule changes for Australia/Melbourne are accepted as a
-- non-risk for this single-user app.
create or replace function public.logical_day(ts timestamptz)
returns date
language sql
immutable
parallel safe
as $$
  select (((ts at time zone 'Australia/Melbourne') - interval '3 hours'))::date
$$;

-- ---------------------------------------------------------------------------
-- foods: seeded rows have user_id null (global, read-only to the app user);
-- custom rows are user-owned. All nutrition values are per 100 g.
create table public.foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  name text not null,
  brand text,
  source text not null check (source in ('afcd', 'usda', 'custom', 'ai_estimate')),
  kcal numeric not null,
  protein_g numeric not null,
  carbs_g numeric not null,
  fat_g numeric not null,
  fibre_g numeric not null default 0,
  sodium_mg numeric,
  potassium_mg numeric,
  iron_mg numeric,
  calcium_mg numeric
);

create index foods_name_trgm_idx on public.foods using gin (name gin_trgm_ops);

alter table public.foods enable row level security;

create policy "foods are readable (global + own)" on public.foods
  for select to authenticated
  using (user_id is null or user_id = (select auth.uid()));

create policy "own custom foods: insert" on public.foods
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "own custom foods: update" on public.foods
  for update to authenticated
  using (user_id = (select auth.uid()));

create policy "own custom foods: delete" on public.foods
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- saved_meals: named bundles of {food_id, grams} for one-tap logging.
create table public.saved_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  name text not null,
  items jsonb not null default '[]' -- [{food_id, grams}]
);

alter table public.saved_meals enable row level security;

create policy "own saved meals" on public.saved_meals
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- food_logs: append-only events (CLAUDE.md rule 3). Macros are denormalized
-- at log time so history stays stable if a food row is later edited.
-- source 'ai_estimate' flags rows whose numbers came from the model rather
-- than the foods table (CLAUDE.md rule 8).
create table public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  logged_at timestamptz not null default now(),
  food_id uuid references public.foods on delete set null, -- null for pure AI estimates
  grams numeric,
  kcal numeric not null,
  protein_g numeric not null,
  carbs_g numeric not null,
  fat_g numeric not null,
  fibre_g numeric not null default 0,
  micros jsonb not null default '{}',
  source text not null check (source in ('manual', 'ai_parse', 'saved_meal', 'ai_estimate')),
  raw_text text
);

create index food_logs_user_day_idx
  on public.food_logs (user_id, public.logical_day(logged_at));

alter table public.food_logs enable row level security;

-- Append-only: select/insert/delete, no update policy. Delete covers mislogs;
-- values are never edited in place.
create policy "own food logs: select" on public.food_logs
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "own food logs: insert" on public.food_logs
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "own food logs: delete" on public.food_logs
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- diet_phases: end_date null = active phase.
create table public.diet_phases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  phase text not null check (phase in ('cut', 'bulk', 'maintain')),
  start_date date not null default current_date,
  end_date date,
  kcal_target numeric not null,
  protein_target_g numeric not null,
  carbs_target_g numeric not null,
  fat_target_g numeric not null,
  fibre_target_g numeric not null
);

alter table public.diet_phases enable row level security;

create policy "own diet phases" on public.diet_phases
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- weigh_ins: append-only events (CLAUDE.md rule 3).
create table public.weigh_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  measured_at timestamptz not null default now(),
  weight_kg numeric not null
);

create index weigh_ins_user_time_idx on public.weigh_ins (user_id, measured_at);

alter table public.weigh_ins enable row level security;

create policy "own weigh-ins: select" on public.weigh_ins
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "own weigh-ins: insert" on public.weigh_ins
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "own weigh-ins: delete" on public.weigh_ins
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- profile: one row per user.
create table public.profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  height_cm numeric
);

alter table public.profile enable row level security;

create policy "own profile" on public.profile
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- macros_daily: per-logical-day totals. security_invoker so the querying
-- user's RLS applies. Powers the Home macros card now and the AI's
-- read-only tools in Session 5.
create view public.macros_daily
with (security_invoker = on) as
select
  user_id,
  public.logical_day(logged_at) as day,
  sum(kcal) as kcal,
  sum(protein_g) as protein_g,
  sum(carbs_g) as carbs_g,
  sum(fat_g) as fat_g,
  sum(fibre_g) as fibre_g,
  count(*) as entries
from public.food_logs
group by user_id, public.logical_day(logged_at);
