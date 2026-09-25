-- Gymnazzium schema. Run in the Supabase SQL editor (or `supabase db push`).
-- Every table has row-level security: members can only see and change their own rows.

-- ---------- Plans ----------
-- The registration answers, stored as JSON so new form fields don't need a migration.
create table if not exists public.profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- Ticked exercises, completed days and missions.
create table if not exists public.progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{"done":{},"checks":{},"missions":{}}',
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.progress enable row level security;

create policy "own profile" on public.profiles
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own progress" on public.progress
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Push notifications ----------
-- One row per device/browser a member turned reminders on for.
create table if not exists public.push_subscriptions (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy "own subscriptions" on public.push_subscriptions
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Which days a reminder was already sent (written only by the send-reminders function).
create table if not exists public.reminder_log (
  user_id    uuid not null references auth.users (id) on delete cascade,
  local_date date not null,
  sent_at    timestamptz not null default now(),
  primary key (user_id, local_date)
);

alter table public.reminder_log enable row level security;
-- No policies: only the service role (the Edge Function) can read or write it.

-- ---------- Shop orders ----------
create table if not exists public.orders (
  id            bigint generated always as identity primary key,
  -- Short code shown to the customer (made in the browser, since guests can't read rows back).
  reference     text not null unique check (reference ~ '^GZ-[A-Z0-9]{6}$'),
  user_id       uuid references auth.users (id) on delete set null default auth.uid(),
  customer_name text not null check (char_length(customer_name) between 1 and 120),
  phone         text not null check (char_length(phone) between 7 and 20),
  location      text not null check (char_length(location) between 1 and 200),
  items         jsonb not null,
  total         integer not null check (total >= 0),
  status        text not null default 'new' check (status in ('new', 'confirmed', 'paid', 'delivered', 'cancelled')),
  created_at    timestamptz not null default now()
);

alter table public.orders enable row level security;

-- Anyone can place an order (guests too); signed-in members' orders are linked to them.
create policy "place order" on public.orders
  for insert to anon, authenticated
  with check (status = 'new' and (user_id is null or user_id = auth.uid()));

create policy "see own orders" on public.orders
  for select to authenticated
  using (user_id = auth.uid());
