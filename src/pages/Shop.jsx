import { useState } from 'react';
import { drop, dropOpen, products, shopConfig } from '../data/shop';
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

export default Shop;
