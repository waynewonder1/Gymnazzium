import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { drop } from '../src/data/shop.js';
import { contactError, makeReference, priceDropOrder } from '../src/lib/orders.js';
import { chargeToApply, paymentKind } from '../src/lib/premium.js';

const tee = drop.items.find((i) => i.id === 'drop01-tee');
const vest = drop.items.find((i) => i.id === 'drop01-vest');

describe('pricing a pre-order on the server', () => {
  test('the total comes from the drop price list, not from the buyer', () => {
    const { lines, total } = priceDropOrder(drop, [
      { id: tee.id, size: 'M', qty: 2, price: 1 }, // a tampered price is ignored
      { id: vest.id, size: 'XL', qty: 1 },
    ]);
    assert.equal(total, tee.price * 2 + vest.price);
    assert.deepEqual(lines.map((l) => [l.id, l.size, l.qty, l.price]), [[tee.id, 'M', 2, tee.price], [vest.id, 'XL', 1, vest.price]]);
    assert.match(lines[0].name, /pre-order/);
  });

  test('unknown items, missing sizes and silly quantities are refused', () => {
    assert.ok(priceDropOrder(drop, []).error);
    assert.ok(priceDropOrder(drop, null).error);
    assert.ok(priceDropOrder(drop, [{ id: 'free-hoodie', size: 'M', qty: 1 }]).error);
    assert.ok(priceDropOrder(drop, [{ id: tee.id, size: '', qty: 1 }]).error);
    assert.ok(priceDropOrder(drop, [{ id: tee.id, size: 'XXXL', qty: 1 }]).error);
    for (const qty of [0, -1, 1.5, 11, '2; drop table']) assert.ok(priceDropOrder(drop, [{ id: tee.id, size: 'M', qty }]).error, String(qty));
  });
});

describe('buyer details', () => {
  const ok = { name: 'Brian', phone: '0712 345 678', location: 'Kilimani, Nairobi', email: 'brian@example.com' };

  test('complete details pass; email only needed when paying online', () => {
    assert.equal(contactError(ok, true), null);
    assert.equal(contactError({ ...ok, email: '' }, false), null);
    assert.ok(contactError({ ...ok, email: '' }, true));
    assert.ok(contactError({ ...ok, email: 'not-an-email' }, true));
  });

  test('missing name, phone or location is caught', () => {
    assert.ok(contactError({ ...ok, name: '  ' }));
    assert.ok(contactError({ ...ok, phone: '123' }));
    assert.ok(contactError({ ...ok, location: '' }));
  });
});

describe('routing a Paystack payment', () => {
  test('merch references go to orders, Premium references to Premium', () => {
    const ref = `${makeReference()}-a1b2c3d4`;
    assert.match(ref, /^GZ-[A-Z0-9]{6}-[0-9a-f]{8}$/);
    assert.equal(paymentKind(ref), 'order');
    assert.equal(paymentKind('gz-1234abcd-xyz-0011aabbccdd'), 'premium');
  });

  test('a successful merch charge is accepted; an order code without the payment suffix is not', () => {
    const tx = { status: 'success', currency: 'KES', reference: 'GZ-7K2M9Q-a1b2c3d4', amount: 120000, channel: 'mobile_money' };
    assert.equal(chargeToApply(tx).reference, 'GZ-7K2M9Q-a1b2c3d4');
    assert.equal(chargeToApply({ ...tx, reference: 'GZ-7K2M9Q' }), null);
  });
});

describe('print list', () => {
  const line = (id, size, qty) => ({ id, size, qty, name: 'x', price: 1 });
  const orders = [
    { status: 'paid', items: [line('drop01-tee', 'M', 2), line('drop01-vest', 'L', 1)] },
    { status: 'delivered', items: [line('drop01-tee', 'M', 1)] },
    { status: 'new', items: [line('drop01-tee', 'S', 1)] },
    { status: 'confirmed', items: [line('drop01-vest', 'XL', 2)] },
    { status: 'pending_payment', items: [line('drop01-tee', 'L', 5)] },
    { status: 'cancelled', items: [line('drop01-tee', 'L', 9)] },
    { status: 'paid', items: [line('old-hoodie', 'M', 4)] },
  ];

  test('counts paid pieces per size, keeps reserved apart, skips unpaid and cancelled', async () => {
    const { printList } = await import('../src/lib/orders.js');
    const [teeRow, vestRow] = printList(drop, orders);
    assert.equal(teeRow.paid.M, 3);
    assert.equal(teeRow.paid.L, 0, 'unpaid online checkout and cancelled order not printed');
    assert.equal(teeRow.reserved.S, 1);
    assert.equal(teeRow.paidTotal, 3);
    assert.equal(vestRow.paid.L, 1);
    assert.equal(vestRow.reserved.XL, 2);
  });

  test('CSV has a line per item and size', async () => {
    const { printList, printListCsv } = await import('../src/lib/orders.js');
    const csv = printListCsv(printList(drop, orders)).split('\n');
    assert.equal(csv[0], 'Item,Size,Paid,Reserved (not paid yet)');
    assert.ok(csv.includes(`"${tee.name}",M,3,0`));
    assert.equal(csv.length, 1 + tee.sizes.length + vest.sizes.length);
  });
});
