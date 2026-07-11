-- Session 3: gym schema (BLUEPRINT §4) + PPL exercise seeds.

-- exercises: seeded rows have user_id null (global); custom rows user-owned.
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  name text not null,
  muscle_group text not null,
  is_custom boolean not null default false
);

create index exercises_name_trgm_idx on public.exercises using gin (name gin_trgm_ops);

alter table public.exercises enable row level security;

create policy "exercises are readable (global + own)" on public.exercises
  for select to authenticated
  using (user_id is null or user_id = (select auth.uid()));

create policy "own custom exercises: insert" on public.exercises
  for insert to authenticated
  with check (user_id = (select auth.uid()) and is_custom);

create policy "own custom exercises: update" on public.exercises
  for update to authenticated
  using (user_id = (select auth.uid()));

create policy "own custom exercises: delete" on public.exercises
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- workout_sessions: the container; sets are the events inside it.
create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  started_at timestamptz not null default now(),
  session_type text not null check (session_type in ('push', 'pull', 'legs', 'other')),
  notes text
);

create index workout_sessions_user_time_idx
  on public.workout_sessions (user_id, started_at desc);

alter table public.workout_sessions enable row level security;

create policy "own workout sessions" on public.workout_sessions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- sets: UPDATE is allowed deliberately — BLUEPRINT §3 requires editing
-- reps/weight per set during a live session. The strict append-only rule
-- (CLAUDE.md rule 3) continues to apply to weigh-ins and money events,
-- where state is derived from history.
create table public.sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  session_id uuid not null references public.workout_sessions on delete cascade,
  exercise_id uuid not null references public.exercises,
  set_number int not null,
  reps int not null,
  weight_kg numeric,
  rpe numeric
);

create index sets_session_idx on public.sets (session_id);
create index sets_user_exercise_idx on public.sets (user_id, exercise_id, created_at);

alter table public.sets enable row level security;

create policy "own sets" on public.sets
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Weekly session target powers the Home training card ("x of y this week").
alter table public.profile add column weekly_session_target int not null default 6;

-- ---------------------------------------------------------------------------
-- Seed: standard PPL exercise list.
insert into public.exercises (name, muscle_group) values
  -- Push
  ('Bench press', 'chest'),
  ('Incline bench press', 'chest'),
  ('Dumbbell bench press', 'chest'),
  ('Incline dumbbell press', 'chest'),
  ('Machine chest press', 'chest'),
  ('Cable fly', 'chest'),
  ('Dumbbell fly', 'chest'),
  ('Overhead press', 'shoulders'),
  ('Seated dumbbell press', 'shoulders'),
  ('Lateral raise', 'shoulders'),
  ('Cable lateral raise', 'shoulders'),
  ('Front raise', 'shoulders'),
  ('Dips', 'triceps'),
  ('Tricep pushdown', 'triceps'),
  ('Overhead tricep extension', 'triceps'),
  ('Skullcrusher', 'triceps'),
  ('Close-grip bench press', 'triceps'),
  -- Pull
  ('Deadlift', 'back'),
  ('Barbell row', 'back'),
  ('Pull-up', 'back'),
  ('Chin-up', 'back'),
  ('Lat pulldown', 'back'),
  ('Seated cable row', 'back'),
  ('Dumbbell row', 'back'),
  ('T-bar row', 'back'),
  ('Machine row', 'back'),
  ('Face pull', 'shoulders'),
  ('Rear delt fly', 'shoulders'),
  ('Shrug', 'traps'),
  ('Barbell curl', 'biceps'),
  ('Dumbbell curl', 'biceps'),
  ('Hammer curl', 'biceps'),
  ('Preacher curl', 'biceps'),
  ('Cable curl', 'biceps'),
  -- Legs
  ('Squat', 'quads'),
  ('Front squat', 'quads'),
  ('Leg press', 'quads'),
  ('Hack squat', 'quads'),
  ('Leg extension', 'quads'),
  ('Bulgarian split squat', 'quads'),
  ('Walking lunge', 'quads'),
  ('Romanian deadlift', 'hamstrings'),
  ('Leg curl', 'hamstrings'),
  ('Seated leg curl', 'hamstrings'),
  ('Hip thrust', 'glutes'),
  ('Calf raise', 'calves'),
  ('Seated calf raise', 'calves'),
  -- Core
  ('Plank', 'core'),
  ('Cable crunch', 'core'),
  ('Hanging leg raise', 'core'),
  ('Ab wheel rollout', 'core');
