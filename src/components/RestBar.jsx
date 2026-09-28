import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { addRest, getRest, stopRest, subscribeRest } from '../lib/restTimer';
import { beep } from '../lib/sound';

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// Tells the member rest is over even if they switched to another app (needs notification permission).
async function notifyIfHidden(label) {
  if (!document.hidden || !('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    const body = label ? `${label}. Time for the next set.` : 'Time for the next set.';
    if (reg) reg.showNotification('Rest over 💪', { body, tag: 'gymnazzium-rest', icon: '/icon-192.png' });
    else new Notification('Rest over 💪', { body });
  } catch {
    // Notifications unavailable — the beep and vibration still fire.
  }
}

// The countdown bar at the bottom of the screen, started by logging a set.
function RestBar() {
  const rest = useSyncExternalStore(subscribeRest, getRest);
  const [now, setNow] = useState(() => Date.now());
  const firedFor = useRef(0);

  useEffect(() => {
    if (!rest.endsAt) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      const left = Math.ceil((rest.endsAt - t) / 1000);
      if (left > 0 && left <= 3) beep(660, 80);
      if (t >= rest.endsAt && firedFor.current !== rest.endsAt) {
        firedFor.current = rest.endsAt;
        beep(990, 250);
        setTimeout(() => beep(990, 400), 300);
        navigator.vibrate?.([200, 100, 200, 100, 400]);
        notifyIfHidden(rest.label);
      }
      // Leave the "Go!" message up for a few seconds, then hide.
      if (t >= rest.endsAt + 4000) stopRest();
    }, 250);
    return () => clearInterval(id);
  }, [rest.endsAt, rest.label]);

  if (!rest.endsAt) return null;
  // Clamped to the rest length: `now` can be a moment stale right after a new rest starts.
  const left = Math.min(rest.total, Math.max(0, Math.ceil((rest.endsAt - now) / 1000)));
  const done = left === 0;
  const pct = done ? 100 : Math.min(100, ((rest.total - left) / rest.total) * 100);

  return (
    <div className={`rest-bar ${done ? 'done' : ''}`} role="timer" aria-live="polite">
      <div className="rest-fill" style={{ width: `${pct}%` }} />
      <div className="rest-content">
        <div>
          <strong>{done ? 'Go! Next set 💪' : `Rest ${fmt(left)}`}</strong>
          {rest.label && <span className="rest-label">{rest.label}</span>}
        </div>
        <div className="rest-actions">
          {!done && <button type="button" onClick={() => addRest(30)}>+30 s</button>}
          <button type="button" onClick={stopRest}>{done ? 'Close' : 'Skip'}</button>
        </div>
      </div>
    </div>
  );
}

export default RestBar;
