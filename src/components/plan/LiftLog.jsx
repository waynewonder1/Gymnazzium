import { useState } from 'react';
import { formatSets, setCount, suggestion } from '../../lib/lifts';

const emptyRows = (n) => Array.from({ length: n }, () => ({ w: '', r: '' }));
const toRows = (sets, n) => {
  const rows = (sets ?? []).map((s) => ({ w: s.w ?? '', r: s.r ?? '' }));
  return rows.length >= n ? rows : [...rows, ...emptyRows(n - rows.length)];
};
const toSets = (rows) => rows.map((row) => ({ w: row.w === '' ? null : Number(row.w), r: row.r === '' ? null : Number(row.r) }));

// Weight × reps for each set of one exercise. Saves when you leave a box.
function LiftLog({ dose, logged, last, onSave }) {
  const n = setCount(dose);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState(() => toRows(logged, n));
  const tip = suggestion(last, dose);
  const summary = logged ? formatSets(logged) : '';

  const update = (i, field, value) => setRows(rows.map((row, k) => (k === i ? { ...row, [field]: value } : row)));
  const save = (next = rows) => onSave(toSets(next));
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
      {tip && <p className="lift-tip small">{tip}</p>}
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
                <input type="number" inputMode="numeric" min="0" step="1" placeholder={last?.sets[i]?.r ?? 'reps'} value={row.r} onChange={(e) => update(i, 'r', e.target.value)} onBlur={() => save()} aria-label={`Set ${i + 1} reps`} />
                <span className="muted small">reps</span>
              </label>
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
