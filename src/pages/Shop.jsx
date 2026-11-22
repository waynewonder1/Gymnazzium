import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { drop, dropOpen, formatPrice, products, shopConfig } from '../data/shop';
import { supabase } from '../lib/supabase';
import { timeLeft } from '../lib/orders';
import ProductCard from '../components/ProductCard';
import DropPreorder from '../components/merch/DropPreorder';

const filters = [
  { id: 'all', label: 'All' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'merch', label: 'Merchandise' },
];

// The merch drop (pre-orders), plus the full catalogue when shopConfig.storeOpen is on.
function Shop() {
  const [filter, setFilter] = useState('all');
  const list = filter === 'all' ? products : products.filter((p) => p.category === filter);
  const left = timeLeft(drop.closes);

  return (
    <>
      <section className="page-top drop-page">
        <div className="section-label">{drop.name} · {dropOpen() ? `Pre-orders close in ${left}` : 'Pre-orders closed'}</div>
        <h1 className="page-title">{drop.title}</h1>
        <p className="page-lead">{drop.pitch}</p>
        <PaidOrder />
        <ol className="drop-steps">
          {drop.howItWorks.map((step, i) => (
            <li key={step}><span>{i + 1}</span>{step}</li>
          ))}
        </ol>
        <DropPreorder />
      </section>

      {shopConfig.storeOpen && (
        <section className="shop-catalogue">
          <div className="section-label">Our shop</div>
          <h2 className="section-title">Gear up.</h2>
          <p className="page-lead">Equipment to train anywhere, and merch to rep the grind. {shopConfig.deliveryNote}</p>
          <div className="chips shop-filters">
            {filters.map((f) => (
              <button key={f.id} className={`chip ${filter === f.id ? 'active' : ''}`} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="product-grid">
            {list.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </>
  );
}

// Back from Paystack (/shop?order=…): our server confirms the payment with Paystack first.
function PaidOrder() {
  const [params, setParams] = useSearchParams();
  const reference = params.get('order');
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!reference || !supabase) return;
    let cancelled = false;
    supabase.functions.invoke('merch-checkout', { action: 'verify', reference }).then(({ data, error }) => {
      if (cancelled) return;
      setResult(error ? { error } : data);
      setParams({}, { replace: true });
    });
    return () => {
      cancelled = true;
    };
  }, [reference, setParams]);

  if (!reference && !result) return null;
  if (!result) return <p className="banner">Checking your payment with Paystack…</p>;
  if (result.error) return <p className="banner warn" role="alert">{result.error}</p>;
  if (result.status !== 'paid') {
    return <p className="banner warn" role="alert">We haven't received the payment for order <strong>{result.order}</strong> yet. If you paid, it can take a minute: refresh this page shortly. If you cancelled, you can order again below.</p>;
  }
  return (
    <div className="card flat drop-done" role="status">
      <h3>Paid. You're locked in! 🔥</h3>
      <p>Order <strong>{result.order}</strong> · {formatPrice(result.total)}. Paystack has sent your receipt by email.</p>
      <p>We print when pre-orders close, then message you on WhatsApp to arrange delivery.</p>
    </div>
  );
}

export default Shop;
