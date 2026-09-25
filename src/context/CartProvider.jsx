import { useEffect, useState } from 'react';
import { CartContext } from './cart';
import { products } from '../data/shop';

const STORAGE_KEY = 'gymnazzium-cart';

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
    // Drop anything no longer in the catalogue.
    return saved.filter((line) => products.some((p) => p.id === line.id));
  } catch {
    return [];
  }
}

function CartProvider({ children }) {
  const [lines, setLines] = useState(loadCart);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // ignore
    }
  }, [lines]);

  const add = (id, size = null) => {
    const key = size ? `${id}:${size}` : id;
    setLines((prev) =>
      prev.some((l) => l.key === key)
        ? prev.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l))
        : [...prev, { key, id, size, qty: 1 }]
    );
  };

  const setQty = (key, qty) =>
    setLines((prev) => (qty <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, qty } : l))));

  const items = lines.map((l) => ({ ...l, product: products.find((p) => p.id === l.id) }));
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const total = items.reduce((sum, l) => sum + l.product.price * l.qty, 0);

  const value = { items, count, total, add, setQty, clear: () => setLines([]), open, setOpen };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export default CartProvider;
