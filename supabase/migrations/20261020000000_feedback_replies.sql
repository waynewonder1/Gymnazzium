-- Replies to feedback: admins write a reply; a member who sent feedback while logged in
-- sees it in the app once, then it's marked as seen. Run in the Supabase SQL editor.
alter table public.feedback
  add column if not exists reply text check (char_length(reply) <= 1000),
  add column if not exists replied_at timestamptz,
  add column if not exists reply_seen_at timestamptz;

-- Admins can write the reply columns only (never change what the member wrote).
revoke update on public.feedback from anon, authenticated;
grant update (reply, replied_at) on public.feedback to authenticated;
create policy "admins reply to feedback" on public.feedback
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Members can read their own feedback (to see replies).
create policy "see own feedback" on public.feedback
  for select to authenticated
  using (user_id = auth.uid());

-- Members mark a reply as seen through this function, so they can't edit anything else.
create or replace function public.mark_feedback_reply_seen(p_id bigint)
returns void
language sql security definer set search_path = ''
as $$
  update public.feedback set reply_seen_at = now()
  where id = p_id and user_id = auth.uid() and reply is not null;
$$;
revoke execute on function public.mark_feedback_reply_seen(bigint) from public, anon;
grant execute on function public.mark_feedback_reply_seen(bigint) to authenticated;
