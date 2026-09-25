import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMember } from '../context/member';
import { defaultsFor, exerciseInfo, routineTemplate } from '../lib/plan';
import ExercisePicker from '../components/routine/ExercisePicker';

const WEEK = [1, 2, 3, 4, 5, 6, 0]; // Monday first
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const starts = [
  { id: 'current', title: 'My current plan', text: 'Start from one week of the plan you have now, then tweak it.' },
  { id: 'gym', title: 'The Gymnazzium split', text: 'Chest & back, legs, chest/shoulders/arms, legs, back & arms.' },
  { id: 'blank', title: 'A blank week', text: 'Build every day from scratch.' },
];

// Editor rows need stable React keys; they're stripped again before saving.
let nextKey = 0;
const key = () => `k${++nextKey}`;
const withKeys = (routine) => ({
  ...routine,
  days: Object.fromEntries(
    Object.entries(routine.days).map(([d, day]) => [
      d,
      day && { ...day, groups: day.groups.map((g) => ({ ...g, key: key(), items: g.items.map((i) => ({ ...i, key: key() })) })) },
    ])
  ),
});
const stripKeys = (routine) => ({
  ...routine,
  days: Object.fromEntries(
    Object.entries(routine.days).map(([d, day]) => [
      d,
      day && { title: day.title.trim(), groups: day.groups.map((g) => ({ name: g.name.trim(), items: g.items.map(({ id, sets, reps }) => ({ id, sets: Number(sets), reps: String(reps).trim() })) })) },
    ])
  ),
});

function problemsIn(routine) {
  const problems = [];
  const training = WEEK.filter((d) => routine.days[d]);
  if (training.length === 0) problems.push('Choose at least one training day.');
  for (const d of training) {
    const day = routine.days[d];
    const items = day.groups.flatMap((g) => g.items);
    if (items.length === 0) problems.push(`${DAY_NAMES[d]} has no exercises. Add some or set it to rest.`);
    if (items.some((i) => !(Number(i.sets) >= 1 && Number(i.sets) <= 10 && Number.isInteger(Number(i.sets))))) problems.push(`${DAY_NAMES[d]}: sets must be a whole number from 1 to 10.`);
    if (items.some((i) => !String(i.reps).trim())) problems.push(`${DAY_NAMES[d]}: every exercise needs reps (e.g. 8–12, 10, 30 s).`);
  }
  return problems;
}

function RoutineEditor() {
  const { profile, authReady, syncing } = useMember();
  if (!profile) {
    return (
      <section className="page-top">
        {!authReady || syncing ? <p className="muted">Loading…</p> : (
          <>
            <h1 className="page-title">Build your plan first.</h1>
            <p className="page-lead">Register to get a plan, then customize it here.</p>
            <Link to="/#register" className="btn">Build my plan</Link>
          </>
        )}
      </section>
    );
  }
  return <Editor profile={profile} />;
}

function Editor({ profile }) {
  const navigate = useNavigate();
  const { saveProfile } = useMember();
  const [saved] = useState(() => (profile.routine ? withKeys(profile.routine) : null));
  const [routine, setRoutine] = useState(saved);
  const [picker, setPicker] = useState(null); // { day, group }
  const [showErrors, setShowErrors] = useState(false);

  const dirty = routine && JSON.stringify(stripKeys(routine)) !== JSON.stringify(saved ? stripKeys(saved) : null);
  const problems = routine ? problemsIn(routine) : [];

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const start = (source) => {
    if (routine && dirty && !window.confirm('Replace your current edits?')) return;
    setRoutine(withKeys(routineTemplate(profile, source)));
    setShowErrors(false);
  };

  // Immutable update helper for one day.
  const setDay = (d, fn) => setRoutine((r) => ({ ...r, days: { ...r.days, [d]: fn(r.days[d]) } }));
  const setGroup = (d, gk, fn) => setDay(d, (day) => ({ ...day, groups: day.groups.map((g) => (g.key === gk ? fn(g) : g)) }));

  const toggleTraining = (d) =>
    setDay(d, (day) => (day ? null : { title: '', groups: [{ key: key(), name: '', items: [] }] }));

  const moveItem = (d, gk, i, dir) =>
    setGroup(d, gk, (g) => {
      const items = [...g.items];
      const j = i + dir;
      if (j < 0 || j >= items.length) return g;
      [items[i], items[j]] = [items[j], items[i]];
      return { ...g, items };
    });

  const addItem = (id, extraExercise) => {
    const { day: d, group: gk } = picker;
    if (extraExercise) setRoutine((r) => ({ ...r, customExercises: { ...r.customExercises, [id]: extraExercise } }));
    setGroup(d, gk, (g) => ({ ...g, items: [...g.items, { key: key(), id, ...defaultsFor(id) }] }));
    setPicker(null);
  };

  const addCustom = (name) => {
    const id = `custom-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${Date.now().toString(36)}`;
    addItem(id, { name, cue: '' });
  };

  const copyDay = (from, to) => {
    if (routine.days[to] && !window.confirm(`Replace ${DAY_NAMES[to]} with a copy of ${DAY_NAMES[from]}?`)) return;
    setDay(to, () => withKeys({ days: { x: stripKeys({ days: { x: routine.days[from] } }).days.x } }).days.x);
  };

  const save = async () => {
    if (problems.length) {
      setShowErrors(true);
      return;
    }
    await saveProfile({ ...profile, routine: stripKeys(routine), planMode: 'custom' });
    navigate('/plan');
  };

  const nameOf = (id) => exerciseInfo({ routine }, id).name;

  return (
    <section className="page-top routine-page">
      <div className="section-label">Customize</div>
      <h1 className="page-title">Your routine.</h1>
      <p className="page-lead">Choose your training days, name them, and add the exercises, sets and reps you want. Save it, and your plan, reminders and calendar follow it.</p>

      {!routine ? (
        <>
          <h2 className="sub-title">Start from…</h2>
          <div className="grid grid-3">
            {starts.map((s) => (
              <button type="button" key={s.id} className="card start-card" onClick={() => start(s.id)}>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <span className="arrow">Start →</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="rt-restart">
            <span className="muted small">Start again from:</span>
            {starts.map((s) => <button type="button" key={s.id} className="chip" onClick={() => start(s.id)}>{s.title}</button>)}
          </div>

          <div className="rt-week">
            {WEEK.map((d) => {
              const day = routine.days[d];
              return (
                <div className={`rt-day ${day ? '' : 'rest'}`} key={d}>
                  <div className="rt-day-head">
                    <strong>{DAY_NAMES[d]}</strong>
                    <div className="rt-toggle" role="group" aria-label={`${DAY_NAMES[d]} type`}>
                      <button type="button" className={day ? 'active' : ''} aria-pressed={Boolean(day)} onClick={() => !day && toggleTraining(d)}>Training</button>
                      <button type="button" className={!day ? 'active' : ''} aria-pressed={!day} onClick={() => day && (day.groups.some((g) => g.items.length) ? window.confirm(`Make ${DAY_NAMES[d]} a rest day? Its exercises will be removed.`) : true) && toggleTraining(d)}>Rest</button>
                    </div>
                  </div>

                  {day ? (
                    <>
                      <input className="rt-title" placeholder="Name this day, e.g. Chest & back" value={day.title} maxLength={40} onChange={(e) => setDay(d, (x) => ({ ...x, title: e.target.value }))} />
                      {day.groups.map((g) => (
                        <div className="rt-group" key={g.key}>
                          <div className="rt-group-head">
                            <input className="rt-group-name" placeholder="Section (optional), e.g. Chest" value={g.name} maxLength={30} onChange={(e) => setGroup(d, g.key, (x) => ({ ...x, name: e.target.value }))} />
                            {day.groups.length > 1 && (
                              <button type="button" className="icon-btn small-btn" aria-label="Remove section" onClick={() => (g.items.length === 0 || window.confirm('Remove this section and its exercises?')) && setDay(d, (x) => ({ ...x, groups: x.groups.filter((y) => y.key !== g.key) }))}>✕</button>
                            )}
                          </div>
                          {g.items.map((item, i) => (
                            <div className="rt-item" key={item.key}>
                              <span className="rt-name">{nameOf(item.id)}</span>
                              <label className="rt-num">
                                <input type="number" min="1" max="10" value={item.sets} onChange={(e) => setGroup(d, g.key, (x) => ({ ...x, items: x.items.map((y) => (y.key === item.key ? { ...y, sets: e.target.value } : y)) }))} aria-label="Sets" />
                                <span className="muted small">sets</span>
                              </label>
                              <span className="muted">×</span>
                              <label className="rt-num rt-reps">
                                <input value={item.reps} maxLength={12} placeholder="8–12" onChange={(e) => setGroup(d, g.key, (x) => ({ ...x, items: x.items.map((y) => (y.key === item.key ? { ...y, reps: e.target.value } : y)) }))} aria-label="Reps" />
                                <span className="muted small">reps</span>
                              </label>
                              <div className="rt-item-actions">
                                <button type="button" className="icon-btn small-btn" aria-label="Move up" disabled={i === 0} onClick={() => moveItem(d, g.key, i, -1)}>↑</button>
                                <button type="button" className="icon-btn small-btn" aria-label="Move down" disabled={i === g.items.length - 1} onClick={() => moveItem(d, g.key, i, 1)}>↓</button>
                                <button type="button" className="icon-btn small-btn" aria-label="Remove exercise" onClick={() => setGroup(d, g.key, (x) => ({ ...x, items: x.items.filter((y) => y.key !== item.key) }))}>✕</button>
                              </div>
                            </div>
                          ))}
                          <button type="button" className="link-btn rt-add" onClick={() => setPicker({ day: d, group: g.key })}>+ Add exercise</button>
                        </div>
                      ))}
                      <div className="rt-day-foot">
                        <button type="button" className="link-btn" onClick={() => setDay(d, (x) => ({ ...x, groups: [...x.groups, { key: key(), name: '', items: [] }] }))}>+ Add section</button>
                        <select className="rt-copy" value="" onChange={(e) => e.target.value && copyDay(d, Number(e.target.value))} aria-label={`Copy ${DAY_NAMES[d]} to another day`}>
                          <option value="">Copy this day to…</option>
                          {WEEK.filter((x) => x !== d).map((x) => <option key={x} value={x}>{DAY_NAMES[x]}</option>)}
                        </select>
                      </div>
                    </>
                  ) : (
                    <p className="muted small">Rest day: sleep, water, protein.</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className={`rt-savebar ${dirty ? 'dirty' : ''}`}>
            <div>
              {showErrors && problems.length > 0 ? (
                <ul className="form-error small rt-problems">{problems.map((p) => <li key={p}>{p}</li>)}</ul>
              ) : (
                <span className="muted small">
                  {WEEK.filter((d) => routine.days[d]).length} training days · {dirty ? 'Unsaved changes' : saved ? 'Saved' : 'Not saved yet'}
                </span>
              )}
            </div>
            <div className="rt-savebar-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => (!dirty || window.confirm('Leave without saving?')) && navigate('/plan')}>Cancel</button>
              <button type="button" className="btn btn-sm" onClick={save}>{profile.planMode === 'custom' ? 'Save routine' : 'Save & use this routine'}</button>
            </div>
          </div>
        </>
      )}

      {picker && <ExercisePicker onPick={(id) => addItem(id)} onCustom={addCustom} onClose={() => setPicker(null)} />}
    </section>
  );
}

export default RoutineEditor;
