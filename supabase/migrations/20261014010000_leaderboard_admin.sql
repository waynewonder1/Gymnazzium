-- Lets Gymnazzium admins see who's on the leaderboard and remove a member (e.g. for a rude display name).
-- Members keep full control of their own row through the "own leaderboard entry" policy.
create policy "admins see leaderboard" on public.leaderboard_members
  for select to authenticated
  using (public.is_admin());

create policy "admins remove from leaderboard" on public.leaderboard_members
  for delete to authenticated
  using (public.is_admin());
