import { useEffect, useRef, useState } from 'react';
import { exercises } from '../../data/workouts';
import { isLoggable, lastLog, setCount } from '../../lib/lifts';
import { startRest, stopRest } from '../../lib/restTimer';
import { beep } from '../../lib/sound';
import Confetti from '../Confetti';

const holdSeconds = (dose) => Number(String(dose).match(/(\d+)\s*s\b/)?.[1]) || 30;
const fmtClock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// Full-screen, one-set-at-a-time coach for a training day.
// Saving goes through onStep(j, id, sets | null, finished) so lifts and ticks update together.
function GuidedWorkout({ day, progress, onStep, onFinish, onClose }) {
  const items = day.items;
  const firstOpen = items.findIndex((_, j) => !progress.checks[`${day.index}:${j}`]);
  const [phase, setPhase] = useState('intro'); // intro | set | done
  const [j, setJ] = useState(firstOpen === -1 ? 0 : firstOpen);
  const [s, setS] = useState(0);
  const [entry, setEntry] = useState({ w: '', r: '' });
  const [hold, setHold] = useState({ left: 0, running: false });
  const [setsDone, setSetsDone] = useState(0);
  const [minutes, setMinutes] = useState(0); // workout length, worked out when it ends
  const startedAt = useRef(0);

  const item = items[j];
  const kind = exercises[item.id]?.kind;
  const loggable = isLoggable(item.id) && kind !== 'distance';
  const isHold = kind === 'hold';
  const n = setCount(item.dose);
  const last = lastLog(progress.lifts, item.id, day.index);
  const totalSets = items.reduce((sum, it) => sum + setCount(it.dose), 0);
  const doneBefore = items.slice(0, j).reduce((sum, it) => sum + setCount(it.dose), 0) + s;

  // Keep the phone screen on and the page behind from scrolling while the coach is open.
  useEffect(() => {
    let lock = null;
    navigator.wakeLock?.request('screen').then((l) => (lock = l)).catch(() => {});
    document.body.classList.add('guided-open');
    return () => {
      lock?.release().catch(() => {});
      document.body.classList.remove('guided-open');
    };
  }, []);

  // Countdown for timed holds (planks, wall sits…).
  useEffect(() => {
    if (!hold.running) return;
    const id = setTimeout(() => {
      const left = hold.left - 1;
      if (left > 0) return setHold({ left, running: true });
      beep();
      navigator.vibrate?.([200, 80, 200]);
      setHold({ left: 0, running: false });
    }, 1000);
    return () => clearTimeout(id);
  }, [hold]);

  const begin = () => {
    startedAt.current = Date.now();
    setPhase('set');
  };

  // didSet: this move comes from finishing a set, whose save already marked the workout done.
  const goToExercise = (next, didSet = false) => {
    stopRest();
    if (next >= items.length) {
      setMinutes(Math.max(1, Math.round((Date.now() - startedAt.current) / 60000)));
      setPhase('done');
      // Skipped the last exercise(s): still counts if they did any sets; skipping everything doesn't.
      if (!didSet && setsDone > 0) onFinish();
      return;
    }
    setJ(next);
    setS(0);
    setEntry({ w: '', r: '' });
    setHold({ left: 0, running: false });
  };

  const setDone = () => {
    const lastSetOfExercise = s + 1 >= n;
    let sets = null;
    if (loggable && Number(entry.r) > 0) {
      sets = [...(progress.lifts?.[item.id]?.[day.index] ?? [])];
      sets[s] = { w: entry.w === '' ? null : Number(entry.w), r: Number(entry.r) };
      sets = Array.from(sets, (x) => x ?? { w: null, r: null });
    }
    const lastOfWorkout = lastSetOfExercise && j + 1 >= items.length;
    // One save per tap (two in a row would overwrite each other).
    if (sets || lastSetOfExercise) onStep(j, item.id, sets, lastSetOfExercise, lastOfWorkout);
    setSetsDone((c) => c + 1);
    if (!lastOfWorkout) startRest(`${item.name} · set ${s + 1} done`); // only if auto rest is on
    if (lastSetOfExercise) goToExercise(j + 1, true);
    else {
      setS(s + 1);
      // Keep the weight for the next set; reps start fresh.
      setEntry((e) => ({ w: e.w, r: '' }));
      setHold({ left: 0, running: false });
    }
  };

  const close = () => {
    stopRest();
    onClose();
  };

  if (phase === 'intro') {
    return (
      <div className="guided" role="dialog" aria-modal="true" aria-labelledby="guided-title">
        <div className="guided-inner">
          <button type="button" className="icon-btn guided-close" onClick={close} aria-label="Close">✕</button>
          <span className="guided-kicker">Guided workout · ~{day.minutes} min</span>
          <h2 id="guided-title">{day.title}</h2>
          <p className="muted">{items.length} exercises, {totalSets} sets. We'll take you through them one set at a time, with your rest timer in between.</p>
          {day.warmup && <p className="guided-note"><strong>Warm up first:</strong> {day.warmup}</p>}
          <button type="button" className="btn guided-main" onClick={begin}>▶ Start</button>
        </div>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="guided" role="dialog" aria-modal="true" aria-labelledby="guided-title">
        <Confetti />
        <div className="guided-inner guided-finish">
          <span className="guided-kicker">Workout complete</span>
          <h2 id="guided-title">Great work! 💪</h2>
          <div className="guided-stats">
            <div><strong>{minutes}</strong><span>minutes</span></div>
            <div><strong>{setsDone}</strong><span>sets done</span></div>
            <div><strong>{items.length}</strong><span>exercises</span></div>
          </div>
          {day.cooldown && <p className="guided-note"><strong>Cool down:</strong> {day.cooldown}</p>}
          <button type="button" className="btn guided-main" onClick={close}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="guided" role="dialog" aria-modal="true" aria-labelledby="guided-title">
      <div className="guided-inner">
        <button type="button" className="icon-btn guided-close" onClick={close} aria-label="End workout">✕</button>
        <div className="guided-progress">
          <span className="muted small">Exercise {j + 1} of {items.length}{item.group ? ` · ${item.group}` : ''}</span>
          <div className="progress-bar" role="progressbar" aria-label="Workout progress" aria-valuenow={doneBefore} aria-valuemin="0" aria-valuemax={totalSets}>
            <div style={{ width: `${(doneBefore / totalSets) * 100}%` }} />
          </div>
        </div>

        <span className="guided-kicker">Set {s + 1} of {n}</span>
        <h2 id="guided-title">{item.name}</h2>
        <p className="guided-dose">{item.dose}</p>
        <p className="muted">{item.cue}</p>
        {item.note && <p className="guided-note">{item.note}</p>}

        {isHold ? (
          <div className="guided-hold">
            <strong aria-live="polite">{fmtClock(hold.running || hold.left ? hold.left : holdSeconds(item.dose))}</strong>
            {!hold.running ? (
              <button type="button" className="btn btn-ghost" onClick={() => setHold({ left: hold.left || holdSeconds(item.dose), running: true })}>
                {hold.left ? 'Resume' : 'Start timer'}
              </button>
            ) : (
              <button type="button" className="btn btn-ghost" onClick={() => setHold((h) => ({ ...h, running: false }))}>Pause</button>
            )}
          </div>
        ) : loggable ? (
          <div className="guided-log">
            <label>
              <span className="muted small">kg (empty = bodyweight)</span>
              <input type="number" inputMode="decimal" min="0" step="0.5" placeholder={last?.sets[s]?.w ?? '–'} value={entry.w} onChange={(e) => setEntry({ ...entry, w: e.target.value })} />
            </label>
            <label>
              <span className="muted small">Reps done</span>
              <input type="number" inputMode="numeric" min="0" step="1" placeholder={last?.sets[s]?.r ?? 'reps'} value={entry.r} onChange={(e) => setEntry({ ...entry, r: e.target.value })} />
            </label>
            {last && <p className="muted small">Last time: set {s + 1} was {last.sets[s] ? `${last.sets[s].w ? `${last.sets[s].w} kg × ` : ''}${last.sets[s].r} reps` : 'not logged'}.</p>}
          </div>
        ) : null}

        <button type="button" className="btn guided-main" onClick={setDone}>✓ {s + 1 >= n ? (j + 1 >= items.length ? 'Finish workout' : 'Done, next exercise') : 'Set done'}</button>
        <div className="guided-links">
          <button type="button" className="link-btn" onClick={() => goToExercise(j + 1)}>Skip exercise</button>
          <button type="button" className="link-btn" onClick={close}>End workout</button>
        </div>
      </div>
    </div>
  );
}

export default GuidedWorkout;
