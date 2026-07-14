-- Session 5: the AI's read-only layer (BLUEPRINT §4, CLAUDE.md rule 4).
--
-- mirror_readonly can ONLY execute the whitelisted functions below — no
-- table, view, or sequence grants. Each function is SECURITY DEFINER
-- (owner bypasses RLS) and aggregates the single user's data (§7: one user,
-- signups disabled). The role is created NOLOGIN here; the login password
-- is set post-deploy so no credential lands in the repo. ai-ask is the only
-- consumer of this role.

do $$ begin
  if not exists (select from pg_roles where rolname = 'mirror_readonly') then
    create role mirror_readonly nologin;
  end if;
end $$;

grant usage on schema public to mirror_readonly;

-- ---------------------------------------------------------------------------
create or replace function public.get_remaining_today()
returns jsonb
language sql stable security definer set search_path = public
as $$
  with eaten as (
    select coalesce(sum(kcal), 0) as kcal,
           coalesce(sum(protein_g), 0) as protein_g,
           coalesce(sum(carbs_g), 0) as carbs_g,
           coalesce(sum(fat_g), 0) as fat_g,
           coalesce(sum(fibre_g), 0) as fibre_g,
           count(*) as entries
    from food_logs where logical_day(logged_at) = logical_day(now())
  ),
  phase as (
    select * from diet_phases where end_date is null
    order by start_date desc limit 1
  )
  select jsonb_build_object(
    'logical_day', logical_day(now()),
    'eaten', (select jsonb_build_object(
      'kcal', round(kcal), 'protein_g', round(protein_g, 1),
      'carbs_g', round(carbs_g, 1), 'fat_g', round(fat_g, 1),
      'fibre_g', round(fibre_g, 1), 'entries', entries) from eaten),
    'phase', (select phase from phase),
    'targets', (select jsonb_build_object(
      'kcal', kcal_target, 'protein_g', protein_target_g,
      'carbs_g', carbs_target_g, 'fat_g', fat_target_g,
      'fibre_g', fibre_target_g) from phase),
    'remaining', (select jsonb_build_object(
      'kcal', round(p.kcal_target - e.kcal),
      'protein_g', round(p.protein_target_g - e.protein_g, 1),
      'carbs_g', round(p.carbs_target_g - e.carbs_g, 1),
      'fat_g', round(p.fat_target_g - e.fat_g, 1),
      'fibre_g', round(p.fibre_target_g - e.fibre_g, 1))
      from eaten e, phase p)
  )
$$;

-- ---------------------------------------------------------------------------
create or replace function public.get_macros_range(days int default 7)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'day', day, 'kcal', round(kcal), 'protein_g', round(protein_g, 1),
    'carbs_g', round(carbs_g, 1), 'fat_g', round(fat_g, 1),
    'fibre_g', round(fibre_g, 1), 'entries', entries) order by day), '[]'::jsonb)
  from macros_daily
  where day >= logical_day(now()) - greatest(least(days, 90), 1)
$$;

-- ---------------------------------------------------------------------------
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
    'note', 'goal projection lands with the goals module'
  )
$$;

-- ---------------------------------------------------------------------------
create or replace function public.get_lift_progression(exercise_name text)
returns jsonb
language sql stable security definer set search_path = public
as $$
  with ex as (
    select id, name from exercises
    where name ilike '%' || exercise_name || '%'
    order by length(name) limit 1
  ),
  tops as (
    select ws.started_at, s.weight_kg, s.reps,
      round(case when s.reps <= 1 then s.weight_kg
                 else s.weight_kg * (1 + s.reps / 30.0) end, 1) as e1rm,
      row_number() over (partition by s.session_id order by
        case when s.reps <= 1 then s.weight_kg
             else s.weight_kg * (1 + s.reps / 30.0) end desc) as rn
    from sets s
    join workout_sessions ws on ws.id = s.session_id
    cross join ex
    where s.exercise_id = ex.id and s.weight_kg is not null
  )
  select jsonb_build_object(
    'exercise', (select name from ex),
    'sessions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'date', logical_day(started_at), 'top_weight_kg', weight_kg,
        'reps', reps, 'e1rm_kg', e1rm) order by started_at)
      from tops where rn = 1), '[]'::jsonb)
  )
$$;

-- ---------------------------------------------------------------------------
create or replace function public.get_session_adherence()
returns jsonb
language sql stable security definer set search_path = public
as $$
  select jsonb_build_object(
    'weekly_target', coalesce((select weekly_session_target from profile limit 1), 6),
    'weeks', coalesce((
      select jsonb_agg(jsonb_build_object(
        'week_start', wk, 'sessions', n, 'types', types) order by wk)
      from (
        select date_trunc('week', logical_day(started_at)::timestamp)::date as wk,
               count(*) as n,
               jsonb_agg(session_type) as types
        from workout_sessions
        where started_at > now() - interval '8 weeks'
        group by 1
      ) weekly), '[]'::jsonb)
  )
$$;

-- ---------------------------------------------------------------------------
create or replace function public.get_networth()
returns jsonb
language sql stable security definer set search_path = public
as $$
  with latest_fx as (
    select rate, date from fx_snapshots where pair = 'AUDUSD'
    order by date desc limit 1
  ),
  latest_price as (
    select close_price, date from price_snapshots where symbol = 'VOO'
    order by date desc limit 1
  ),
  accts as (
    select a.name, a.type, a.currency, a.apy,
      (select balance from balance_events be where be.account_id = a.id
       order by recorded_at desc limit 1) as balance
    from accounts a
  ),
  hold as (select shares from holdings where symbol = 'VOO' limit 1)
  select jsonb_build_object(
    'accounts', coalesce((select jsonb_agg(jsonb_build_object(
      'name', name, 'type', type, 'balance', balance,
      'currency', currency, 'apy', apy)) from accts where balance is not null), '[]'::jsonb),
    'voo', case when (select shares from hold) is null then null else jsonb_build_object(
      'shares', (select shares from hold),
      'price_usd', (select close_price from latest_price),
      'price_date', (select date from latest_price),
      'value_usd', round((select shares from hold) * (select close_price from latest_price), 2),
      'value_aud', round((select shares from hold) * (select close_price from latest_price)
                         / (select rate from latest_fx), 2)) end,
    'fx', (select jsonb_build_object('pair', 'AUDUSD', 'rate', rate, 'date', date) from latest_fx),
    'total_aud', round(
      coalesce((select sum(balance) from accts where currency = 'AUD' and balance is not null), 0)
      + coalesce((select shares from hold) * (select close_price from latest_price)
                 / (select rate from latest_fx), 0), 2)
  )
$$;

-- ---------------------------------------------------------------------------
create or replace function public.get_networth_history(days int default 90)
returns jsonb
language sql stable security definer set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'date', d, 'total_aud', total) order by d), '[]'::jsonb)
  from (
    select d::date as d,
      coalesce((
        select sum(x.balance) from (
          select distinct on (be.account_id) be.balance
          from balance_events be
          join accounts a on a.id = be.account_id
          where a.currency = 'AUD' and be.recorded_at::date <= d::date
          order by be.account_id, be.recorded_at desc
        ) x), 0)
      + coalesce(
          (select shares from holdings where symbol = 'VOO' limit 1)
          * (select close_price from price_snapshots
             where symbol = 'VOO' and date <= d::date order by date desc limit 1)
          / (select rate from fx_snapshots
             where pair = 'AUDUSD' and date <= d::date order by date desc limit 1), 0)
      as total
    from generate_series(
      current_date - greatest(least(days, 365), 7),
      current_date, interval '1 day') as d
  ) series
  where total > 0
$$;

-- ---------------------------------------------------------------------------
create or replace function public.get_income_summary(period text default 'month')
returns jsonb
language sql stable security definer set search_path = public
as $$
  with bounds as (
    select case period
      when 'week' then date_trunc('week', (now() at time zone 'Australia/Melbourne'))::date
      when 'year' then date_trunc('year', (now() at time zone 'Australia/Melbourne'))::date
      else date_trunc('month', (now() at time zone 'Australia/Melbourne'))::date
    end as start_date
  ),
  entries as (
    select * from income_events, bounds
    where (received_at at time zone 'Australia/Melbourne')::date >= bounds.start_date
  )
  select jsonb_build_object(
    'period', case when period in ('week','year') then period else 'month' end,
    'from', (select start_date from bounds),
    'total', coalesce((select round(sum(amount), 2) from entries), 0),
    'entries', (select count(*) from entries),
    'by_source', coalesce((
      select jsonb_object_agg(source, total) from (
        select source, round(sum(amount), 2) as total from entries group by source
      ) grouped), '{}'::jsonb)
  )
$$;

-- ---------------------------------------------------------------------------
-- Lock down: EXECUTE defaults to PUBLIC on new functions — revoke, then grant
-- only to mirror_readonly (and keep authenticated for the app's own use of
-- the dashboard-relevant ones later if needed — deliberately NOT granted now;
-- the app reads through its own RLS paths).
revoke execute on function
  public.get_remaining_today(),
  public.get_macros_range(int),
  public.get_weight_trend(int),
  public.get_lift_progression(text),
  public.get_session_adherence(),
  public.get_networth(),
  public.get_networth_history(int),
  public.get_income_summary(text)
from public, anon, authenticated;

grant execute on function
  public.get_remaining_today(),
  public.get_macros_range(int),
  public.get_weight_trend(int),
  public.get_lift_progression(text),
  public.get_session_adherence(),
  public.get_networth(),
  public.get_networth_history(int),
  public.get_income_summary(text)
to mirror_readonly;
