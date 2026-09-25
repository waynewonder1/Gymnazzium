import { useEffect, useRef, useState } from 'react';

// Animates every number inside a string (e.g. "150–300", "18.3%", "KES 0") when it scrolls into view.
function CountUp({ value, duration = 1200 }) {
  const ref = useRef(null);
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [progress, setProgress] = useState(reducedMotion ? 1 : 0);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion) return;
    let frame;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - start) / duration);
        setProgress(1 - (1 - p) ** 3); // ease-out
        if (p < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [duration, reducedMotion]);

  const text = value.replace(/\d+(?:\.\d+)?/g, (n) => {
    const decimals = n.includes('.') ? n.split('.')[1].length : 0;
    return (Number(n) * progress).toFixed(decimals);
  });

  return <span ref={ref}>{text}</span>;
}

export default CountUp;
