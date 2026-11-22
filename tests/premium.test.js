import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { PLANS, chargeToApply, formatKES, newReference, premiumStatus, toSubunits, validSignature } from '../src/lib/premium.js';

const SECRET = 'sk_test_not_a_real_key';
// Exactly how Paystack signs a webhook: HMAC-SHA512 of the raw body, hex.
const sign = (body, secret = SECRET) => createHmac('sha512', secret).update(body).digest('hex');

describe('Paystack webhook signature', () => {
  const body = JSON.stringify({ event: 'charge.success', data: { reference: 'gz-1', amount: 40000 } });

  test('a correctly signed webhook is accepted', async () => {
    assert.equal(await validSignature(body, sign(body), SECRET), true);
  });

  test('a changed body, a wrong key, or no signature is rejected', async () => {
    assert.equal(await validSignature(body.replace('40000', '4000000'), sign(body), SECRET), false);
    assert.equal(await validSignature(body, sign(body, 'sk_test_someone_else'), SECRET), false);
    assert.equal(await validSignature(body, null, SECRET), false);
    assert.equal(await validSignature(body, sign(body), undefined), false, 'no secret configured → never trusted');
    assert.equal(await validSignature(body, 'abc', SECRET), false);
  });
});

describe('which charges can switch Premium on', () => {
  const ok = { status: 'success', currency: 'KES', reference: 'gz-abc-1', amount: 40000, channel: 'mobile_money', paid_at: '2026-11-22T10:00:00Z' };

  test('a successful KES charge for one of our references', () => {
    assert.deepEqual(chargeToApply(ok), { reference: 'gz-abc-1', amount: 40000, currency: 'KES', channel: 'mobile_money', paidAt: '2026-11-22T10:00:00Z' });
  });

  test('failed or abandoned charges, other currencies, other references and odd amounts are ignored', () => {
    assert.equal(chargeToApply({ ...ok, status: 'failed' }), null);
    assert.equal(chargeToApply({ ...ok, status: 'abandoned' }), null);
    assert.equal(chargeToApply({ ...ok, currency: 'NGN' }), null);
    assert.equal(chargeToApply({ ...ok, reference: 'someone-elses-ref' }), null);
    assert.equal(chargeToApply({ ...ok, amount: '40000' }), null);
    assert.equal(chargeToApply({ ...ok, amount: 0 }), null);
    assert.equal(chargeToApply(null), null);
  });
});

describe('plans and status', () => {
  test('prices are whole shillings, sent to Paystack in cents', () => {
    for (const p of Object.values(PLANS)) {
      assert.ok(Number.isInteger(p.price) && p.price > 0 && p.days > 0, p.id);
      assert.equal(toSubunits(p.price), p.price * 100);
    }
    assert.equal(formatKES(3600), 'KES 3,600');
  });

  test('references are ours and unguessable', () => {
    const a = newReference('1234abcd-0000-0000-0000-000000000000');
    const b = newReference('1234abcd-0000-0000-0000-000000000000');
    assert.match(a, /^gz-1234abcd-[0-9a-z]+-[0-9a-f]{12}$/);
    assert.notEqual(a, b);
  });

  test('Premium is active until its end date, with days left rounded up', () => {
    const now = new Date('2026-11-22T12:00:00Z');
    assert.deepEqual(premiumStatus(null, now), { active: false, daysLeft: 0, until: null });
    const s = premiumStatus({ premium_until: '2026-12-22T12:00:00Z' }, now);
    assert.equal(s.active, true);
    assert.equal(s.daysLeft, 30);
    assert.equal(premiumStatus({ premium_until: '2026-11-22T18:00:00Z' }, now).daysLeft, 1);
    assert.equal(premiumStatus({ premium_until: '2026-11-21T12:00:00Z' }, now).active, false);
  });
});
