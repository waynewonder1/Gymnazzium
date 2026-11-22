// Paystack calls this when a payment goes through, for Premium or a merch pre-order. Set the URL in the Paystack dashboard:
// Settings → API Keys & Webhooks → Webhook URL = https://<ref>.supabase.co/functions/v1/paystack-webhook
// The request is trusted only if its x-paystack-signature matches our secret key.
//
// Secrets: PAYSTACK_SECRET_KEY. Deploy WITHOUT JWT check (Paystack has no Supabase login):
//   npx supabase functions deploy paystack-webhook --project-ref <ref> --no-verify-jwt
import { createClient } from 'npm:@supabase/supabase-js@2';
import { chargeToApply, paymentKind, validSignature } from '../_shared/lib/premium.js';

const SECRET = Deno.env.get('PAYSTACK_SECRET_KEY');
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 });
  const raw = await req.text();
  if (!(await validSignature(raw, req.headers.get('x-paystack-signature'), SECRET))) {
    return new Response('bad signature', { status: 401 });
  }

  let event: { event?: string; data?: unknown };
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response('bad body', { status: 400 });
  }

  if (event.event === 'charge.success') {
    const charge = chargeToApply(event.data as Record<string, unknown>);
    if (charge) {
      // Premium or a merch pre-order. Applies once; a repeat or a wrong amount changes nothing.
      const fn = paymentKind(charge.reference) === 'order' ? 'apply_order_payment' : 'apply_payment';
      const { error } = await admin.rpc(fn, { p_reference: charge.reference, p_amount: charge.amount, p_currency: charge.currency, p_channel: charge.channel, p_paid_at: charge.paidAt });
      if (error) {
        console.error(error);
        return new Response('retry', { status: 500 }); // Paystack retries later
      }
    }
  }
  // Every other event (and charges that aren't ours) is acknowledged and ignored.
  return new Response('ok', { status: 200 });
});
