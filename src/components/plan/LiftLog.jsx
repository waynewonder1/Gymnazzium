import { useRef, useState } from 'react';
import { formatSets, prFor, setCount, suggestion } from '../../lib/lifts';
import { startRest } from '../../lib/restTimer';
import Confetti from '../Confetti';

const emptyRows = (n) => Array.from({ length: n }, () => ({ w: '', r: '' }));
const toRows = (sets, n) => {
  const rows = (sets ?? []).map((s) => ({ w: s.w ?? '', r: s.r ?? '' }));
  return rows.length >= n ? rows : [...rows, ...emptyRows(n - rows.length)];
};
const toSets = (rows) => rows.map((row) => ({ w: row.w === '' ? null : Number(row.w), r: row.r === '' ? null : Number(row.r) }));

// Weight × reps for each set of one exercise. Saves when you leave a box.
// Finishing a set starts the auto rest timer; beating your best fires a PR celebration.
function LiftLog({ id, index, name, dose, lifts, last, onSave }) {
  const n = setCount(dose);
  const logged = lifts?.[id]?.[index];
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState(() => toRows(logged, n));
  const [celebrations, setCelebrations] = useState(0);
  const savedReps = useRef(toSets(rows).map((s) => s.r));
  const tip = suggestion(last, dose);
  const summary = logged ? formatSets(logged) : '';
  const pr = prFor(lifts, id, index);

  const update = (i, field, value) => setRows(rows.map((row, k) => (k === i ? { ...row, [field]: value } : row)));
  const save = (next = rows) => {
    const sets = toSets(next);
    const before = prFor(lifts, id, index);
    const after = prFor({ ...lifts, [id]: { ...lifts?.[id], [index]: sets } }, id, index);
    if (after && after.text !== before?.text) {
      setCelebrations((c) => c + 1);
      navigator.vibrate?.([80, 60, 80, 60, 200]);
    }
    onSave(sets);
  };
  // A set counts as finished when its reps are filled in (or changed).
  const finishSet = (i) => {
    const reps = Number(rows[i].r);
    if (reps > 0 && savedReps.current[i] !== reps) startRest(`${name} · set ${i + 1} done`);
    savedReps.current[i] = reps || null;
    save();
  };
  const removeSet = (i) => {
    const next = rows.filter((_, k) => k !== i);
    savedReps.current = savedReps.current.filter((_, k) => k !== i);
    setRows(next);
    save(next);
  };
  const copyLast = () => {
    const next = toRows(last.sets, n);
    setRows(next);
    save(next);
  };

  return (
    <div className="lift-log">
      <div className="lift-summary">
        {last && <span className="muted small">Last time: {formatSets(last.sets)}</span>}
        {summary && <span className="small lift-today">Today: {summary}</span>}
        <button type="button" className="link-btn" onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? 'Close' : summary ? 'Edit sets' : 'Log sets'}
        </button>
      </div>
      {pr && <p className="lift-pr small">🏆 New PR! {pr.text}</p>}
      {!pr && tip && <p className="lift-tip small">{tip}</p>}
      {celebrations > 0 && <Confetti key={celebrations} />}
      {open && (
        <div className="lift-rows">
          {rows.map((row, i) => (
            <div className="lift-row" key={i}>
              <span className="muted small">Set {i + 1}</span>
              <label>
                <input type="number" inputMode="decimal" min="0" step="0.5" placeholder={last?.sets[i]?.w ?? 'kg'} value={row.w} onChange={(e) => update(i, 'w', e.target.value)} onBlur={() => save()} aria-label={`Set ${i + 1} weight in kg`} />
                <span className="muted small">kg</span>
              </label>
              <span className="muted">×</span>
              <label>
                <input type="number" inputMode="numeric" min="0" step="1" placeholder={last?.sets[i]?.r ?? 'reps'} value={row.r} onChange={(e) => update(i, 'r', e.target.value)} onBlur={() => finishSet(i)} aria-label={`Set ${i + 1} reps`} />
                <span className="muted small">reps</span>
              </label>
              {rows.length > 1 ? (
                <button type="button" className="icon-btn small-btn set-remove" onClick={() => removeSet(i)} aria-label={`Remove set ${i + 1}`} title="Remove this set">✕</button>
              ) : (
                <span />
              )}
            </div>
          ))}
          <div className="lift-actions">
            <button type="button" className="link-btn" onClick={() => { const next = [...rows, { w: rows.at(-1)?.w ?? '', r: '' }]; setRows(next); }}>+ Add a set</button>
            {last && <button type="button" className="link-btn" onClick={copyLast}>Copy last time</button>}
            <span className="muted small">Leave kg empty for bodyweight.</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default LiftLog;
