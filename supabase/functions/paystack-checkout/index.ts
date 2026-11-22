// Premium checkout with Paystack (M-Pesa or card). Called by the app with the member's login.
//   { action: 'start', plan: 'month' | 'year' } → { url }  (open Paystack's checkout page)
//   { action: 'verify', reference }             → { premium_until | null }  (after coming back)
//
// Secrets (supabase secrets set ...): PAYSTACK_SECRET_KEY (sk_test_… while testing), APP_URL
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided automatically.
// Deploy: npx supabase functions deploy paystack-checkout --project-ref <ref>
import { createClient } from 'npm:@supabase/supabase-js@2';
import { CURRENCY, PLANS, chargeToApply, newReference, toSubunits } from '../_shared/lib/premium.js';

const SECRET = Deno.env.get('PAYSTACK_SECRET_KEY');
const APP_URL = Deno.env.get('APP_URL') ?? 'https://gymnazzium.vercel.app';
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

async function paystack(path: string, init: RequestInit = {}) {
  const res = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${SECRET}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.status !== true) throw new Error(json.message ?? `Paystack error ${res.status}`);
  return json.data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return reply({ error: 'POST only' }, 405);
  if (!SECRET) return reply({ error: 'Payments are not set up yet.' }, 503);

  // Who is paying: the member's own login token.
  const asMember = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: { user } } = await asMember.auth.getUser();
  if (!user?.email) return reply({ error: 'Log in first.' }, 401);

  const body = await req.json().catch(() => ({}));
  try {
    if (body.action === 'start') {
      const plan = PLANS[body.plan as keyof typeof PLANS];
      if (!plan) return reply({ error: 'Unknown plan.' }, 400);
      const reference = newReference(user.id);
      const amount = toSubunits(plan.price);
      // Record the checkout first: apply_payment later only accepts exactly this amount.
      const { error } = await admin.from('payments').insert({ reference, user_id: user.id, plan: plan.id, days: plan.days, amount, currency: CURRENCY });
      if (error) throw new Error(error.message);
      const tx = await paystack('/transaction/initialize', {
        method: 'POST',
        body: JSON.stringify({
          email: user.email,
          amount,
          currency: CURRENCY,
          reference,
          channels: ['mobile_money', 'card'],
          callback_url: `${APP_URL}/premium?reference=${encodeURIComponent(reference)}`,
          metadata: { plan: plan.id, user_id: user.id },
        }),
      });
      return reply({ url: tx.authorization_url, reference });
    }

    if (body.action === 'verify') {
      const reference = String(body.reference ?? '');
      // Only the member's own checkout can be verified from their login.
      const { data: pay } = await admin.from('payments').select('user_id, status').eq('reference', reference).maybeSingle();
      if (!pay || pay.user_id !== user.id) return reply({ error: 'Payment not found.' }, 404);
      if (pay.status === 'pending') {
        const charge = chargeToApply(await paystack(`/transaction/verify/${encodeURIComponent(reference)}`));
        if (charge) {
          const { error } = await admin.rpc('apply_payment', { p_reference: charge.reference, p_amount: charge.amount, p_currency: charge.currency, p_channel: charge.channel, p_paid_at: charge.paidAt });
          if (error) throw new Error(error.message);
        }
      }
      const { data: sub } = await admin.from('subscriptions').select('premium_until').eq('user_id', user.id).maybeSingle();
      const { data: after } = await admin.from('payments').select('status').eq('reference', reference).maybeSingle();
      return reply({ status: after?.status ?? 'pending', premium_until: sub?.premium_until ?? null });
    }

    return reply({ error: 'Unknown action.' }, 400);
  } catch (e) {
    console.error(e);
    return reply({ error: 'Payment service error. Please try again.' }, 502);
  }
});
