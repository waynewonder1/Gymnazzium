import { useState } from 'react';
import { useMember } from '../../context/member';
import { drop, dropOpen, formatPrice } from '../../data/shop';
import { backendEnabled, supabase } from '../../lib/supabase';
import { makeReference, timeLeft } from '../../lib/orders';
import MerchMockup from './MerchMockup';

// Pre-order form for the current drop. Saves to the orders table (seen on /admin);
// no payment here: the team confirms on WhatsApp and the customer pays by M-Pesa.
function DropPreorder() {
  const { profile } = useMember();
  const [picks, setPicks] = useState(() => Object.fromEntries(drop.items.map((i) => [i.id, { size: '', qty: 0 }])));
  const [form, setForm] = useState({ name: profile?.name ?? '', phone: '', location: '' });
  const [state, setState] = useState({ busy: false, error: '', reference: null });

  const open = dropOpen();
  const lines = drop.items.filter((i) => picks[i.id].qty > 0).map((i) => ({ ...i, ...picks[i.id] }));
  const total = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const pick = (id, change) => setPicks({ ...picks, [id]: { ...picks[id], ...change } });
  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const reserve = async (e) => {
    e.preventDefault();
    if (lines.length === 0) return setState({ ...state, error: 'Pick at least one item (choose a size, then +).' });
    const missingSize = lines.find((l) => !l.size);
    if (missingSize) return setState({ ...state, error: `Choose a size for the ${missingSize.name.toLowerCase()}.` });
    if (!backendEnabled) return setState({ ...state, error: 'Pre-orders need the online version of the site.' });
    if (!navigator.onLine) return setState({ ...state, error: "You're offline. Connect to the internet to reserve." });
    setState({ busy: true, error: '', reference: null });
    const reference = makeReference();
    const { error } = await supabase.from('orders').insert({
      reference,
      customer_name: form.name.trim(),
      phone: form.phone.trim(),
      location: form.location.trim(),
      items: lines.map((l) => ({ id: l.id, name: `${l.name} (${drop.name} pre-order)`, size: l.size, qty: l.qty, price: l.price })),
      total,
    });
    if (error) return setState({ busy: false, error: `Couldn't save your pre-order: ${error.message}. Please try again.`, reference: null });
    setState({ busy: false, error: '', reference });
  };

  if (state.reference) {
    return (
      <div className="card flat drop-done" role="status">
        <h3>You're on the list! 🔥</h3>
        <p>Your pre-order reference is <strong>{state.reference}</strong>.</p>
        <p>We'll message you on WhatsApp at <strong>{form.phone}</strong> to confirm your order and how to pay by M-Pesa. Nothing to pay until then.</p>
        <p className="muted small">Total: {formatPrice(total)} · {lines.map((l) => `${l.qty} × ${l.name} (${l.size})`).join(', ')}</p>
      </div>
    );
  }

  return (
    <form className="drop-preorder" onSubmit={reserve}>
      <div className="drop-items">
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
          <h3>Reserve yours</h3>
          <p className="muted small">No payment now. We confirm on WhatsApp first.</p>
          <div className="field-grid">
            <label>Your name<input required maxLength={120} value={form.name} onChange={update('name')} /></label>
            <label>WhatsApp number<input required type="tel" inputMode="tel" minLength={7} maxLength={20} placeholder="07XX XXX XXX" value={form.phone} onChange={update('phone')} /></label>
            <label className="drop-location">Delivery location<input required maxLength={200} placeholder="e.g. Kilimani, Nairobi" value={form.location} onChange={update('location')} /></label>
          </div>
          {state.error && <p className="form-error small" role="alert">{state.error}</p>}
          <div className="drop-submit">
            <strong>{total > 0 ? formatPrice(total) : 'Pick a size above'}</strong>
            <button className="btn" disabled={state.busy}>{state.busy ? 'Reserving…' : 'Reserve my order'}</button>
          </div>
          <p className="muted small">Pre-orders close in {timeLeft(drop.closes)}.</p>
        </div>
      ) : (
        <div className="card flat drop-form">
          <h3>Pre-orders for {drop.name} are closed</h3>
          <p className="muted">Thanks to everyone who reserved! The next drop is coming. Keep training and keep an eye on this page.</p>
        </div>
      )}
    </form>
  );
}

export default DropPreorder;
