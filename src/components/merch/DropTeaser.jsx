import { Link } from 'react-router-dom';
import { drop, dropOpen, formatPrice } from '../../data/shop';
import { timeLeft } from '../../lib/orders';
import MerchMockup from './MerchMockup';

// Eye-catching promo for the current drop (home page, plan page). Hidden once pre-orders close.
function DropTeaser({ compact = false }) {
  if (!dropOpen()) return null;
  const from = Math.min(...drop.items.map((i) => i.price));
  return (
    <div className={`drop-teaser${compact ? ' compact' : ''}`}>
      <div className="drop-teaser-art">
        {drop.items.map((item) => <MerchMockup key={item.id} item={item} />)}
      </div>
      <div className="drop-teaser-copy">
        <span className="drop-badge">🔥 {drop.name} · pre-orders open</span>
        <h2>{compact ? 'Rep the grind.' : 'The first Gymnazzium merch is here.'}</h2>
        <p className="muted">
          A training tee and vest, from {formatPrice(from)}. Founding edition: made only for those who pre-order.
          {' '}Closes in {timeLeft(drop.closes)}.
        </p>
        <Link to="/shop" className="btn">Reserve yours →</Link>
      </div>
    </div>
  );
}

export default DropTeaser;
