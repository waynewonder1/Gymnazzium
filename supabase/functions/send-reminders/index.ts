// Sends each member's daily workout reminder as a web push notification.
// Called every 5 minutes by pg_cron (see supabase/cron.sql). Each member gets at most
// one push per day, at or after their workout time in their own time zone.
//
// Secrets (supabase secrets set ...): VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, CRON_SECRET
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { buildReminder } from './reminder.ts';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const vapid = {
  subject: Deno.env.get('VAPID_SUBJECT') ?? 'mailto:hello@gymnazzium.example',
  publicKey: Deno.env.get('VAPID_PUBLIC_KEY')!,
  privateKey: Deno.env.get('VAPID_PRIVATE_KEY')!,
};
const CRON_SECRET = Deno.env.get('CRON_SECRET');

type Subscription = { user_id: string; endpoint: string; p256dh: string; auth: string; failures: number };

// A device that rejects this many reminders in a row (e.g. it was subscribed with an old key) is removed.
const MAX_FAILURES = 3;

// Encrypt + sign with web-push, send with fetch (works reliably in the Edge runtime).
async function push(sub: Subscription, payload: string) {
  const request = webpush.generateRequestDetails(
    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
    payload,
    { vapidDetails: vapid, TTL: 6 * 60 * 60, urgency: 'high' },
  );
  const res = await fetch(request.endpoint, {
    method: request.method,
    headers: request.headers as Record<string, string>,
    body: request.body ? new Uint8Array(request.body) : undefined,
  });
  return res.status;
}

Deno.serve(async (req) => {
  if (!CRON_SECRET || req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return new Response('Forbidden', { status: 403 });
  }

  const { data: subs, error: subsError } = await supabase
    .from('push_subscriptions')
    .select('user_id, endpoint, p256dh, auth, failures');
  if (subsError) return Response.json({ error: subsError.message }, { status: 500 });

  const byUser = new Map<string, Subscription[]>();
  for (const s of subs ?? []) byUser.set(s.user_id, [...(byUser.get(s.user_id) ?? []), s]);
  const userIds = [...byUser.keys()];
  if (userIds.length === 0) return Response.json({ members: 0, sent: 0 });

  const [{ data: profiles }, { data: progressRows }] = await Promise.all([
    supabase.from('profiles').select('user_id, data').in('user_id', userIds),
    supabase.from('progress').select('user_id, data').in('user_id', userIds),
  ]);
  const progressByUser = new Map((progressRows ?? []).map((r) => [r.user_id, r.data]));

  const now = new Date();
  let sent = 0;
  let removed = 0;
  let failed = 0;

  for (const { user_id, data: profile } of profiles ?? []) {
    const reminder = buildReminder(profile, progressByUser.get(user_id) ?? null, now);
    if (!reminder) continue;

    // Claim today's slot first; if it already exists the reminder was sent on an earlier run.
    const { error: claimError } = await supabase
      .from('reminder_log')
      .insert({ user_id, local_date: reminder.localDate });
    if (claimError) continue;

    const payload = JSON.stringify(reminder.payload);
    for (const sub of byUser.get(user_id) ?? []) {
      try {
        const status = await push(sub, payload);
        if (status === 404 || status === 410) {
          // The browser unsubscribed or the subscription expired.
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          removed++;
        } else if (status >= 200 && status < 300) {
          sent++;
          if (sub.failures > 0) await supabase.from('push_subscriptions').update({ failures: 0 }).eq('endpoint', sub.endpoint);
        } else {
          failed++;
          // Push service errors (5xx) and rate limits (429) aren't the device's fault, so they don't count.
          if (status >= 400 && status < 500 && status !== 429) {
            if (sub.failures + 1 >= MAX_FAILURES) {
              await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
              removed++;
            } else {
              await supabase.from('push_subscriptions').update({ failures: sub.failures + 1 }).eq('endpoint', sub.endpoint);
            }
          }
        }
      } catch {
        failed++;
      }
    }
  }

  return Response.json({ members: userIds.length, sent, removed, failed });
});
