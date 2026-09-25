import WorkoutTimer from '../WorkoutTimer';

const formatDate = (date) => date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

// relation: 'past' | 'today' | 'future'
function DayCard({ day, relation, progress, onToggleCheck, onToggleDone, onToggleMission }) {
  const done = Boolean(progress.done[day.index]);
  const locked = relation === 'future';
  const missionDone = Boolean(progress.missions[day.index]);

  return (
    <div className={`day-card ${day.type} ${done ? 'is-done' : ''}`}>
      <div className="day-head">
        <div>
          <span className="day-meta">
            {relation === 'today' ? 'Today' : formatDate(day.date)} · Day {day.index + 1} · Week {day.week + 1}
          </span>
          <h3>{day.title}</h3>
          <p className="muted">{day.focus}</p>
        </div>
        {day.type === 'train' && <span className="pill">~{day.minutes} min</span>}
      </div>

      {day.obstacle && (
        <div className="heads-up">
          <strong>Heads-up: {day.obstacle.title}</strong>
          <p>{day.obstacle.text}</p>
        </div>
      )}

      {day.type === 'train' && (
        <>
          <p className="bookend">{day.warmup}</p>
          {day.phaseNote && <p className="phase-note">{day.phaseNote}</p>}
          <ul className="checklist">
            {day.items.map((item, j) => {
              const checked = Boolean(progress.checks[`${day.index}:${j}`]);
              // Gym days are split into muscle groups; show a heading when the group changes.
              const newGroup = item.group && item.group !== day.items[j - 1]?.group;
              return (
                <li key={`${item.group ?? ''}-${item.id}`} className={checked ? 'checked' : ''}>
                  {newGroup && <span className="check-group">{item.group}</span>}
                  <label>
                    <input type="checkbox" checked={checked} disabled={locked} onChange={() => onToggleCheck(j)} />
                    <span className="check-body">
                      <span className="check-main">
                        <strong>{item.name}</strong>
                        <span className="dose">{item.dose}</span>
                      </span>
                      <span className="cue">
                        {item.cue}
                        {item.note && <em> {item.note}</em>}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          <p className="bookend">{day.cooldown}</p>
          {!locked && (
            <details className="day-timer">
              <summary>Rest & interval timer</summary>
              <WorkoutTimer defaultMode={day.sessionKey === 'cardio' ? 'interval' : 'rest'} />
            </details>
          )}
        </>
      )}

      <label className={`mission ${missionDone ? 'checked' : ''}`}>
        <input type="checkbox" checked={missionDone} disabled={locked} onChange={onToggleMission} />
        <span>
          <strong>Daily mission</strong>
          {day.mission}
        </span>
      </label>

      {day.type === 'train' &&
        (locked ? (
          <p className="muted small">Unlocks on {formatDate(day.date)}.</p>
        ) : (
          <button className={`btn ${done ? 'btn-ghost' : ''}`} onClick={onToggleDone}>
            {done ? 'Completed ✓ · Undo' : 'Mark workout complete'}
          </button>
        ))}
    </div>
  );
}

export default DayCard;
