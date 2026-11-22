// Push notification to every admin's phone (the devices they turned workout reminders on for),
// e.g. "New paid order". Never throws: a failed alert must not fail a payment.
// Uses the same VAPID secrets as send-reminders.
import webpush from 'npm:web-push@3.6.7';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

const vapid = {
  subject: Deno.env.get('VAPID_SUBJECT') ?? 'mailto:hello@gymnazzium.example',
  publicKey: Deno.env.get('VAPID_PUBLIC_KEY') ?? '',
  privateKey: Deno.env.get('VAPID_PRIVATE_KEY') ?? '',
};

export async function notifyAdmins(admin: SupabaseClient, message: { title: string; body: string; url: string; tag?: string }) {
  try {
    if (!vapid.publicKey || !vapid.privateKey) return;
    const { data: admins } = await admin.from('admins').select('user_id');
    const ids = (admins ?? []).map((a) => a.user_id);
    if (!ids.length) return;
    const { data: subs } = await admin.from('push_subscriptions').select('endpoint, p256dh, auth').in('user_id', ids);
    const payload = JSON.stringify(message);
    await Promise.all(
      (subs ?? []).map(async (sub) => {
        try {
          const request = webpush.generateRequestDetails(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
            { vapidDetails: vapid, TTL: 24 * 60 * 60, urgency: 'high' },
          );
          await fetch(request.endpoint, {
            method: request.method,
            headers: request.headers as Record<string, string>,
            body: request.body ? new Uint8Array(request.body) : undefined,
          });
        } catch (e) {
          console.error('admin push failed', e);
        }
      }),
    );
  } catch (e) {
    console.error('notifyAdmins', e);
  }
}

// "New paid order GZ-7K2M9Q" · "KES 2,400 · 2 × Gymnazzium training tee (M) · Brian, Kilimani"
export async function notifyPaidOrder(admin: SupabaseClient, orderReference: string) {
  const { data: o } = await admin.from('orders').select('reference, customer_name, location, items, total, payment_channel').eq('reference', orderReference).maybeSingle();
  if (!o) return;
  const what = (o.items ?? []).map((i: { qty: number; name: string; size?: string }) => `${i.qty} × ${i.name.replace(/ \(.*pre-order\)$/, '')}${i.size ? ` (${i.size})` : ''}`).join(', ');
  const how = o.payment_channel === 'mobile_money' ? 'M-Pesa' : o.payment_channel === 'card' ? 'card' : 'online';
  await notifyAdmins(admin, {
    title: `💰 New paid order ${o.reference}`,
    body: `KES ${Number(o.total).toLocaleString('en-KE')} by ${how} · ${what} · ${o.customer_name}, ${o.location}`,
    url: '/admin',
    tag: `order-${o.reference}`,
  });
}
