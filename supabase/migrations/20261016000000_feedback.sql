-- Feedback from the "Feedback" button. Anyone can send it (account or not); only admins can read
-- or delete it. Run in the Supabase SQL editor after the earlier migrations.
create table if not exists public.feedback (
  id         bigint generated always as identity primary key,
  user_id    uuid references auth.users (id) on delete set null default auth.uid(),
  rating     smallint check (rating between 1 and 5),
  message    text not null check (char_length(btrim(message)) between 1 and 2000),
  contact    text check (char_length(contact) <= 120),
  page       text check (char_length(page) <= 200),
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

create policy "send feedback" on public.feedback
  for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

create policy "admins read feedback" on public.feedback
  for select to authenticated
  using (public.is_admin());

create policy "admins delete feedback" on public.feedback
  for delete to authenticated
  using (public.is_admin());
