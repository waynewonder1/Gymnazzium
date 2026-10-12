-- Monthly leaderboard (opt-in). Run in the Supabase SQL editor after the earlier migrations.
-- Members choose to appear under a display name. leaderboard() returns only display names
-- and monthly totals for those members, never plans, emails or anyone who hasn't joined.

create table if not exists public.leaderboard_members (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (display_name = btrim(display_name) and char_length(display_name) between 2 and 24),
  joined_at    timestamptz not null default now()
);

-- One person per name (ignoring case), so nobody can pose as someone else on the board.
create unique index if not exists leaderboard_members_name_key on public.leaderboard_members (lower(display_name));

alter table public.leaderboard_members enable row level security;

create policy "own leaderboard entry" on public.leaderboard_members
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Workouts done and sets logged in the calendar month containing p_month.
-- Plan days are stored by index from the plan's start date (progress.done / progress.lifts).
create or replace function public.leaderboard(p_month date default current_date)
returns table (rank bigint, display_name text, workouts bigint, sets bigint, badges bigint, is_me boolean)
language sql stable security definer set search_path = ''
as $$
  with bounds as (
    select date_trunc('month', p_month)::date as first_day,
           (date_trunc('month', p_month) + interval '1 month')::date as next_month
  ),
  members as (
    select l.user_id, l.display_name, coalesce(pg.data, '{}'::jsonb) as progress,
           case when pf.data->>'startDate' ~ '^\d{4}-\d{2}-\d{2}$' then (pf.data->>'startDate')::date end as start_date
    from public.leaderboard_members l
    join public.profiles pf on pf.user_id = l.user_id
    left join public.progress pg on pg.user_id = l.user_id
  ),
  totals as (
    select
      m.user_id,
      m.display_name,
      (
        select count(*)
        from jsonb_each(case when jsonb_typeof(m.progress->'done') = 'object' then m.progress->'done' else '{}'::jsonb end) d
        where d.key ~ '^\d{1,4}$' and d.value = 'true'::jsonb
          and m.start_date + d.key::int >= b.first_day and m.start_date + d.key::int < b.next_month
      ) as workouts,
      (
        select count(*)
        from jsonb_each(case when jsonb_typeof(m.progress->'lifts') = 'object' then m.progress->'lifts' else '{}'::jsonb end) ex
        cross join lateral jsonb_each(case when jsonb_typeof(ex.value) = 'object' then ex.value else '{}'::jsonb end) day
        cross join lateral jsonb_array_elements(case when jsonb_typeof(day.value) = 'array' then day.value else '[]'::jsonb end) s
        where day.key ~ '^\d{1,4}$'
          and m.start_date + day.key::int >= b.first_day and m.start_date + day.key::int < b.next_month
          and jsonb_typeof(s->'r') = 'number' and (s->>'r')::numeric > 0
      ) as sets,
      (
        select count(*)
        from jsonb_object_keys(case when jsonb_typeof(m.progress->'badges') = 'object' then m.progress->'badges' else '{}'::jsonb end)
      ) as badges
    from members m
    cross join bounds b
    where m.start_date is not null
  ),
  ranked as (
    select rank() over (order by t.workouts desc, t.sets desc) as rank,
           t.display_name, t.workouts, t.sets, t.badges,
           t.user_id = auth.uid() as is_me
    from totals t
    where t.workouts > 0 or t.sets > 0 or t.user_id = auth.uid()
  )
  -- Top 50, plus the caller's own row wherever they are.
  select r.rank, r.display_name, r.workouts, r.sets, r.badges, r.is_me
  from ranked r
  where r.rank <= 50 or r.is_me
  order by r.rank, r.display_name;
$$;

revoke execute on function public.leaderboard(date) from public, anon;
grant execute on function public.leaderboard(date) to authenticated;
