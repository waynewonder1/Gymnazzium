// Premium: prices and the checks around Paystack payments. No React, no network, so the same file
// runs in the app and (copied by `npm run functions:sync`) in the paystack Edge Functions.
//
// PRICES ARE PLACEHOLDERS until the founders decide. Change them here only, then run
// `npm run functions:sync` and redeploy the paystack functions.

export const CURRENCY = 'KES';

export const PLANS = {
  month: { id: 'month', label: '1 month', days: 30, price: 400 },
  year: { id: 'year', label: '12 months', days: 365, price: 3600, note: 'Save KES 1,200' },
};

// Paystack amounts are in the smallest unit (KES 400 → 40000).
export const toSubunits = (kes) => Math.round(kes * 100);

export const formatKES = (kes) => `KES ${Number(kes).toLocaleString('en-KE')}`;

// What Premium includes. "soon" items aren't built yet; the page says so honestly.
export const PREMIUM_FEATURES = [
  { icon: '📊', title: 'Weekly calorie check-in', text: 'Your calorie target adjusts every week from your real weight trend and what you eat.', soon: true },
  { icon: '🍽️', title: 'Kenyan meal plans', text: 'A 7-day meal plan for your goal, with a shopping list in KES.', soon: true },
  { icon: '📷', title: 'Snap my meal', text: 'Log a meal from a photo or by describing it.', soon: true },
  { icon: '📈', title: 'Deeper stats', text: 'Strength trends, body weight trend and monthly reports.', soon: true },
];

// A reference no one can guess, unique per checkout.
export function newReference(userId, now = Date.now()) {
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => b.toString(16).padStart(2, '0')).join('');
  return `gz-${userId.slice(0, 8)}-${now.toString(36)}-${rand}`;
}

// Paystack signs each webhook: HMAC-SHA512 of the raw body with the secret key, as hex,
// in the x-paystack-signature header. Compared in constant time.
export async function validSignature(rawBody, signature, secretKey) {
  if (!signature || !secretKey) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secretKey), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody)));
  const expected = Array.from(mac, (b) => b.toString(16).padStart(2, '0')).join('');
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

// A Paystack transaction (from verify or a charge.success webhook) that may switch Premium on.
// The database also checks amount and currency against the checkout (apply_payment), this is
// the first gate: only successful charges, in our currency, for one of our references.
export function chargeToApply(tx) {
  if (!tx || tx.status !== 'success' || tx.currency !== CURRENCY) return null;
  if (typeof tx.reference !== 'string' || !tx.reference.startsWith('gz-')) return null;
  if (!Number.isInteger(tx.amount) || tx.amount <= 0) return null;
  return { reference: tx.reference, amount: tx.amount, currency: tx.currency, channel: tx.channel ?? null, paidAt: tx.paid_at ?? tx.paidAt ?? null };
}

// For the app: is Premium on, and how many days are left?
export function premiumStatus(subscription, now = new Date()) {
  if (!subscription?.premium_until) return { active: false, daysLeft: 0, until: null };
  const until = new Date(subscription.premium_until);
  const daysLeft = Math.max(0, Math.ceil((until - now) / 86400000));
  return { active: until > now, daysLeft, until };
}
