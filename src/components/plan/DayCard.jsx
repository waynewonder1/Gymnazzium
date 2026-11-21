import WorkoutTimer from '../WorkoutTimer';
import LiftLog from './LiftLog';
import RunLog from './RunLog';
import RestSettings from './RestSettings';
import ExerciseHowTo from '../ExerciseHowTo';
import { isLoggable, lastLog } from '../../lib/lifts';

const formatDate = (date) => date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

// relation: 'past' | 'today' | 'future'
function DayCard({ day, relation, progress, onToggleCheck, onToggleDone, onToggleMission, onLog, onLogRun, onStartGuided, canGoHome, onToggleHome }) {
  const done = Boolean(progress.done[day.index]);
  const locked = relation === 'future';
  const missionDone = Boolean(progress.missions[day.index]);
  // Run days (planned, or a routine day with only runs) skip the set-by-set coach and rest timer.
  const runOnly = day.type === 'train' && (day.sessionKey === 'run' || day.items.every((item) => item.id === 'run'));

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

      {/* Start sits right under the title so it's on the first screen of a phone. */}
      {day.type === 'train' && !locked && onStartGuided && !runOnly && (
        <button type="button" className="btn guided-start" onClick={onStartGuided}>
          ▶ {done ? 'Do it again, guided' : 'Start workout'}
          <span>One set at a time, with rest timer</span>
        </button>
      )}

      {day.obstacle && (
        <div className="heads-up">
          <strong>Heads-up: {day.obstacle.title}</strong>
          <p>{day.obstacle.text}</p>
        </div>
      )}

      {day.atHome && (
        <div className="home-swap on">
          <span>🏠 <strong>Home version.</strong> Same muscles as {day.gymTitle}, no gym needed.</span>
          {!done && <button type="button" className="link-btn" onClick={onToggleHome}>Back to the gym workout</button>}
        </div>
      )}
      {canGoHome && onToggleHome && (
        <button type="button" className="home-swap" onClick={onToggleHome}>
          🏠 Can't make it to the gym? <strong>Do this workout at home</strong>
        </button>
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
              const logs = !locked && isLoggable(item.id);
              const howTo = item.id !== 'run' && <ExerciseHowTo id={item.id} name={item.name} cue={item.cue} />;
              return (
                <li key={`${item.group ?? ''}-${item.id}`} className={checked ? 'checked' : ''}>
                  {newGroup && <span className="check-group">{item.group}</span>}
                  <label>
                    <input type="checkbox" checked={checked} disabled={locked} onChange={() => onToggleCheck(j)} />
                    <span className="check-body">
                      <span className="check-main">
                        <strong>{item.name}</strong>
                        {/* A logged run shows the distance actually run, with the plan's target underneath. */}
                        {item.id === 'run' && progress.runs?.[day.index] ? (
                          <span className="dose">
                            {progress.runs[day.index].km} km ✓
                            <span className="dose-target">target {item.dose}</span>
                          </span>
                        ) : (
                          <span className="dose">{item.dose}</span>
                        )}
                      </span>
                      <span className="cue">
                        {item.cue}
                        {item.note && <em> {item.note}</em>}
                      </span>
                      {/* With a set log, "How to" shares its row (shorter list on phones). */}
                      {!logs && howTo}
                    </span>
                  </label>
                  {logs && (
                    <LiftLog
                      lead={howTo}
                      key={`${day.index}-${j}`}
                      id={item.id}
                      index={day.index}
                      name={item.name}
                      dose={item.dose}
                      lifts={progress.lifts}
                      last={lastLog(progress.lifts, item.id, day.index)}
                      onSave={(sets) => onLog(j, item.id, sets)}
                    />
                  )}
                  {!locked && item.id === 'run' && (
                    <RunLog key={`${day.index}-${j}`} index={day.index} dose={item.dose} runs={progress.runs} onSave={(run) => onLogRun(j, run)} />
                  )}
                </li>
              );
            })}
          </ul>
          <p className="bookend">{day.cooldown}</p>
          {!locked && !runOnly && <RestSettings />}
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
