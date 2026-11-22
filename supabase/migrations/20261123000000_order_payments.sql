-- Merch pre-orders paid online (Paystack: M-Pesa or card).
-- Online orders are created by the merch-checkout Edge Function (service role) with the price
-- worked out on the server, and wait as 'pending_payment' until Paystack confirms the exact total.
-- "Reserve, pay later on WhatsApp" orders work as before ('new').

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending_payment', 'new', 'confirmed', 'paid', 'delivered', 'cancelled'));

alter table public.orders
  add column if not exists email              text check (email is null or char_length(email) <= 200),
  add column if not exists pay_method         text not null default 'whatsapp' check (pay_method in ('online', 'whatsapp')),
  add column if not exists paystack_reference text unique,
  add column if not exists payment_channel    text,
  add column if not exists paid_at            timestamptz;

-- Browsers can still only place WhatsApp reservations; they can't create online or paid orders.
drop policy if exists "place order" on public.orders;
create policy "place order" on public.orders
  for insert to anon, authenticated
  with check (status = 'new' and pay_method = 'whatsapp' and paystack_reference is null and paid_at is null
              and (user_id is null or user_id = auth.uid()));

-- Marks an online pre-order paid, once, only if Paystack's amount (cents) and currency match the
-- order total worked out on the server. Returns the order reference, or null.
create or replace function public.apply_order_payment(p_reference text, p_amount int, p_currency text, p_channel text, p_paid_at timestamptz)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  ref text;
begin
  update public.orders
     set status = 'paid', payment_channel = p_channel, paid_at = coalesce(p_paid_at, now())
   where paystack_reference = p_reference and status = 'pending_payment'
     and p_currency = 'KES' and total * 100 = p_amount
  returning reference into ref;
  return ref;
end;
$$;

revoke execute on function public.apply_order_payment(text, int, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.apply_order_payment(text, int, text, text, timestamptz) to service_role;
