import { Link } from 'react-router-dom';
import { useMember } from '../context/member';
import { addDays, exerciseInfo, parseDate } from '../lib/plan';
import { formatSets, history, prFor } from '../lib/lifts';
import LiftChart from '../components/LiftChart';

const fmtDate = (d) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

function Progress() {
  const { profile, progress, authReady, syncing } = useMember();

  if (!profile) {
    return (
      <section className="page-top">
        {!authReady || syncing ? <p className="muted">Loading…</p> : (
          <>
            <h1 className="page-title">No plan yet.</h1>
            <Link to="/#register" className="btn">Build my plan</Link>
          </>
        )}
      </section>
    );
  }

  const start = parseDate(profile.startDate);
  const lifts = Object.keys(progress.lifts ?? {})
    .map((id) => ({ id, name: exerciseInfo(profile, id).name, sessions: history(progress.lifts, id) }))
    .filter((l) => l.sessions.length > 0)
    .sort((a, b) => b.sessions.at(-1).index - a.sessions.at(-1).index);

  const totalSessions = new Set(lifts.flatMap((l) => l.sessions.map((s) => s.index))).size;
  const totalVolume = lifts.reduce((sum, l) => sum + l.sessions.reduce((v, s) => v + s.volume, 0), 0);

  return (
    <section className="page-top progress-page">
      <div className="section-label">Progress</div>
      <h1 className="page-title">Every rep counts.</h1>
      <p className="page-lead">Your logged lifts over time. Log sets on any exercise in <Link to="/plan#today">your plan</Link> and they show up here.</p>

      {lifts.length === 0 ? (
        <div className="card flat empty-progress">
          <h3>Nothing logged yet</h3>
          <p>Open today's workout, tap <strong>Log sets</strong> under an exercise, and enter your weight and reps. Your first chart appears after that.</p>
          <Link to="/plan#today" className="btn btn-sm">Go to today's workout</Link>
        </div>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat"><span className="stat-label">Workouts logged</span><strong className="stat-value">{totalSessions}</strong></div>
            <div className="stat"><span className="stat-label">Exercises tracked</span><strong className="stat-value">{lifts.length}</strong></div>
            <div className="stat"><span className="stat-label">Total lifted</span><strong className="stat-value">{Math.round(totalVolume).toLocaleString()} kg</strong><span className="stat-note">Weight × reps, all sets</span></div>
          </div>

          <div className="lift-grid">
            {lifts.map((l) => {
              const weighted = l.sessions.some((s) => s.best.w);
              const unit = weighted ? 'kg' : 'reps';
              const value = (s) => (weighted ? s.best.w ?? 0 : s.best.r);
              const first = value(l.sessions[0]);
              const latest = value(l.sessions.at(-1));
              const change = Math.round((latest - first) * 10) / 10;
              const points = l.sessions.map((s) => ({ x: addDays(start, s.index), y: value(s), label: formatSets(s.sets), pr: Boolean(prFor(progress.lifts, l.id, s.index)) }));
              const prCount = points.filter((p) => p.pr).length;
              return (
                <article className="lift-card" key={l.id}>
                  <div className="lift-card-head">
                    <div>
                      <h3>{l.name}</h3>
                      <span className="muted small">{weighted ? 'Heaviest set' : 'Best set (reps)'} · {l.sessions.length} session{l.sessions.length === 1 ? '' : 's'}{prCount > 0 ? ` · ${prCount} PR${prCount === 1 ? '' : 's'} 🏆` : ''}</span>
                    </div>
                    {l.sessions.length > 1 && (
                      <span className={`lift-change ${change > 0 ? 'up' : change < 0 ? 'down' : ''}`}>
                        {change > 0 ? '▲ +' : change < 0 ? '▼ ' : ''}{change} {unit}
                      </span>
                    )}
                  </div>
                  <LiftChart points={points} unit={unit} />
                  <details className="lift-table">
                    <summary>All sessions</summary>
                    <table>
                      <thead><tr><th scope="col">Date</th><th scope="col">Sets</th></tr></thead>
                      <tbody>
                        {[...l.sessions].reverse().map((s) => (
                          <tr key={s.index}><td>{fmtDate(addDays(start, s.index))}</td><td>{formatSets(s.sets)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </details>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

export default Progress;
