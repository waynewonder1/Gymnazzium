-- Runs the send-reminders Edge Function every 5 minutes.
-- Run this in the Supabase SQL editor after deploying the function (safe to run again after a redeploy).
-- Replace the two placeholders first:
--   <PROJECT_REF>  your project ref (from the project URL: https://<PROJECT_REF>.supabase.co)
--   <CRON_SECRET>  the same value you set with: supabase secrets set CRON_SECRET=...

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Keep the secret out of the job text by storing it in Vault (replacing the old one on a redeploy).
do $do$
declare
  existing uuid := (select id from vault.secrets where name = 'reminders_cron_secret');
begin
  if existing is null then
    perform vault.create_secret('<CRON_SECRET>', 'reminders_cron_secret');
  else
    perform vault.update_secret(existing, '<CRON_SECRET>');
  end if;
end
$do$;

select cron.schedule(
  'send-reminders',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'reminders_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Clean up old reminder log rows once a day.
select cron.schedule(
  'prune-reminder-log',
  '15 3 * * *',
  $$ delete from public.reminder_log where local_date < current_date - 7 $$
);
