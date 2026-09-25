import { useState } from 'react';
import { products, shopConfig } from '../data/shop';
import ProductCard from '../components/ProductCard';

const filters = [
  { id: 'all', label: 'All' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'merch', label: 'Merchandise' },
];

function Shop() {
  const [filter, setFilter] = useState('all');
  const list = filter === 'all' ? products : products.filter((p) => p.category === filter);

  return (
    <section className="page-top">
      <div className="section-label">Our shop</div>
      <h1 className="page-title">Gear up.</h1>
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
  );
}

export default Shop;
