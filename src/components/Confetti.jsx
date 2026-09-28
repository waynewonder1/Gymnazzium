import { createPortal } from 'react-dom';

// A one-off confetti burst for PRs. Mount it with a new `key` to fire again.
// Positions come from a fixed pattern (not Math.random) so renders stay predictable.
const COLORS = ['#FF4B3E', '#6FA8A3', '#ECEFEC', '#ffbe50'];
const PIECES = Array.from({ length: 36 }, (_, i) => {
  const t = (i * 0.618034) % 1; // golden-ratio spread
  return {
    x: Math.round((t - 0.5) * 90), // vw offset from centre
    rise: 45 + ((i * 37) % 30), // vh
    spin: ((i * 83) % 720) - 360,
    delay: (i % 6) * 40,
    color: COLORS[i % COLORS.length],
    size: 6 + (i % 3) * 3,
  };
});

function Confetti() {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  return createPortal(
    <div className="confetti" aria-hidden="true">
      {PIECES.map((p, i) => (
        <span
          key={i}
          style={{
            '--x': `${p.x}vw`,
            '--rise': `-${p.rise}vh`,
            '--spin': `${p.spin}deg`,
            animationDelay: `${p.delay}ms`,
            background: p.color,
            width: p.size,
            height: p.size * 1.6,
          }}
        />
      ))}
    </div>,
    document.body
  );
}

export default Confetti;
