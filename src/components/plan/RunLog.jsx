import { useState } from 'react';
import { formatPace, formatRun, lastRun, paceOf, runPrFor, targetKm } from '../../lib/runs';
import Confetti from '../Confetti';
import ShareSheet from '../social/ShareSheet';

const toFields = (run) => ({
  km: run?.km ?? '',
  min: run ? Math.floor(run.sec / 60) : '',
  sec: run ? Math.round(run.sec % 60) : '',
});

// Distance and time for one run. Saving it ticks the run off; beating your best fires a celebration.
function RunLog({ index, dose, runs, onSave }) {
  const logged = runs?.[index];
  const target = targetKm(dose);
  const last = lastRun(runs, index);
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState(() => toFields(logged));
  const [error, setError] = useState('');
  const [celebrations, setCelebrations] = useState(0);
  const [sharing, setSharing] = useState(false);
  const pr = runPrFor(runs, index);

  const km = Number(fields.km);
  const sec = Number(fields.min || 0) * 60 + Number(fields.sec || 0);
  const preview = km > 0 && sec > 0 ? formatPace(paceOf({ km, sec })) : null;
  const update = (field) => (e) => setFields({ ...fields, [field]: e.target.value });

  const save = (e) => {
    e.preventDefault();
    if (!(km > 0 && km <= 100)) return setError('Enter the distance in km, e.g. 3 or 2.5.');
    if (!(sec > 0) || Number(fields.sec || 0) >= 60) return setError('Enter your time in minutes and seconds (seconds under 60).');
    // Faster than 2:30 per km is beyond world-record pace, so it's almost always a typo (5:30 instead of 50:30).
    if (sec / km < 150) return setError(`${km} km in ${fields.min || 0}:${String(fields.sec || 0).padStart(2, '0')} would be faster than a world record. Check the time: minutes first, e.g. 50 and 30 for 50 min 30 s.`);
    setError('');
    const run = { km: Math.round(km * 100) / 100, sec };
    const before = runPrFor(runs, index);
    const after = runPrFor({ ...runs, [index]: run }, index);
    if (after && after.text !== before?.text) {
      setCelebrations((c) => c + 1);
      navigator.vibrate?.([80, 60, 80, 60, 200]);
    }
    onSave(run);
    setOpen(false);
  };

  const clear = () => {
    setFields(toFields(null));
    onSave(null);
    setOpen(false);
  };

  return (
    <div className="lift-log run-log">
      <div className="lift-summary">
        {last && <span className="muted small">Last run: {formatRun(last)}</span>}
        {logged && <span className="small lift-today">Today: {formatRun(logged)}</span>}
        {logged && !open && <button type="button" className="link-btn" onClick={() => setSharing(true)}>📸 Share</button>}
        <button type="button" className="link-btn" onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? 'Close' : logged ? 'Edit run' : 'Log run'}
        </button>
      </div>
      {pr && <p className="lift-pr small">🏆 New best! {pr.text}</p>}
      {celebrations > 0 && <Confetti key={celebrations} />}
      {sharing && logged && <ShareSheet kind="run" data={{ km: logged.km, sec: logged.sec }} onClose={() => setSharing(false)} />}
      {open && (
        <form className="run-form" onSubmit={save}>
          <label>
            <span className="muted small">Distance</span>
            <span className="run-input">
              <input type="number" inputMode="decimal" min="0" step="0.01" placeholder={target ?? 'km'} value={fields.km} onChange={update('km')} aria-label="Distance in km" />
              <span className="muted small">km</span>
            </span>
          </label>
          <label>
            <span className="muted small">Time</span>
            <span className="run-input">
              <input type="number" inputMode="numeric" min="0" step="1" placeholder="min" value={fields.min} onChange={update('min')} aria-label="Minutes" />
              <span className="muted">:</span>
              <input type="number" inputMode="numeric" min="0" max="59" step="1" placeholder="sec" value={fields.sec} onChange={update('sec')} aria-label="Seconds" />
            </span>
          </label>
          <div className="run-actions">
            <button className="btn btn-sm">Save run</button>
            {logged && <button type="button" className="link-btn" onClick={clear}>Clear</button>}
            <span className="muted small">{preview ? `Pace: ${preview}` : last ? `Last pace: ${formatPace(last.pace)}` : 'Pace is worked out for you.'}</span>
          </div>
          {error && <p className="form-error small" role="alert">{error}</p>}
        </form>
      )}
    </div>
  );
}

export default RunLog;
