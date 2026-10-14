-- Lets a signed-in member delete their own account (run in the Supabase SQL editor).
-- Deleting the auth user removes their profile, progress, push devices, reminder log,
-- leaderboard entry and admin row (all "on delete cascade"). Shop orders are kept for
-- the business's records, with user_id set to null so they're no longer linked to anyone.
create or replace function public.delete_my_account()
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
