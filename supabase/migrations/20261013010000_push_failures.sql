-- Counts failed reminder pushes in a row per device. send-reminders removes a device after 3,
-- so subscriptions that stop working (e.g. made with an old VAPID key) clean themselves up.
alter table public.push_subscriptions add column if not exists failures integer not null default 0;
