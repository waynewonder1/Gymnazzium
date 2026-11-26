import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CAFFEINE_LIMIT, caffeineSources, skipList, supplements } from '../../data/supplements';
import { addFoods } from '../../lib/food';
import { addCaffeine, caffeineOn, canTakeSupplements, stackOf, streak, takenOn, toggleInStack, toggleTaken } from '../../lib/supplements';

// "My supplements" on the Food page: the member's stack, ticked off per day,
// with a caffeine counter against the daily limit and a streak for daily ones like creatine.
function Supplements({ profile, progress, day, isToday, saveProfile, saveProgress }) {
  const stack = stackOf(profile);
  const [editing, setEditing] = useState(false);

  if (!canTakeSupplements(profile)) {
    return (
      <div className="card flat supp-card">
        <h2 className="supp-h2">Supplements</h2>
        <p className="muted small">Under 18? Skip supplements and get everything from food: it’s all you need while you’re growing. Talk to a doctor before taking anything.</p>
      </div>
    );
  }

  const caffeine = caffeineOn(progress, day);
  const late = isToday && new Date().getHours() >= 16;

  const row = (id) => {
    const s = supplements[id];
    const taken = takenOn(progress, day, id);
    if (s.kind === 'caffeine') {
      const over = caffeine > CAFFEINE_LIMIT;
      return (
        <li key={id} className="supp-row supp-caffeine">
          <div className="supp-name">
            <span aria-hidden="true">{s.icon}</span>
            <span><strong>Caffeine</strong> <span className="muted small">· {caffeine} / {CAFFEINE_LIMIT} mg</span></span>
            {caffeine > 0 && <button type="button" className="link-btn small" onClick={() => saveProgress(addCaffeine(progress, day, -caffeine))}>Clear</button>}
          </div>
          <div className={`progress-bar thin${over ? ' over' : ''}`} role="progressbar" aria-label="Caffeine today" aria-valuenow={caffeine} aria-valuemin="0" aria-valuemax={CAFFEINE_LIMIT}>
            <div style={{ width: `${Math.min(100, (caffeine / CAFFEINE_LIMIT) * 100)}%` }} />
          </div>
          <div className="chips supp-adds">
            {caffeineSources.map((c) => (
              <button type="button" key={c.label} className="chip" onClick={() => saveProgress(addCaffeine(progress, day, c.mg))}>
                + {c.label} <span className="chip-note">{c.mg} mg</span>
              </button>
            ))}
          </div>
          {over && <p className="form-error small">That’s over the 400 mg daily limit. Switch to water for the rest of the day.</p>}
          {!over && late && <p className="muted small">It’s after 4 pm: caffeine now can cost you sleep.</p>}
        </li>
      );
    }
    const days = s.kind === 'daily' ? streak(progress, id, day) : 0;
    return (
      <li key={id} className={`supp-row${taken ? ' taken' : ''}`}>
        <div className="supp-name">
          <span aria-hidden="true">{s.icon}</span>
          <span>
            <strong>{s.name}</strong> <span className="muted small">· {s.dose}</span>
            {days > 1 && <span className="supp-streak"> 🔥 {days} days in a row</span>}
          </span>
          {s.kind === 'shake' ? (
            <button type="button" className={`btn btn-sm${taken ? ' btn-ghost' : ''}`} onClick={() => saveProgress(addFoods(progress, day, [[s.food, 1]]))}>
              {taken ? '+ Another' : 'Log a shake'}
            </button>
          ) : (
            <button type="button" className={`btn btn-sm${taken ? '' : ' btn-ghost'}`} aria-pressed={taken} onClick={() => saveProgress(toggleTaken(progress, day, id))}>
              {taken ? '✓ Taken' : 'Mark taken'}
            </button>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="card flat supp-card">
      <div className="supp-head">
        <h2 className="supp-h2">My supplements</h2>
        {stack.length > 0 && !editing && (
          <button type="button" className="link-btn small" onClick={() => setEditing(true)}>Edit</button>
        )}
      </div>

      {stack.length === 0 && !editing && (
        <>
          <p className="muted small">Taking creatine, protein powder or coffee before training? Track it here, with a streak and a caffeine limit check.</p>
          <button type="button" className="btn btn-sm btn-ghost supp-start" onClick={() => setEditing(true)}>Add my supplements</button>
        </>
      )}

      {stack.length > 0 && !editing && <ul className="supp-list">{stack.map(row)}</ul>}

      {editing && (
        <div className="supp-pick">
          <p className="muted small">Food, training and sleep do 95% of the work. Pick only what you actually take.</p>
          <ul className="supp-options">
            {Object.entries(supplements).map(([id, s]) => {
              const on = stack.includes(id);
              return (
                <li key={id}>
                  <button type="button" className={`supp-option${on ? ' on' : ''}`} aria-pressed={on} onClick={() => saveProfile(toggleInStack(profile, id))}>
                    <span className="supp-option-top">
                      <span aria-hidden="true">{s.icon}</span>
                      <strong>{s.name}</strong>
                      <span className={`supp-level ${s.level}`}>{s.evidence}</span>
                      <span className="supp-check" aria-hidden="true">{on ? '✓' : '+'}</span>
                    </span>
                    <span className="muted small">{s.dose}. {s.when}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <details className="supp-skip">
            <summary>What we don’t list, and why</summary>
            <ul>
              {skipList.map((x) => <li key={x.name}><strong>{x.name}:</strong> <span className="muted">{x.why}</span></li>)}
            </ul>
          </details>
          <p className="muted small">
            Supplements are loosely regulated: buy from trusted sellers, and check with a doctor or pharmacist first if you have a health condition or take medication.{' '}
            <Link to="/learn/supplements">Read the evidence</Link>
          </p>
          <button type="button" className="btn btn-sm" onClick={() => setEditing(false)}>Done</button>
        </div>
      )}
    </div>
  );
}

export default Supplements;
