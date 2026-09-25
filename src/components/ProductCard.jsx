import { useEffect, useState } from 'react';
import { useCart } from '../context/cart';
import { formatPrice } from '../data/shop';
import ProductIcon from './ProductIcon';

function ProductCard({ product }) {
  const { add } = useCart();
  const [size, setSize] = useState(product.sizes?.[1] ?? product.sizes?.[0] ?? null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1500);
    return () => clearTimeout(t);
  }, [added]);

  return (
    <div className="product">
      <div className={`product-art ${product.category}`}>
        {product.image ? <img src={product.image} alt={product.name} /> : <ProductIcon name={product.icon} />}
      </div>
      <div className="product-body">
        <span className="product-cat">{product.category === 'merch' ? 'Merch' : 'Equipment'}</span>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        {product.sizes && (
          <div className="sizes" role="radiogroup" aria-label="Size">
            {product.sizes.map((s) => (
              <button key={s} role="radio" aria-checked={s === size} className={`size ${s === size ? 'active' : ''}`} onClick={() => setSize(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="product-foot">
          <strong>{formatPrice(product.price)}</strong>
          <button
            className={`btn btn-sm ${added ? 'added' : ''}`}
            onClick={() => {
              add(product.id, size);
              setAdded(true);
            }}
          >
            {added ? 'Added ✓' : 'Add to cart'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
