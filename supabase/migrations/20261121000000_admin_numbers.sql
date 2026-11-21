-- Admin "Numbers" (/admin): how many members train, and whether they come back.
-- Read-only, admins only. Only members with an account are counted: plans kept on a phone
-- without an account never reach the database.
--
-- A "workout day" is a date a member ticked a day done or logged at least one set.
-- Plan days are stored by index from the plan's start date (same rule as the leaderboard).

create or replace function public.admin_numbers()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  with members as (
    select u.id as user_id, u.created_at::date as joined,
           case when pf.data->>'startDate' ~ '^\d{4}-\d{2}-\d{2}$' then (pf.data->>'startDate')::date end as start_date,
           coalesce(pg.data, '{}'::jsonb) as progress,
           (pf.user_id is not null) as has_plan
    from auth.users u
    left join public.profiles pf on pf.user_id = u.id
    left join public.progress pg on pg.user_id = u.id
  ),
  workout_days as (
    select distinct m.user_id, m.start_date + d.key::int as day
    from members m
    cross join lateral jsonb_each(case when jsonb_typeof(m.progress->'done') = 'object' then m.progress->'done' else '{}'::jsonb end) d
    where m.start_date is not null and d.key ~ '^\d{1,4}$' and d.value = 'true'::jsonb
    union
    select m.user_id, m.start_date + day.key::int
    from members m
    cross join lateral jsonb_each(case when jsonb_typeof(m.progress->'lifts') = 'object' then m.progress->'lifts' else '{}'::jsonb end) ex
    cross join lateral jsonb_each(case when jsonb_typeof(ex.value) = 'object' then ex.value else '{}'::jsonb end) day
    cross join lateral jsonb_array_elements(case when jsonb_typeof(day.value) = 'array' then day.value else '[]'::jsonb end) s
    where m.start_date is not null and day.key ~ '^\d{1,4}$'
      and jsonb_typeof(s->'r') = 'number' and (s->>'r')::numeric > 0
  ),
  -- Ignore days in the future (a plan whose start date was moved back).
  wd as (select * from workout_days where day <= current_date),
  per_member as (
    select m.user_id, m.joined, m.has_plan,
           (select count(*) from wd where wd.user_id = m.user_id) as workouts,
           exists (select 1 from public.push_subscriptions ps where ps.user_id = m.user_id) as reminders
    from members m
  ),
  weeks as (
    select (date_trunc('week', current_date) - make_interval(weeks => g))::date as week_start
    from generate_series(0, 7) g
  ),
  -- Signed up in a given week: of those, how many trained in week 1, 2, 3, 4 after joining.
  cohorts as (
    select w.week_start,
           count(m.user_id) as joined,
           count(m.user_id) filter (where exists (select 1 from wd where wd.user_id = m.user_id and wd.day between m.joined and m.joined + 6)) as w1,
           count(m.user_id) filter (where exists (select 1 from wd where wd.user_id = m.user_id and wd.day between m.joined + 7 and m.joined + 13)) as w2,
           count(m.user_id) filter (where exists (select 1 from wd where wd.user_id = m.user_id and wd.day between m.joined + 14 and m.joined + 20)) as w3,
           count(m.user_id) filter (where exists (select 1 from wd where wd.user_id = m.user_id and wd.day between m.joined + 21 and m.joined + 27)) as w4
    from weeks w
    left join members m on m.joined >= w.week_start and m.joined < w.week_start + 7
    group by w.week_start
  )
  select jsonb_build_object(
    'today',       current_date,
    'trained_1d',  (select count(distinct user_id) from wd where day = current_date),
    'trained_7d',  (select count(distinct user_id) from wd where day > current_date - 7),
    'trained_30d', (select count(distinct user_id) from wd where day > current_date - 30),
    'opened_7d',   (select count(*) from public.progress where updated_at > now() - interval '7 days'),
    'members',     (select count(*) from members),
    'funnel', jsonb_build_object(
      'signed_up',  (select count(*) from per_member),
      'has_plan',   (select count(*) from per_member where has_plan),
      'trained_1',  (select count(*) from per_member where workouts >= 1),
      'trained_3',  (select count(*) from per_member where workouts >= 3),
      'trained_10', (select count(*) from per_member where workouts >= 10),
      'reminders',  (select count(*) from per_member where reminders)
    ),
    -- Came back: of members who joined 14+ days ago, how many trained in their second week.
    'came_back', jsonb_build_object(
      'eligible', (select count(*) from members where joined <= current_date - 14),
      'returned', (select count(*) from members m where m.joined <= current_date - 14
                     and exists (select 1 from wd where wd.user_id = m.user_id and wd.day between m.joined + 7 and m.joined + 13))
    ),
    'weekly', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'week', w.week_start,
        'signups', (select count(*) from members m where m.joined >= w.week_start and m.joined < w.week_start + 7),
        'trained', (select count(distinct user_id) from wd where wd.day >= w.week_start and wd.day < w.week_start + 7),
        'workouts', (select count(*) from wd where wd.day >= w.week_start and wd.day < w.week_start + 7),
        'posts', (select count(*) from public.posts p where p.created_at >= w.week_start and p.created_at < w.week_start + 7),
        'feedback', (select count(*) from public.feedback f where f.created_at >= w.week_start and f.created_at < w.week_start + 7)
      ) order by w.week_start), '[]'::jsonb)
      from weeks w
    ),
    'cohorts', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'week', c.week_start, 'joined', c.joined, 'w1', c.w1, 'w2', c.w2, 'w3', c.w3, 'w4', c.w4,
        'age_days', current_date - c.week_start
      ) order by c.week_start desc), '[]'::jsonb)
      from cohorts c
    )
  ) into result;

  return result;
end;
$$;

revoke execute on function public.admin_numbers() from public, anon;
grant execute on function public.admin_numbers() to authenticated;
