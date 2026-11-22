// Merch pre-orders paid online with Paystack (M-Pesa or card). Guests can buy too.
//   { action: 'start', items: [{ id, size, qty }], name, phone, location, email } → { url }
//   { action: 'verify', reference }  → { status, order, total }   (after Paystack sends them back)
//
// The price is worked out HERE from the drop's price list (_shared/data/shop.js), never taken
// from the browser. The order waits as 'pending_payment' until Paystack confirms that exact total.
//
// Secrets: PAYSTACK_SECRET_KEY, APP_URL. Deploy: npx supabase functions deploy merch-checkout --project-ref <ref>
import { createClient } from 'npm:@supabase/supabase-js@2';
import { drop, dropOpen } from '../_shared/data/shop.js';
import { contactError, makeReference, priceDropOrder } from '../_shared/lib/orders.js';
import { CURRENCY, chargeToApply, toSubunits } from '../_shared/lib/premium.js';

const SECRET = Deno.env.get('PAYSTACK_SECRET_KEY');
const APP_URL = Deno.env.get('APP_URL') ?? 'https://gymnazzium.vercel.app';
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// Where to send the buyer back after paying: the site they came from, if it's one of ours
// (the live site, a Vercel preview of this project, or a local copy while testing).
function returnOrigin(req: Request) {
  const origin = req.headers.get('Origin') ?? '';
  const ours = origin === APP_URL || /^http:\/\/localhost:\d+$/.test(origin) || /^https:\/\/gymnazzium-[a-z0-9-]+\.vercel\.app$/.test(origin);
  return ours ? origin : APP_URL;
}

async function paystack(path: string, init: RequestInit = {}) {
  const res = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${SECRET}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.status !== true) throw new Error(json.message ?? `Paystack error ${res.status}`);
  return json.data;
}

const randomHex = (n: number) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, '0')).join('');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return reply({ error: 'POST only' }, 405);
  if (!SECRET) return reply({ error: 'Online payment is not set up yet. Please reserve and pay on WhatsApp.' }, 503);

  const body = await req.json().catch(() => ({}));
  try {
    if (body.action === 'start') {
      if (!dropOpen()) return reply({ error: `Pre-orders for ${drop.name} are closed.` }, 400);
      const priced = priceDropOrder(drop, body.items);
      if (priced.error) return reply({ error: priced.error }, 400);
      const problem = contactError(body, true);
      if (problem) return reply({ error: problem }, 400);

      // Members' orders are linked to their account (optional).
      const asMember = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
      });
      const { data: { user } } = await asMember.auth.getUser().catch(() => ({ data: { user: null } }));

      const reference = makeReference();
      const paystackReference = `${reference}-${randomHex(4)}`;
      const { error } = await admin.from('orders').insert({
        reference,
        user_id: user?.id ?? null,
        customer_name: String(body.name).trim(),
        phone: String(body.phone).trim(),
        location: String(body.location).trim(),
        email: String(body.email).trim().toLowerCase(),
        items: priced.lines,
        total: priced.total,
        status: 'pending_payment',
        pay_method: 'online',
        paystack_reference: paystackReference,
      });
      if (error) throw new Error(error.message);

      const tx = await paystack('/transaction/initialize', {
        method: 'POST',
        body: JSON.stringify({
          email: String(body.email).trim(),
          amount: toSubunits(priced.total),
          currency: CURRENCY,
          reference: paystackReference,
          channels: ['mobile_money', 'card'],
          callback_url: `${returnOrigin(req)}/shop?order=${encodeURIComponent(paystackReference)}`,
          metadata: { order: reference, drop: drop.name },
        }),
      });
      return reply({ url: tx.authorization_url, order: reference });
    }

    if (body.action === 'verify') {
      const reference = String(body.reference ?? '');
      const { data: order } = await admin.from('orders').select('reference, total, status').eq('paystack_reference', reference).maybeSingle();
      if (!order) return reply({ error: 'Order not found.' }, 404);
      if (order.status === 'pending_payment') {
        const charge = chargeToApply(await paystack(`/transaction/verify/${encodeURIComponent(reference)}`));
        if (charge) {
          const { error } = await admin.rpc('apply_order_payment', { p_reference: charge.reference, p_amount: charge.amount, p_currency: charge.currency, p_channel: charge.channel, p_paid_at: charge.paidAt });
          if (error) throw new Error(error.message);
        }
      }
      const { data: after } = await admin.from('orders').select('status').eq('paystack_reference', reference).maybeSingle();
      // No personal details here: only the order code, total and whether it's paid.
      return reply({ status: after?.status === 'pending_payment' ? 'pending' : 'paid', order: order.reference, total: order.total });
    }

    return reply({ error: 'Unknown action.' }, 400);
  } catch (e) {
    console.error(e);
    return reply({ error: 'Payment service error. Please try again, or reserve and pay on WhatsApp.' }, 502);
  }
});
