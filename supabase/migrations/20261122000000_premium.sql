-- Premium (paid plan) via Paystack: M-Pesa or card, prepaid by the month or year.
-- M-Pesa can't be charged automatically, so Premium runs until a date and each payment extends it.
--
-- Members can only READ their own rows. Only the Edge Functions (service role) write, and only
-- after Paystack confirms a payment (signed webhook, or a server-side verify call).

-- One row per checkout started. amount is in the currency's smallest unit (KES cents), as Paystack uses.
create table if not exists public.payments (
  reference  text primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  plan       text not null,
  days       int  not null check (days > 0),
  amount     int  not null check (amount > 0),
  currency   text not null default 'KES',
  status     text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  channel    text,
  created_at timestamptz not null default now(),
  paid_at    timestamptz
);
create index if not exists payments_user_idx on public.payments (user_id, created_at desc);

-- Who has Premium, and until when.
create table if not exists public.subscriptions (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  plan          text not null,
  premium_until timestamptz not null,
  updated_at    timestamptz not null default now()
);

alter table public.payments enable row level security;
alter table public.subscriptions enable row level security;

create policy "see own payments" on public.payments
  for select to authenticated using (user_id = auth.uid());
create policy "see own subscription" on public.subscriptions
  for select to authenticated using (user_id = auth.uid());
create policy "admins see payments" on public.payments
  for select to authenticated using (public.is_admin());
create policy "admins see subscriptions" on public.subscriptions
  for select to authenticated using (public.is_admin());

-- Members can't write either table themselves.
revoke insert, update, delete on public.payments, public.subscriptions from anon, authenticated;

-- Marks a payment paid and extends Premium, exactly once per payment (safe if the webhook and the
-- verify call arrive together). Returns the new premium_until, or null if it was already applied
-- or doesn't match. Paystack's amount and currency must equal what the checkout asked for.
create or replace function public.apply_payment(p_reference text, p_amount int, p_currency text, p_channel text, p_paid_at timestamptz)
returns timestamptz
language plpgsql security definer set search_path = ''
as $$
declare
  pay public.payments;
  until timestamptz;
begin
  update public.payments
     set status = 'success', channel = p_channel, paid_at = coalesce(p_paid_at, now())
   where reference = p_reference and status = 'pending' and amount = p_amount and currency = p_currency
  returning * into pay;
  if not found then
    return null;
  end if;

  insert into public.subscriptions as s (user_id, plan, premium_until, updated_at)
  values (pay.user_id, pay.plan, now() + make_interval(days => pay.days), now())
  on conflict (user_id) do update
    set plan = excluded.plan,
        -- Paying early adds to the time left; paying after it ran out starts from now.
        premium_until = greatest(s.premium_until, now()) + make_interval(days => pay.days),
        updated_at = now()
  returning premium_until into until;
  return until;
end;
$$;

revoke execute on function public.apply_payment(text, int, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.apply_payment(text, int, text, text, timestamptz) to service_role;

-- For the app: is the signed-in member Premium right now?
create or replace function public.is_premium()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.subscriptions where user_id = auth.uid() and premium_until > now());
$$;

revoke execute on function public.is_premium() from public, anon;
grant execute on function public.is_premium() to authenticated;
