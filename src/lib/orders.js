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
