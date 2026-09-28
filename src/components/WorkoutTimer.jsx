import { useEffect, useState } from 'react';
import { beep } from '../lib/sound';

const presets = {
  rest: [
    { label: '30 s', rest: 30 },
    { label: '60 s', rest: 60 },
    { label: '90 s', rest: 90 },
    { label: '2 min', rest: 120 },
  ],
  interval: [
    { label: 'HIIT 40/20 × 10', work: 40, rest: 20, rounds: 10 },
    { label: 'Tabata 20/10 × 8', work: 20, rest: 10, rounds: 8 },
    { label: 'Jump rope 60/45 × 5', work: 60, rest: 45, rounds: 5 },
  ],
};

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const idle = { phase: 'idle', round: 1, endsAt: 0, remaining: 0, paused: false };

// mode: 'rest' (single countdown) | 'interval' (work/rest rounds)
function WorkoutTimer({ defaultMode = 'rest' }) {
  const [mode, setMode] = useState(defaultMode);
  const [config, setConfig] = useState({ rest: 60, ...presets.interval[0] });
  const [t, setT] = useState(idle);

  useEffect(() => {
    if (t.phase === 'idle' || t.phase === 'done' || t.paused) return;
    const id = setInterval(() => {
      const left = Math.ceil((t.endsAt - Date.now()) / 1000);
      if (left > 0) {
        if (left <= 3 && left !== t.remaining) beep(660, 80);
        setT((s) => ({ ...s, remaining: left }));
        return;
      }
      // Phase finished — move on.
      if (mode === 'rest' || (t.phase === 'work' && t.round >= config.rounds)) {
        beep(990, 500);
        setT({ ...idle, phase: 'done' });
      } else if (t.phase === 'work') {
        beep(520, 300);
        setT({ phase: 'rest', round: t.round, endsAt: Date.now() + config.rest * 1000, remaining: config.rest, paused: false });
      } else {
        beep(990, 300);
        setT({ phase: 'work', round: t.round + 1, endsAt: Date.now() + config.work * 1000, remaining: config.work, paused: false });
      }
    }, 200);
    return () => clearInterval(id);
  }, [t.phase, t.endsAt, t.paused, t.round, t.remaining, mode, config]);

  const start = () => {
    beep(990, 200);
    const phase = mode === 'rest' ? 'rest' : 'work';
    const seconds = mode === 'rest' ? config.rest : config.work;
    setT({ phase, round: 1, endsAt: Date.now() + seconds * 1000, remaining: seconds, paused: false });
  };
  const pause = () => setT((s) => ({ ...s, paused: true }));
  const resume = () => setT((s) => ({ ...s, paused: false, endsAt: Date.now() + s.remaining * 1000 }));
  const reset = () => setT(idle);

  const running = t.phase === 'work' || t.phase === 'rest';
  const total = t.phase === 'work' ? config.work : config.rest;
  const pct = running ? (t.remaining / total) * 100 : 0;
  const display = running ? t.remaining : mode === 'rest' ? config.rest : config.work;

  return (
    <div className={`timer phase-${t.phase}`}>
      <div className="timer-top">
        <div className="chips">
          <button type="button" className={`chip ${mode === 'rest' ? 'active' : ''}`} onClick={() => { setMode('rest'); reset(); }}>Rest timer</button>
          <button type="button" className={`chip ${mode === 'interval' ? 'active' : ''}`} onClick={() => { setMode('interval'); reset(); }}>Intervals</button>
        </div>
      </div>

      <div className="timer-face" aria-live="polite">
        <span className="timer-phase">
          {t.phase === 'done' ? 'Done! 🔥' : t.phase === 'work' ? 'Work' : t.phase === 'rest' ? 'Rest' : 'Ready'}
          {mode === 'interval' && running && ` · Round ${t.round}/${config.rounds}`}
        </span>
        <span className="timer-time">{fmt(display)}</span>
        <div className="timer-bar"><div style={{ width: `${pct}%` }} /></div>
      </div>

      {!running && (
        <div className="chips timer-presets">
          {presets[mode].map((p) => {
            const active = mode === 'rest' ? config.rest === p.rest : config.work === p.work && config.rest === p.rest && config.rounds === p.rounds;
            return (
              <button type="button" key={p.label} className={`chip ${active ? 'active' : ''}`} onClick={() => { setConfig({ ...config, ...p }); reset(); }}>
                {p.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="timer-controls">
        {!running ? (
          <button type="button" className="btn" onClick={start}>{t.phase === 'done' ? 'Again' : 'Start'}</button>
        ) : t.paused ? (
          <button type="button" className="btn" onClick={resume}>Resume</button>
        ) : (
          <button type="button" className="btn" onClick={pause}>Pause</button>
        )}
        {(running || t.phase === 'done') && <button type="button" className="btn btn-ghost" onClick={reset}>Reset</button>}
      </div>
    </div>
  );
}

export default WorkoutTimer;
