import { useEffect, useRef, useState } from 'react';
import { useMember } from '../../context/member';
import { drop, dropOpen, formatPrice, shopConfig } from '../../data/shop';
import { backendEnabled, supabase } from '../../lib/supabase';
import { contactError, makeReference, priceDropOrder, timeLeft } from '../../lib/orders';
import MerchMockup from './MerchMockup';

// Pre-order form for the current drop.
// Main way: pay now with M-Pesa or card on Paystack (merch-checkout prices it on the server).
// Backup: reserve without paying; the team confirms on WhatsApp and takes M-Pesa by hand.
function DropPreorder() {
  const { profile, user } = useMember();
  const [picks, setPicks] = useState(() => Object.fromEntries(drop.items.map((i) => [i.id, { size: '', qty: 0 }])));
  const [form, setForm] = useState({ name: profile?.name ?? '', phone: '', location: '', email: user?.email ?? '' });
  const [state, setState] = useState({ busy: null, error: '', reserved: null });

  const open = dropOpen();
  const chosen = drop.items.filter((i) => picks[i.id].qty > 0).map((i) => ({ id: i.id, size: picks[i.id].size, qty: picks[i.id].qty }));
  const priced = priceDropOrder(drop, chosen);
  const total = priced.total ?? drop.items.reduce((sum, i) => sum + i.price * picks[i.id].qty, 0);
  const pick = (id, change) => setPicks({ ...picks, [id]: { ...picks[id], ...change } });
  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const fail = (error, focus = 'error') => setState({ busy: null, error, reserved: null, focus });
  const errorRef = useRef(null);
  const itemsRef = useRef(null);
  // A problem is always brought into view, so a tap never seems to do nothing.
  useEffect(() => {
    if (!state.error) return;
    const target = state.focus === 'items' ? itemsRef.current : errorRef.current;
    target?.scrollIntoView({ behavior: 'smooth', block: state.focus === 'items' ? 'start' : 'center' });
  }, [state.error, state.focus]);
  // Coming back from Paystack with the Back button can restore the page mid-"Opening checkout…".
  useEffect(() => {
    const reset = (e) => e.persisted && setState((s) => ({ ...s, busy: null }));
    window.addEventListener('pageshow', reset);
    return () => window.removeEventListener('pageshow', reset);
  }, []);

  // Checks shared by both buttons. Returns an error message or null.
  const problem = (needEmail) => {
    if (chosen.length === 0) return 'Pick at least one item (choose a size, then +).';
    if (priced.error) return priced.error;
    if (!backendEnabled) return 'Pre-orders need the online version of the site.';
    if (!navigator.onLine) return "You're offline. Connect to the internet to pre-order.";
    return contactError(form, needEmail);
  };

  const payNow = async (e) => {
    e.preventDefault();
    // Nothing picked yet: take them to the sizes instead of only showing an error.
    if (chosen.length === 0) return fail('Pick a size for the tee or vest first.', 'items');
    const err = problem(true);
    if (err) return fail(err);
    setState({ busy: 'pay', error: '', reserved: null });
    const { data, error } = await supabase.functions.invoke('merch-checkout', { action: 'start', items: chosen, ...form });
    if (error || !data?.url) return fail(error ?? 'Something went wrong. Please try again.');
    window.location.assign(data.url); // Paystack's secure checkout: M-Pesa or card
  };

  const reserve = async () => {
    const err = problem(false);
    if (err) return fail(err);
    setState({ busy: 'reserve', error: '', reserved: null });
    const reference = makeReference();
    const { error } = await supabase.from('orders').insert({
      reference,
      customer_name: form.name.trim(),
      phone: form.phone.trim(),
      location: form.location.trim(),
      items: priced.lines,
      total: priced.total,
    });
    if (error) return fail(`Couldn't save your pre-order: ${error.message}. Please try again.`);
    setState({ busy: null, error: '', reserved: reference });
  };

  if (state.reserved) {
    return (
      <div className="card flat drop-done" role="status">
        <h3>You're on the list! 🔥</h3>
        <p>Your pre-order reference is <strong>{state.reserved}</strong>.</p>
        <p>We'll message you on WhatsApp at <strong>{form.phone}</strong> to confirm your order and how to pay by M-Pesa. Your piece is printed once it's paid.</p>
        <p className="muted small">Total: {formatPrice(priced.total)} · {priced.lines.map((l) => `${l.qty} × ${l.name} (${l.size})`).join(', ')}</p>
      </div>
    );
  }

  return (
    <form className="drop-preorder" onSubmit={payNow} noValidate>
      <div className="drop-items" ref={itemsRef}>
        {drop.items.map((item) => {
          const p = picks[item.id];
          return (
            <article key={item.id} className={`drop-item${p.qty > 0 ? ' picked' : ''}`}>
              <MerchMockup item={item} />
              <div className="drop-item-body">
                <div className="drop-item-head">
                  <h3>{item.name}</h3>
                  <strong className="drop-price">{formatPrice(item.price)}</strong>
                </div>
                <p className="muted small">{item.description}</p>
                {open && (
                  <>
                    <div className="chips drop-sizes" role="group" aria-label={`${item.name} size`}>
                      {item.sizes.map((s) => (
                        <button type="button" key={s} className={`chip${p.size === s ? ' active' : ''}`} aria-pressed={p.size === s} onClick={() => pick(item.id, { size: s, qty: Math.max(p.qty, 1) })}>
                          {s}
                        </button>
                      ))}
                    </div>
                    <div className="drop-qty">
                      <button type="button" className="icon-btn" onClick={() => pick(item.id, { qty: Math.max(0, p.qty - 1) })} aria-label={`One less ${item.name}`}>−</button>
                      <span aria-live="polite">{p.qty}</span>
                      <button type="button" className="icon-btn" onClick={() => pick(item.id, { qty: Math.min(10, p.qty + 1) })} aria-label={`One more ${item.name}`}>+</button>
                    </div>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {open ? (
        <div className="card flat drop-form">
          <h3>Pre-order yours</h3>
          <div className="field-grid">
            <label>Your name<input required maxLength={120} autoComplete="name" value={form.name} onChange={update('name')} /></label>
            <label>Phone (WhatsApp)<input required type="tel" inputMode="tel" autoComplete="tel" maxLength={20} placeholder="07XX XXX XXX" value={form.phone} onChange={update('phone')} /></label>
            {shopConfig.payOnline && (
              <label>Email (for your receipt)<input type="email" inputMode="email" autoComplete="email" maxLength={200} value={form.email} onChange={update('email')} /></label>
            )}
            <label className="drop-location">Delivery location<input required maxLength={200} placeholder="e.g. Kilimani, Nairobi" value={form.location} onChange={update('location')} /></label>
          </div>
          {state.error && <p className="form-error drop-error" role="alert" ref={errorRef}>{state.error}</p>}
          <div className="drop-submit">
            <strong>{total > 0 ? formatPrice(total) : 'Pick a size above'}</strong>
            {shopConfig.payOnline ? (
              <button className="btn" disabled={Boolean(state.busy)}>
                {state.busy === 'pay' ? 'Opening checkout…' : chosen.length === 0 ? 'Pick a size first' : 'Pay now: M-Pesa or card'}
              </button>
            ) : (
              <button type="button" className="btn" onClick={reserve} disabled={Boolean(state.busy)}>{state.busy === 'reserve' ? 'Reserving…' : 'Reserve my order'}</button>
            )}
          </div>
          {shopConfig.payOnline && (
            <p className="muted small drop-alt">
              You pay on Paystack's secure page. Can't pay online?{' '}
              <button type="button" className="link-btn" onClick={reserve} disabled={Boolean(state.busy)}>
                {state.busy === 'reserve' ? 'Reserving…' : 'Reserve now and pay on WhatsApp'}
              </button>
            </p>
          )}
          <p className="muted small">Pre-orders close in {timeLeft(drop.closes)}.</p>
        </div>
      ) : (
        <div className="card flat drop-form">
          <h3>Pre-orders for {drop.name} are closed</h3>
          <p className="muted">Thanks to everyone who ordered! The next drop is coming. Keep training and keep an eye on this page.</p>
        </div>
      )}
    </form>
  );
}

export default DropPreorder;
