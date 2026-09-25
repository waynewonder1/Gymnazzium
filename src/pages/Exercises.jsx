import { useState } from 'react';
import { exercises } from '../data/workouts';
import { exerciseMeta, muscleGroups } from '../data/exerciseMeta';
import ExerciseCard from '../components/ExerciseCard';
import WorkoutTimer from '../components/WorkoutTimer';

const ids = Object.keys(exercises);

function Exercises() {
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState('All');
  const [noKit, setNoKit] = useState(false);

  const q = query.trim().toLowerCase();
  const list = ids.filter((id) => {
    const ex = exercises[id];
    const meta = exerciseMeta[id];
    if (muscle !== 'All' && !meta.muscles.includes(muscle)) return false;
    if (noKit && meta.equipment !== 'None') return false;
    return !q || ex.name.toLowerCase().includes(q) || ex.cue.toLowerCase().includes(q) || meta.muscles.some((m) => m.toLowerCase().includes(q));
  });

  return (
    <section className="page-top">
      <div className="section-label">Exercise library</div>
      <h1 className="page-title">Every move in your plan.</h1>
      <p className="page-lead">Search {ids.length} exercises by name or muscle. Each one comes with a form cue and a starting dose.</p>

      <div className="library-tools">
        <input
          type="search"
          className="search"
          placeholder="Search: push-up, abs, forearms…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search exercises"
        />
        <label className="toggle">
          <input type="checkbox" checked={noKit} onChange={(e) => setNoKit(e.target.checked)} />
          No equipment only
        </label>
      </div>
      <div className="chips muscle-filter">
        {['All', ...muscleGroups].map((m) => (
          <button key={m} className={`chip ${muscle === m ? 'active' : ''}`} aria-pressed={muscle === m} onClick={() => setMuscle(m)}>
            {m}
          </button>
        ))}
      </div>

      <div className="library">
        <div>
          <p className="muted small result-count">{list.length} exercise{list.length === 1 ? '' : 's'}</p>
          {list.length === 0 ? (
            <p className="muted">Nothing matches. Try another search or muscle.</p>
          ) : (
            <div className="exercise-grid">{list.map((id) => <ExerciseCard key={id} id={id} />)}</div>
          )}
        </div>
        <aside className="library-timer">
          <WorkoutTimer />
        </aside>
      </div>
    </section>
  );
}

export default Exercises;
