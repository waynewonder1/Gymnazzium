import { useEffect, useRef, useState } from 'react';

// One exercise over time: a 2px line with end dot, hover crosshair + tooltip.
// points: [{ x: Date, y: number, label: string, pr?: boolean }] — PR sessions get a ring marker
const H = 180;
const PAD = { top: 16, right: 56, bottom: 28, left: 40 };

function niceTicks(min, max, count = 4) {
  if (min === max) return [min];
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  const start = Math.floor(min / step) * step;
  const ticks = [];
  for (let v = start; v <= max + step * 0.001; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

const shortDate = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

function LiftChart({ points, unit }) {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ys = points.map((p) => p.y);
  const ticks = niceTicks(Math.min(...ys) * 0.95, Math.max(...ys) * 1.05);
  const yMin = ticks[0];
  const yMax = ticks.length > 1 ? ticks.at(-1) : ticks[0] + 1;
  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v) => PAD.top + innerH - ((v - yMin) / (yMax - yMin || 1)) * innerH;
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join('');
  const last = points.at(-1);

  // Snap the crosshair to the nearest session.
  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    let best = 0;
    points.forEach((_, i) => {
      if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    });
    setHover(best);
  };
  const onKey = (e) => {
    if (e.key === 'ArrowLeft') setHover((h) => Math.max(0, (h ?? points.length) - 1));
    if (e.key === 'ArrowRight') setHover((h) => Math.min(points.length - 1, (h ?? -1) + 1));
  };

  const hp = hover !== null ? points[hover] : null;

  return (
    <div className="lift-chart" ref={wrapRef}>
      {width > 0 && (
        <svg
          width={width}
          height={H}
          role="img"
          aria-label={`Progress over ${points.length} sessions, latest ${last.y} ${unit}. Use arrow keys to step through sessions.`}
          tabIndex={0}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          onKeyDown={onKey}
          onBlur={() => setHover(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line className="lc-grid" x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} />
              <text className="lc-axis" x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end">{t}</text>
            </g>
          ))}
          <text className="lc-axis" x={x(0)} y={H - 8} textAnchor={points.length === 1 ? 'middle' : 'start'}>{shortDate(points[0].x)}</text>
          {points.length > 1 && <text className="lc-axis" x={x(points.length - 1)} y={H - 8} textAnchor="end">{shortDate(last.x)}</text>}

          <path className="lc-line" d={path} />
          {hp && <line className="lc-cross" x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} />}
          {points.map((p, i) => p.pr && <circle key={i} className="lc-pr" cx={x(i)} cy={y(p.y)} r="5" />)}
          <circle className="lc-dot" cx={x(points.length - 1)} cy={y(last.y)} r="5" />
          {hp && <circle className="lc-dot" cx={x(hover)} cy={y(hp.y)} r="5" />}
          <text className="lc-end" x={x(points.length - 1) + 10} y={y(last.y)} dy="0.32em">{last.y} {unit}</text>
        </svg>
      )}
      {hp && (
        <div className="lc-tip" style={{ left: Math.min(Math.max(x(hover), 70), width - 70), top: 0 }}>
          <strong>{hp.y} {unit}{hp.pr ? ' 🏆 PR' : ''}</strong>
          <span>{hp.label}</span>
          <span className="muted">{shortDate(hp.x)}</span>
        </div>
      )}
    </div>
  );
}

export default LiftChart;
