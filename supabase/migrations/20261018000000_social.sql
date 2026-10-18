-- Community feed (v1): opt-in community profiles, free following, automatic posts
-- (workouts, runs, badges) seen by followers, and kudos. Run in the Supabase SQL editor.

-- A member joins the community under a display name. Only members can post, follow or be found.
create table if not exists public.community_profiles (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (display_name = btrim(display_name) and char_length(display_name) between 2 and 24),
  created_at   timestamptz not null default now()
);
create unique index if not exists community_profiles_name_key on public.community_profiles (lower(display_name));
alter table public.community_profiles enable row level security;

create policy "community members can see each other" on public.community_profiles
  for select to authenticated using (true);
create policy "own community profile" on public.community_profiles
  for insert to authenticated with check (user_id = auth.uid());
create policy "rename own community profile" on public.community_profiles
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "leave the community" on public.community_profiles
  for delete to authenticated using (user_id = auth.uid());

-- Following is free (no requests), like Strava.
create table if not exists public.follows (
  follower   uuid not null references public.community_profiles (user_id) on delete cascade,
  followee   uuid not null references public.community_profiles (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower, followee),
  check (follower <> followee)
);
create index if not exists follows_followee_idx on public.follows (followee);
alter table public.follows enable row level security;

create policy "see own follows and followers" on public.follows
  for select to authenticated using (follower = auth.uid() or followee = auth.uid());
create policy "follow someone" on public.follows
  for insert to authenticated with check (follower = auth.uid());
create policy "unfollow" on public.follows
  for delete to authenticated using (follower = auth.uid());

-- Posts are created by the app when a member finishes a workout, logs a run or earns a badge.
-- ref identifies the thing posted (e.g. "day:23" or a badge key) so it's posted only once.
create table if not exists public.posts (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.community_profiles (user_id) on delete cascade,
  kind       text not null check (kind in ('workout', 'run', 'badge')),
  ref        text not null check (char_length(ref) <= 80),
  data       jsonb not null default '{}' check (pg_column_size(data) < 4000),
  created_at timestamptz not null default now(),
  unique (user_id, kind, ref)
);
create index if not exists posts_user_created_idx on public.posts (user_id, created_at desc);
alter table public.posts enable row level security;

create policy "see own posts and posts of people you follow" on public.posts
  for select to authenticated
  using (user_id = auth.uid() or exists (select 1 from public.follows f where f.follower = auth.uid() and f.followee = posts.user_id));
create policy "post as yourself" on public.posts
  for insert to authenticated with check (user_id = auth.uid());
create policy "update own posts" on public.posts
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own posts" on public.posts
  for delete to authenticated using (user_id = auth.uid());

-- Kudos: one per member per post, on posts you can see (not your own).
create table if not exists public.kudos (
  post_id    bigint not null references public.posts (id) on delete cascade,
  user_id    uuid not null references public.community_profiles (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.kudos enable row level security;

create policy "see kudos on posts you can see" on public.kudos
  for select to authenticated using (exists (select 1 from public.posts p where p.id = kudos.post_id));
create policy "give kudos" on public.kudos
  for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.posts p where p.id = kudos.post_id and p.user_id <> auth.uid()));
create policy "take back kudos" on public.kudos
  for delete to authenticated using (user_id = auth.uid());

-- The feed: your posts and those of people you follow, newest first, with names and kudos.
create or replace function public.feed(p_before timestamptz default null, p_limit int default 30)
returns table (id bigint, user_id uuid, display_name text, kind text, ref text, data jsonb, created_at timestamptz, kudos bigint, kudoed boolean, kudos_names text[])
language sql stable security definer set search_path = ''
as $$
  select p.id, p.user_id, cp.display_name, p.kind, p.ref, p.data, p.created_at,
         (select count(*) from public.kudos k where k.post_id = p.id),
         exists (select 1 from public.kudos k where k.post_id = p.id and k.user_id = auth.uid()),
         array(select c2.display_name from public.kudos k join public.community_profiles c2 on c2.user_id = k.user_id
               where k.post_id = p.id order by k.created_at desc limit 5)
  from public.posts p
  join public.community_profiles cp on cp.user_id = p.user_id
  where (p.user_id = auth.uid() or exists (select 1 from public.follows f where f.follower = auth.uid() and f.followee = p.user_id))
    and (p_before is null or p.created_at < p_before)
  order by p.created_at desc
  limit least(greatest(coalesce(p_limit, 30), 1), 50);
$$;
revoke execute on function public.feed(timestamptz, int) from public, anon;
grant execute on function public.feed(timestamptz, int) to authenticated;

-- Follower / following counts for a community member.
create or replace function public.follow_counts(p_user uuid)
returns table (followers bigint, following bigint)
language sql stable security definer set search_path = ''
as $$
  select (select count(*) from public.follows where followee = p_user),
         (select count(*) from public.follows where follower = p_user);
$$;
revoke execute on function public.follow_counts(uuid) from public, anon;
grant execute on function public.follow_counts(uuid) to authenticated;
