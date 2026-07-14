-- Session 6: notes & goals (BLUEPRINT §4, §8).

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  type text not null check (type in ('todo', 'scratch', 'journal')),
  content text not null,
  is_done boolean -- null for non-todos
);

create index notes_user_type_idx on public.notes (user_id, type, created_at desc);

alter table public.notes enable row level security;

create policy "own notes" on public.notes
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- v1: a single goal — the October cut (unique per metric for upsert).
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  name text not null,
  metric text not null check (metric in ('weight_kg')),
  target_value numeric not null,
  target_date date not null,
  unique (user_id, metric)
);

alter table public.goals enable row level security;

create policy "own goals" on public.goals
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- get_weight_trend now includes the goal and the projected weight at the
-- goal date (7-day avg + regression slope carried forward). Same signature;
-- existing grant to mirror_readonly is preserved by CREATE OR REPLACE.
create or replace function public.get_weight_trend(days int default 30)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'series', coalesce((
      select jsonb_agg(jsonb_build_object(
        'date', logical_day(w.measured_at),
        'weight_kg', w.weight_kg,
        'avg7_kg', (select round(avg(w2.weight_kg), 2) from weigh_ins w2
                    where w2.measured_at <= w.measured_at
                      and w2.measured_at > w.measured_at - interval '7 days'))
        order by w.measured_at)
      from weigh_ins w
      where w.measured_at > now() - make_interval(days => greatest(days, 7))), '[]'::jsonb),
    'current_avg7_kg', (select round(avg(weight_kg), 2) from weigh_ins
                        where measured_at > now() - interval '7 days'),
    'slope_kg_per_week', (
      select round((regr_slope(weight_kg, extract(epoch from measured_at)) * 604800)::numeric, 3)
      from weigh_ins where measured_at > now() - make_interval(days => greatest(days, 7))),
    'goal', (
      select jsonb_build_object(
        'name', g.name,
        'target_kg', g.target_value,
        'target_date', g.target_date,
        'days_to_target', g.target_date - current_date,
        'projected_kg_at_target_date', (
          select round(((select avg(w.weight_kg) from weigh_ins w
                         where w.measured_at > now() - interval '7 days')
            + coalesce((select regr_slope(w2.weight_kg, extract(epoch from w2.measured_at))
                        from weigh_ins w2
                        where w2.measured_at > now() - make_interval(days => greatest(days, 7))), 0)
              * extract(epoch from (g.target_date::timestamptz - now())))::numeric, 2)))
      from goals g where g.metric = 'weight_kg' limit 1)
  )
$$;

-- ---------------------------------------------------------------------------
create or replace function public.get_notes(note_type text default null)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'type', type, 'content', content, 'is_done', is_done,
    'created', created_at::date) order by created_at desc), '[]'::jsonb)
  from (
    select * from notes
    where note_type is null or type = note_type
    order by created_at desc limit 50
  ) recent
$$;

revoke execute on function public.get_notes(text) from public, anon, authenticated;
grant execute on function public.get_notes(text) to mirror_readonly;
