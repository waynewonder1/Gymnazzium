-- Admin view (/admin): lets listed admins see every order, change an order's status,
-- and read member statistics. Everyone else's access is unchanged.
--
-- To make someone an admin, run (with their sign-up email):
--   insert into public.admins (user_id) select id from auth.users where email = 'you@example.com';

create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Members can only check whether they themselves are an admin.
create policy "see own admin row" on public.admins
  for select to authenticated
  using (user_id = auth.uid());

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---------- Orders ----------
create policy "admins see all orders" on public.orders
  for select to authenticated
  using (public.is_admin());

create policy "admins update orders" on public.orders
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Only the status column can ever be changed after an order is placed.
revoke update on public.orders from anon, authenticated;
grant update (status) on public.orders to authenticated;

-- ---------- Member statistics ----------
create or replace function public.admin_stats()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'members',      (select count(*) from auth.users),
    'members_7d',   (select count(*) from auth.users where created_at > now() - interval '7 days'),
    'with_plan',    (select count(*) from public.profiles),
    'active_7d',    (select count(*) from public.progress where updated_at > now() - interval '7 days'),
    'push_devices', (select count(*) from public.push_subscriptions),
    'paths', (
      select coalesce(jsonb_object_agg(path, n), '{}'::jsonb)
      from (
        select coalesce(data->>'lookingFor', 'Unknown') as path, count(*) as n
        from public.profiles group by 1
      ) t
    ),
    'recent', (
      select coalesce(jsonb_agg(r order by r.created_at desc), '[]'::jsonb)
      from (
        select u.email, u.created_at, p.data->>'lookingFor' as path, (p.user_id is not null) as has_plan
        from auth.users u
        left join public.profiles p on p.user_id = u.id
        order by u.created_at desc
        limit 10
      ) r
    )
  );
end;
$$;

revoke execute on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated;
