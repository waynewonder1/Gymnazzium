import { useEffect, useRef, useState } from 'react';
import { exercises } from '../../data/workouts';
import { isLoggable, lastLog, prFor, setCount, topOfRange } from '../../lib/lifts';
import ShareSheet from '../social/ShareSheet';
import { startRest, stopRest } from '../../lib/restTimer';
import { beep } from '../../lib/sound';
import Confetti from '../Confetti';
import { useMember } from '../../context/member';
import { currentSubscription, enablePush, needsHomeScreen, pushAvailable, testNotification } from '../../lib/push';

const holdSeconds = (dose) => Number(String(dose).match(/(\d+)\s*s\b/)?.[1]) || 30;

// kg only matters for weighted moves (and custom exercises, which could be either). Push-ups don't need it.
const usesKg = (id) => !exercises[id] || exercises[id].kind === 'weight';

// Pre-filled set: what's already logged today, else last time, else the plan's target reps.
// Doing what the plan says is then a single tap on "Set done".
function startEntry(lifts, item, dayIndex, s) {
  const today = lifts?.[item.id]?.[dayIndex]?.[s];
  const last = lastLog(lifts, item.id, dayIndex)?.sets;
  const prev = last?.[s] ?? last?.at(-1);
  const r = today?.r ?? prev?.r ?? topOfRange(item.dose) ?? 10;
  const w = usesKg(item.id) ? (today?.w ?? prev?.w ?? '') : '';
  return { w: w ?? '', r };
}
const fmtClock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// "Turn on reminders?" on the finish screen: the best moment to ask is right after a workout.
// Shows nothing if reminders are already on or this device can't get them.
function ReminderPrompt() {
  const { user } = useMember();
  const [status, setStatus] = useState('checking'); // checking | off | on | busy | hidden
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!pushAvailable() || !user) return;
    currentSubscription()
      .then((sub) => !cancelled && setStatus(sub ? 'hidden' : 'off'))
      .catch(() => !cancelled && setStatus('off'));
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!pushAvailable() || !user || status === 'checking' || status === 'hidden') return null;

  const turnOn = async () => {
    setStatus('busy');
    setError('');
    try {
      await enablePush(user.id);
      await testNotification();
      setStatus('on');
    } catch (e) {
      setStatus('off');
      setError(
        e.message === 'blocked'
          ? "Notifications are blocked for this site. Allow them in your browser's site settings, then try again from My plan."
          : e.message === 'dismissed'
            ? 'No problem. You can turn them on any time from My plan.'
            : `Couldn't turn on reminders: ${e.message}`
      );
    }
  };

  return (
    <div className="guided-reminder">
      {status === 'on' ? (
        <p><strong>🔔 Reminders are on.</strong> See you at your workout time tomorrow!</p>
      ) : needsHomeScreen() ? (
        <p><strong>🔔 Want a reminder tomorrow?</strong> On iPhone, add Gymnazzium to your Home Screen first (Share → Add to Home Screen), then turn reminders on from My plan there.</p>
      ) : (
        <>
          <p><strong>🔔 Want a reminder at your workout time tomorrow?</strong> It's what keeps a streak going.</p>
          <button type="button" className="btn btn-ghost" onClick={turnOn} disabled={status === 'busy'}>
            {status === 'busy' ? 'Turning on…' : 'Turn on reminders'}
          </button>
        </>
      )}
      {error && <p className="muted small">{error}</p>}
    </div>
  );
}

// A big number with − / + either side (and still typeable), so logging needs no keyboard.
function Stepper({ label, value, step, decimal = false, onChange }) {
  const n = Number(value) || 0;
  const set = (v) => onChange(Math.max(0, Math.round(v * 10) / 10));
  return (
    <div className="stepper">
      <span className="muted small">{label}</span>
      <div className="stepper-row">
        <button type="button" className="stepper-btn" onClick={() => set(n - step)} aria-label={`${label}: less`}>−</button>
        <input
          type="number"
          inputMode={decimal ? 'decimal' : 'numeric'}
          min="0"
          step={decimal ? 0.5 : 1}
          value={value}
          aria-label={label}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        />
        <button type="button" className="stepper-btn" onClick={() => set(n + step)} aria-label={`${label}: more`}>+</button>
      </div>
    </div>
  );
}

// Full-screen, one-set-at-a-time coach for a training day.
// Saving goes through onStep(j, id, sets | null, finished) so lifts and ticks update together.
function GuidedWorkout({ day, progress, onStep, onFinish, onClose }) {
  const items = day.items;
  const firstOpen = items.findIndex((_, j) => !progress.checks[`${day.index}:${j}`]);
  const [phase, setPhase] = useState('intro'); // intro | set | done
  const [j, setJ] = useState(firstOpen === -1 ? 0 : firstOpen);
  const [s, setS] = useState(0);
  const [entry, setEntry] = useState(() => startEntry(progress.lifts, items[firstOpen === -1 ? 0 : firstOpen], day.index, 0));
  const [hold, setHold] = useState({ left: 0, running: false });
  const [setsDone, setSetsDone] = useState(0);
  const [minutes, setMinutes] = useState(0); // workout length, worked out when it ends
  const [sharing, setSharing] = useState(false);
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
    setEntry(startEntry(progress.lifts, items[next], day.index, 0));
    setHold({ left: 0, running: false });
  };

  const setDone = () => {
    const lastSetOfExercise = s + 1 >= n;
    let sets = null;
    if (loggable && Number(entry.r) > 0) {
      sets = [...(progress.lifts?.[item.id]?.[day.index] ?? [])];
      sets[s] = { w: usesKg(item.id) && Number(entry.w) > 0 ? Number(entry.w) : null, r: Number(entry.r) };
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
      // Next set starts from last time / the plan again, but keeps today's weight.
      setEntry((e) => ({ ...startEntry(progress.lifts, item, day.index, s + 1), w: e.w }));
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
          <button type="button" className="btn btn-ghost" onClick={() => setSharing(true)}>📸 Share this workout</button>
          <ReminderPrompt />
          <button type="button" className="btn guided-main" onClick={close}>Done</button>
          {sharing && (
            <ShareSheet
              kind="workout"
              data={{ title: day.title, exercises: items.length, sets: setsDone, prs: items.filter((it) => prFor(progress.lifts, it.id, day.index)).length, minutes }}
              onClose={() => setSharing(false)}
            />
          )}
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
            <Stepper label="Reps done" value={entry.r} step={1} onChange={(r) => setEntry({ ...entry, r })} />
            {usesKg(item.id) && (
              <Stepper label="kg (0 = bodyweight)" value={entry.w === '' ? 0 : entry.w} step={2.5} decimal onChange={(w) => setEntry({ ...entry, w: w || '' })} />
            )}
            <p className="muted small">
              {last ? `Last time: ${last.sets[s] ? `${last.sets[s].w ? `${last.sets[s].w} kg × ` : ''}${last.sets[s].r} reps` : 'not logged'}. ` : ''}
              Did what it says? Just tap the button below.
            </p>
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
