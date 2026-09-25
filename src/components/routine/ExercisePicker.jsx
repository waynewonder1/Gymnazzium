import { useEffect, useRef, useState } from 'react';
import { exercises } from '../../data/workouts';
import { exerciseMeta, muscleGroups } from '../../data/exerciseMeta';

// Library exercises you'd actually put in a routine (warm-up variants are listed under their main move).
const ids = Object.keys(exercises).filter((id) => exercises[id].kind !== 'warmup');

function ExercisePicker({ onPick, onCustom, onClose }) {
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState('All');
  const [customName, setCustomName] = useState('');
  const searchRef = useRef(null);

  useEffect(() => {
    searchRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const q = query.trim().toLowerCase();
  const list = ids.filter((id) => {
    const meta = exerciseMeta[id];
    if (muscle !== 'All' && !meta.muscles.includes(muscle)) return false;
    return !q || exercises[id].name.toLowerCase().includes(q) || meta.equipment.toLowerCase().includes(q);
  });

  const addCustom = (e) => {
    e.preventDefault();
    if (customName.trim()) onCustom(customName.trim());
  };

  return (
    <div className="picker-backdrop" onClick={onClose}>
      <div className="picker" role="dialog" aria-modal="true" aria-label="Add an exercise" onClick={(e) => e.stopPropagation()}>
        <div className="picker-head">
          <h3>Add an exercise</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <input ref={searchRef} type="search" className="search" placeholder="Search: squat, curl, machine…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="chips picker-muscles">
          {['All', ...muscleGroups].map((m) => (
            <button type="button" key={m} className={`chip ${muscle === m ? 'active' : ''}`} onClick={() => setMuscle(m)}>{m}</button>
          ))}
        </div>
        <ul className="picker-list">
          {list.map((id) => (
            <li key={id}>
              <button type="button" onClick={() => onPick(id)}>
                <strong>{exercises[id].name}</strong>
                <span className="muted small">{exerciseMeta[id].muscles.join(', ')} · {exerciseMeta[id].equipment}</span>
              </button>
            </li>
          ))}
          {list.length === 0 && <li className="muted small picker-empty">No matches. Add it as your own exercise below.</li>}
        </ul>
        <form className="picker-custom" onSubmit={addCustom}>
          <input placeholder="Can't find it? Type your own exercise" value={customName} onChange={(e) => setCustomName(e.target.value)} maxLength={60} />
          <button type="submit" className="btn btn-sm" disabled={!customName.trim()}>Add</button>
        </form>
      </div>
    </div>
  );
}

export default ExercisePicker;
