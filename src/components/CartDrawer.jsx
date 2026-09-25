import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/cart';
import { formatPrice, shopConfig } from '../data/shop';
import ProductIcon from './ProductIcon';
import { backendEnabled, supabase } from '../lib/supabase';

// Short code the customer can quote, e.g. GZ-7K2M9Q.
function makeReference() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return `GZ-${Array.from(bytes, (b) => chars[b % chars.length]).join('')}`;
}

function CartDrawer() {
  const { items, total, setQty, clear, open, setOpen } = useCart();
  const [step, setStep] = useState('cart'); // 'cart' | 'checkout' | 'sent'
  const [form, setForm] = useState({ name: '', phone: '', location: '' });
  const [order, setOrder] = useState(null); // { reference, text, saved }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const close = () => {
    setOpen(false);
    if (step === 'sent') setStep('cart');
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  const placeOrder = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const reference = makeReference();
    const lines = items.map((l) => ({ id: l.id, name: l.product.name, size: l.size, qty: l.qty, price: l.product.price }));
    const text = [
      `Order ${reference} from ${form.name} (${form.phone})`,
      `Deliver to: ${form.location}`,
      '',
      ...lines.map((l) => `${l.qty} × ${l.name}${l.size ? ` (${l.size})` : ''}: ${formatPrice(l.price * l.qty)}`),
      '',
      `Total: ${formatPrice(total)}`,
    ].join('\n');

    let saved = false;
    if (backendEnabled) {
      const { error: insertError } = await supabase.from('orders').insert({
        reference,
        customer_name: form.name,
        phone: form.phone,
        location: form.location,
        items: lines,
        total,
      });
      if (insertError) {
        setBusy(false);
        setError(`Couldn't place your order: ${insertError.message}. Please try again.`);
        return;
      }
      saved = true;
    }

    if (saved || shopConfig.whatsappNumber) clear();
    setOrder({ reference, text, saved });
    setBusy(false);
    setStep('sent');
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <>
      <div className={`drawer-backdrop ${open ? 'open' : ''}`} onClick={close} />
      <aside className={`drawer ${open ? 'open' : ''}`} inert={!open} aria-label="Shopping cart">
        <div className="drawer-head">
          <h3>{step === 'checkout' ? 'Checkout' : step === 'sent' ? 'Order' : 'Your cart'}</h3>
          <button className="icon-btn" onClick={close} aria-label="Close cart">✕</button>
        </div>

        {step === 'sent' && order ? (
          <div className="drawer-body">
            {order.saved ? (
              <>
                <p className="order-ok">Order <strong>{order.reference}</strong> received ✓</p>
                <p className="muted">
                  {shopConfig.whatsappNumber
                    ? 'Send it to us on WhatsApp to confirm M-Pesa payment and delivery.'
                    : `We'll call you on ${form.phone} to confirm M-Pesa payment and delivery.`}
                </p>
              </>
            ) : shopConfig.whatsappNumber ? (
              <p>Tap below to send your order to us on WhatsApp. We'll confirm M-Pesa payment and delivery with you.</p>
            ) : (
              <p className="muted">Online ordering isn't switched on yet. Here's your order summary. Your cart has been kept.</p>
            )}
            {shopConfig.whatsappNumber && (
              <a className="btn" href={`https://wa.me/${shopConfig.whatsappNumber}?text=${encodeURIComponent(order.text)}`} target="_blank" rel="noopener noreferrer">
                Send on WhatsApp
              </a>
            )}
            <pre className="order-summary">{order.text}</pre>
            <button className="btn btn-ghost" onClick={close}>Done</button>
          </div>
        ) : items.length === 0 ? (
          <div className="drawer-body empty-cart">
            <p className="muted">Your cart is empty.</p>
            <Link to="/shop" className="btn" onClick={close}>Browse the shop</Link>
          </div>
        ) : (
          <>
            <div className="drawer-body">
              {step === 'cart' ? (
                <ul className="cart-lines">
                  {items.map((l) => (
                    <li key={l.key}>
                      <div className="cart-thumb"><ProductIcon name={l.product.icon} /></div>
                      <div className="cart-info">
                        <strong>{l.product.name}</strong>
                        {l.size && <span className="muted">Size {l.size}</span>}
                        <span>{formatPrice(l.product.price * l.qty)}</span>
                      </div>
                      <div className="qty">
                        <button onClick={() => setQty(l.key, l.qty - 1)} aria-label="Decrease quantity">−</button>
                        <span>{l.qty}</span>
                        <button onClick={() => setQty(l.key, l.qty + 1)} aria-label="Increase quantity">+</button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <form id="checkout-form" className="checkout" onSubmit={placeOrder}>
                  <label>Full name<input required value={form.name} onChange={update('name')} /></label>
                  <label>Phone (M-Pesa)<input required type="tel" placeholder="07XX XXX XXX" value={form.phone} onChange={update('phone')} /></label>
                  <label>Delivery location<input required placeholder="Estate, town" value={form.location} onChange={update('location')} /></label>
                  <p className="muted small">{shopConfig.deliveryNote} You'll confirm payment with us directly. We never ask for card details here.</p>
                  {error && <p className="form-error small" role="alert">{error}</p>}
                </form>
              )}
            </div>
            <div className="drawer-foot">
              <div className="total"><span>Total</span><strong>{formatPrice(total)}</strong></div>
              {step === 'cart' ? (
                <button className="btn btn-block" onClick={() => setStep('checkout')}>Checkout</button>
              ) : (
                <div className="foot-actions">
                  <button className="btn btn-ghost" onClick={() => setStep('cart')}>Back</button>
                  <button className="btn" type="submit" form="checkout-form" disabled={busy}>{busy ? 'Placing…' : 'Place order'}</button>
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </>
  );
}

export default CartDrawer;
