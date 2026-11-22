// Short code the customer can quote, e.g. GZ-7K2M9Q (matches the orders.reference check).
export function makeReference() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `GZ-${Array.from(bytes, (b) => chars[b % chars.length]).join('')}`;
}

// Whole days (rounded up) and hours until a date, for "Pre-orders close in …".
export function timeLeft(until, now = new Date()) {
  const ms = new Date(until) - now;
  if (ms <= 0) return null;
  const hours = Math.ceil(ms / 3600000);
  return hours <= 48 ? `${hours} hour${hours === 1 ? '' : 's'}` : `${Math.ceil(hours / 24)} days`;
}

// Prices a pre-order from the drop's own price list. The server uses this too, so the amount
// charged never comes from the browser. picks: [{ id, size, qty }].
// Returns { lines, total } or { error }.
export function priceDropOrder(drop, picks) {
  if (!Array.isArray(picks) || picks.length === 0) return { error: 'Pick at least one item.' };
  if (picks.length > 20) return { error: 'Too many items.' };
  const lines = [];
  for (const pick of picks) {
    const item = drop.items.find((i) => i.id === pick?.id);
    if (!item) return { error: 'That item is not in this drop.' };
    if (!item.sizes.includes(pick.size)) return { error: `Choose a size for the ${item.name.toLowerCase()}.` };
    const qty = Number(pick.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > 10) return { error: 'Quantity must be between 1 and 10.' };
    lines.push({ id: item.id, name: `${item.name} (${drop.name} pre-order)`, size: pick.size, qty, price: item.price });
  }
  return { lines, total: lines.reduce((sum, l) => sum + l.price * l.qty, 0) };
}

// Checks the buyer's details before an order is saved. Returns an error message or null.
export function contactError({ name, phone, location, email }, needEmail = false) {
  if (!name?.trim() || name.trim().length > 120) return 'Add your name.';
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (digits.length < 9 || digits.length > 13) return 'Add a phone number we can reach you on, e.g. 0712 345 678.';
  if (!location?.trim() || location.trim().length > 200) return 'Add where we should deliver.';
  if (needEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email ?? '').trim())) return 'Add your email for the payment receipt.';
  return null;
}

// What to print for a drop: per item, how many of each size were PAID for (paid or delivered),
// plus what's reserved but not paid yet (WhatsApp reservations: new or confirmed).
// Returns [{ id, name, sizes: ['S', …], paid: { S: 3, … }, paidTotal, reserved: { … }, reservedTotal }].
export function printList(drop, orders) {
  const rows = drop.items.map((item) => ({
    id: item.id,
    name: item.name,
    sizes: item.sizes,
    paid: Object.fromEntries(item.sizes.map((s) => [s, 0])),
    reserved: Object.fromEntries(item.sizes.map((s) => [s, 0])),
    paidTotal: 0,
    reservedTotal: 0,
  }));
  for (const order of orders ?? []) {
    const bucket = ['paid', 'delivered'].includes(order.status) ? 'paid' : ['new', 'confirmed'].includes(order.status) ? 'reserved' : null;
    if (!bucket) continue; // unpaid online checkouts and cancelled orders aren't printed
    for (const line of order.items ?? []) {
      const row = rows.find((r) => r.id === line.id);
      if (!row || !(line.size in row[bucket])) continue;
      row[bucket][line.size] += line.qty;
      row[`${bucket}Total`] += line.qty;
    }
  }
  return rows;
}

// The print list as CSV for the printer: item, size, paid, reserved (not paid yet).
export function printListCsv(rows) {
  const lines = ['Item,Size,Paid,Reserved (not paid yet)'];
  for (const r of rows) for (const s of r.sizes) lines.push(`"${r.name}",${s},${r.paid[s]},${r.reserved[s]}`);
  return lines.join('\n');
}
